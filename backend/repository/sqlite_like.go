package repository

import (
	"database/sql"
	"time"
)

type SQLiteLikeRepository struct {
	db *sql.DB
}

func NewSQLiteLikeRepository(db *sql.DB) *SQLiteLikeRepository {
	return &SQLiteLikeRepository{db: db}
}

// いいねON（重複はPRIMARY KEYで防ぐ）
func (r *SQLiteLikeRepository) Like(productID, userID string) error {
	_, err := r.db.Exec(
		`INSERT OR IGNORE INTO likes (product_id, user_id, created_at) VALUES (?, ?, ?)`,
		productID, userID, time.Now().Format(time.RFC3339),
	)
	return err
}

// いいねOFF
func (r *SQLiteLikeRepository) Unlike(productID, userID string) error {
	_, err := r.db.Exec(
		`DELETE FROM likes WHERE product_id = ? AND user_id = ?`,
		productID, userID,
	)
	return err
}

// そのユーザーがいいね済みか
func (r *SQLiteLikeRepository) IsLiked(productID, userID string) (bool, error) {
	var cnt int
	err := r.db.QueryRow(
		`SELECT COUNT(1) FROM likes WHERE product_id = ? AND user_id = ?`,
		productID, userID,
	).Scan(&cnt)
	if err != nil {
		return false, err
	}
	return cnt > 0, nil
}

// 商品のいいね数
func (r *SQLiteLikeRepository) CountByProduct(productID string) (int, error) {
	var cnt int
	err := r.db.QueryRow(
		`SELECT COUNT(1) FROM likes WHERE product_id = ?`,
		productID,
	).Scan(&cnt)
	if err != nil {
		return 0, err
	}
	return cnt, nil
}
