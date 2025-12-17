package repository

import (
	"database/sql"
	"errors"
	"freemarket-backend/domain"
)

type SQLiteProductRepository struct {
	db *sql.DB
}

func NewSQLiteProductRepository(db *sql.DB) *SQLiteProductRepository {
	return &SQLiteProductRepository{db: db}
}

func (r *SQLiteProductRepository) Create(p domain.Product) error {
	_, err := r.db.Exec(
		`INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Title, p.Price, p.Description, p.SellerID, p.Status, p.CreatedAt,
	)
	return err
}

func (r *SQLiteProductRepository) List() ([]domain.Product, error) {
	rows, err := r.db.Query(`
		SELECT id, title, price, description, seller_id, status, created_at
		FROM products
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		rows.Scan(&p.ID, &p.Title, &p.Price, &p.Description, &p.SellerID, &p.Status, &p.CreatedAt)
		products = append(products, p)
	}
	return products, nil
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
