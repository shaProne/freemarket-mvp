package middleware

import (
	"context"
	"net/http"
	"strings"

	"freemarket-backend/auth"
)

type ctxKey string

const userIDKey ctxKey = "userId"

func UserIDFromContext(ctx context.Context) (string, bool) {
	v := ctx.Value(userIDKey)
	s, ok := v.(string)
	return s, ok
}

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" {
			http.Error(w, "missing Authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "invalid Authorization header", http.StatusUnauthorized)
			return
		}

		claims, err := auth.VerifyToken(parts[1])
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next(w, r.WithContext(ctx))
	}
}
