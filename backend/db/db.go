package db

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
)

func NewDB() (*sql.DB, error) {
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	name := os.Getenv("DB_NAME")
	host := os.Getenv("DB_HOST") // /cloudsql/PROJECT:REGION:INSTANCE

	var dsn string

	if strings.HasPrefix(host, "/cloudsql/") {
		// ✅ Cloud Run（UNIX socket）
		dsn = fmt.Sprintf(
			"%s:%s@unix(%s)/%s?parseTime=true&charset=utf8mb4",
			user, pass, host, name,
		)
	} else {
		// ✅ local（TCP）
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "3306"
		}
		dsn = fmt.Sprintf(
			"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
			user, pass, host, port, name,
		)
	}

	return sql.Open("mysql", dsn)
}
