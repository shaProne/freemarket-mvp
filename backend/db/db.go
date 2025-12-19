package db

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"os"
)

func NewDB() (*sql.DB, error) {
	// Cloud Run 判定
	if os.Getenv("K_SERVICE") != "" {
		return newCloudSQL()
	}
	return newSQLite()
}

func newCloudSQL() (*sql.DB, error) {
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	socket := os.Getenv("DB_HOST") // /cloudsql/PROJECT:REGION:INSTANCE
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf(
		"%s:%s@unix(%s)/%s?parseTime=true&charset=utf8mb4",
		user, pass, socket, name,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	// Ping失敗しても panic させない
	if err := db.Ping(); err != nil {
		fmt.Println("⚠️ CloudSQL ping failed:", err)
	}

	return db, nil
}

func newSQLite() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./data.db")
	if err != nil {
		return nil, err
	}
	return db, nil
}
