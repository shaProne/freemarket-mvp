package repository

import "database/sql"

type LikeRepository struct {
	db *sql.DB
}

func NewLikeRepository(db *sql.DB) *LikeRepository {
	return &LikeRepository{db: db}
}

func (r *LikeRepository) Add(userID, productID string) error {
	_, err := r.db.Exec(`
		INSERT INTO likes (user_id, product_id)
		VALUES (?, ?)
		ON DUPLICATE KEY UPDATE created_at = NOW()
	`, userID, productID)
	return err
}

func (r *LikeRepository) Remove(userID, productID string) error {
	_, err := r.db.Exec(`
		DELETE FROM likes
		WHERE user_id = ? AND product_id = ?
	`, userID, productID)
	return err
}

func (r *LikeRepository) Count(productID string) (int, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM likes WHERE product_id = ?
	`, productID).Scan(&count)
	return count, err
}
