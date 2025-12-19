package db

import (
	"database/sql"
	"fmt"
	"os"
)

func NewDB() (*sql.DB, error) {
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST") // /cloudsql/xxx
	name := os.Getenv("DB_NAME")

	if user == "" || pass == "" || host == "" || name == "" {
		return nil, fmt.Errorf("DB env missing")
	}

	// 👇 Cloud Run + Cloud SQL は unix socket
	dsn := fmt.Sprintf(
		"%s:%s@unix(%s)/%s?parseTime=true&charset=utf8mb4&loc=Asia%%2FTokyo",
		user,
		pass,
		host,
		name,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	// 👇 ここで死んでた可能性が高い
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
