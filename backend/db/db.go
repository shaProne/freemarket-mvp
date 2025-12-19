package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

func NewDB() (*sql.DB, error) {
	// Cloud Run で設定した環境変数を使う
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST") // 例: 127.0.0.1 (Cloud SQL Auth Proxy)
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf(
		"%s:%s@unix(%s)/%s?parseTime=true&charset=utf8mb4",
		user,
		pass,
		host, // ← /cloudsql/INSTANCE_CONNECTION_NAME
		name,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
