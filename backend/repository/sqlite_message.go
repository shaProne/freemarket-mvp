package repository

import (
	"database/sql"
	"freemarket-backend/domain"
)

type SQLiteMessageRepository struct {
	db *sql.DB
}

func NewSQLiteMessageRepository(db *sql.DB) *SQLiteMessageRepository {
	return &SQLiteMessageRepository{db: db}
}

func (r *SQLiteMessageRepository) Create(m domain.Message) error {
	_, err := r.db.Exec(
		`INSERT INTO messages (id, product_id, from_user_id, to_user_id, body, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
		m.ID, m.ProductID, m.FromUserID, m.ToUserID, m.Body, m.CreatedAt,
	)
	return err
}

// 商品ごとの会話相手一覧を取得
func (r *SQLiteMessageRepository) ListChatUsersByProduct(
	userID string,
	productID string,
) ([]string, error) {

	rows, err := r.db.Query(`
		SELECT DISTINCT
		  CASE
		    WHEN from_user_id = ? THEN to_user_id
		    ELSE from_user_id
		  END AS other_user_id
		FROM messages
		WHERE product_id = ?
		  AND (from_user_id = ? OR to_user_id = ?)
	`, userID, productID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []string
	for rows.Next() {
		var uid string
		if err := rows.Scan(&uid); err != nil {
			return nil, err
		}
		users = append(users, uid)
	}
	return users, nil
}

// 2人の会話を時系列で取る（direction両方）
func (r *SQLiteMessageRepository) ListConversation(userID, otherUserID, productID string) ([]domain.Message, error) {
	rows, err := r.db.Query(`
		SELECT id, product_id, from_user_id, to_user_id, body, created_at
		FROM messages
		WHERE product_id = ?
		  AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
		ORDER BY created_at ASC
	`, productID, userID, otherUserID, otherUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []domain.Message{}
	for rows.Next() {
		var m domain.Message
		if err := rows.Scan(
			&m.ID,
			&m.ProductID,
			&m.FromUserID,
			&m.ToUserID,
			&m.Body,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}
