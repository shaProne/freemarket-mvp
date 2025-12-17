package repository

import (
	"database/sql"
	"errors"
	"freemarket-backend/domain"
	"log"
)

type SQLiteProductRepository struct {
	db *sql.DB
}

func NewSQLiteProductRepository(db *sql.DB) *SQLiteProductRepository {
	return &SQLiteProductRepository{db: db}
}

func (r *SQLiteProductRepository) Create(p domain.Product) error {
	_, err := r.db.Exec(
		`INSERT INTO products (
			id, title, price, description, seller_id, status, image_url, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID,
		p.Title,
		p.Price,
		p.Description,
		p.SellerID,
		p.Status,
		p.ImageURL,
		p.CreatedAt,
	)
	if err != nil {
		log.Println("INSERT ERROR:", err)
	}
	return err
}

func (r *SQLiteProductRepository) List() ([]domain.Product, error) {
	rows, err := r.db.Query(`
  SELECT id, title, price, description, seller_id, status,
         COALESCE(image_url, '') as image_url,
         created_at
  FROM products
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		if err := rows.Scan(
			&p.ID, &p.Title, &p.Price, &p.Description,
			&p.SellerID, &p.Status, &p.ImageURL, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

func (r *SQLiteProductRepository) FindByID(id string) (domain.Product, error) {
	row := r.db.QueryRow(`
    SELECT id, title, price, description, seller_id, status, image_url, created_at
    FROM products
    WHERE id = ?
  `, id)

	var p domain.Product
	err := row.Scan(
		&p.ID, &p.Title, &p.Price, &p.Description,
		&p.SellerID, &p.Status, &p.ImageURL, &p.CreatedAt,
	)
	if err != nil {
		return domain.Product{}, err // sql.ErrNoRows もここで返る
	}
	return p, nil
}

func (r *SQLiteProductRepository) Purchase(productID, buyerID string) error {
	res, err := r.db.Exec(
		`UPDATE products SET status = 'sold'
		 WHERE id = ? AND status = 'available'`,
		productID,
	)
	if err != nil {
		return err
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("product not found or already sold")
	}
	return nil
}
