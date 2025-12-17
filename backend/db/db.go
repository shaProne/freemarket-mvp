package db

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

func NewDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./data.db")
	if err != nil {
		return nil, err
	}

	// テーブル作成
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS products (
		id TEXT PRIMARY KEY,
		title TEXT,
		price INTEGER,
		description TEXT,
		seller_id TEXT,
		status TEXT,
		created_at TEXT
	);
	`)
	if err != nil {
		return nil, err
	}

	return db, nil
}
