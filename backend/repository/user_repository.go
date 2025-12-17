package repository

import (
	"database/sql"
	"freemarket-backend/domain"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u domain.User) error {
	_, err := r.db.Exec(
		`INSERT INTO users (id, password_hash, display_name, mbti, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		u.ID,
		u.PasswordHash,
		u.DisplayName,
		u.MBTI,
		u.CreatedAt,
	)
	return err
}

func (r *UserRepository) FindByID(id string) (domain.User, error) {
	row := r.db.QueryRow(`
		SELECT
			id,
			password_hash,
			COALESCE(display_name, ''),
			COALESCE(mbti, ''),
			created_at
		FROM users
		WHERE id = ?
	`, id)

	var u domain.User
	if err := row.Scan(&u.ID, &u.PasswordHash, &u.DisplayName, &u.MBTI, &u.CreatedAt); err != nil {
		return domain.User{}, err
	}
	return u, nil
}
