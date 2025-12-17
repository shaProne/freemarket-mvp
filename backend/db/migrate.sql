CREATE TABLE IF NOT EXISTS users (
                                     id TEXT PRIMARY KEY,
                                     password_hash TEXT NOT NULL,
                                     created_at TEXT NOT NULL
);