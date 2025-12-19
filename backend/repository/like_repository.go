package repository

import (
	"database/sql"
)

type LikeRepository struct {
	db *sql.DB
}

func NewLikeRepository(db *sql.DB) *LikeRepository {
	return &LikeRepository{db: db}
}

func (r *LikeRepository) IsLiked(productID, userID string) (bool, error) {
	var dummy int
	err := r.db.QueryRow(`
		SELECT 1 FROM likes
		WHERE user_id = ? AND product_id = ?
		LIMIT 1
	`, userID, productID).Scan(&dummy)

	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *LikeRepository) Like(productID, userID string) error {
	_, err := r.db.Exec(`
			INSERT INTO likes (user_id, product_id, created_at)
			VALUES (?, ?, NOW())
			ON DUPLICATE KEY UPDATE created_at = NOW()
	`, userID, productID)
	return err
}

func (r *LikeRepository) Unlike(productID, userID string) error {
	_, err := r.db.Exec(`
		DELETE FROM likes
		WHERE user_id = ? AND product_id = ?
	`, userID, productID)
	return err
}

func (r *LikeRepository) CountByProduct(productID string) (int, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM likes WHERE product_id = ?
	`, productID).Scan(&count)
	return count, err
}
