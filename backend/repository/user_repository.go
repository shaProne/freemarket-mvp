package repository

import (
	"database/sql"
	"errors"
)

type User struct {
	ID           string
	PasswordHash string
	CreatedAt    string
}

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u User) error {
	_, err := r.db.Exec(
		`INSERT INTO users (id, password_hash, created_at) VALUES (?, ?, ?)`,
		u.ID, u.PasswordHash, u.CreatedAt,
	)
	return err
}

func (r *UserRepository) FindByID(id string) (*User, error) {
	row := r.db.QueryRow(
		`SELECT id, password_hash, created_at FROM users WHERE id = ?`,
		id,
	)

	var u User
	if err := row.Scan(&u.ID, &u.PasswordHash, &u.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &u, nil
}
