package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"freemarket-backend/auth"
	"freemarket-backend/db"
	"freemarket-backend/domain"
	"freemarket-backend/middleware"
	"freemarket-backend/repository"

	"golang.org/x/crypto/bcrypt"
)

// ===== CORS =====

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		h(w, r)
	}
}

// ===== App =====

func main() {
	database, err := db.NewDB()
	if err != nil {
		log.Fatal(err)
	}

	store := repository.NewSQLiteProductRepository(database)
	userRepo := repository.NewUserRepository(database)

	mux := http.NewServeMux()

	// health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	// ===== Signup API =====
	mux.HandleFunc("/signup", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			UserID      string `json:"userId"`
			Password    string `json:"password"`
			DisplayName string `json:"displayName"`
			MBTI        string `json:"mbti"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		if req.UserID == "" || req.Password == "" {
			http.Error(w, "userId and password are required", http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "failed to hash password", http.StatusInternalServerError)
			return
		}

		err = userRepo.Create(domain.User{
			ID:           req.UserID,
			PasswordHash: string(hash),
			DisplayName:  req.DisplayName,
			MBTI:         req.MBTI,
			CreatedAt:    time.Now().Format(time.RFC3339),
		})
		if err != nil {
			http.Error(w, "user already exists (or db error)", http.StatusBadRequest)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))

	// ===== Login API =====
	mux.HandleFunc("/login", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			UserID   string `json:"userId"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		if req.UserID == "" || req.Password == "" {
			http.Error(w, "userId and password are required", http.StatusBadRequest)
			return
		}

		u, err := userRepo.FindByID(req.UserID)
		if err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		token, err := auth.IssueToken(req.UserID)
		if err != nil {
			http.Error(w, "failed to generate token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"token": token,
		})
	}))

	// ===== Me API (IMPORTANT: login の外に置く) =====
	mux.HandleFunc("/me", withCORS(
		middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
				return
			}

			userID, ok := middleware.UserIDFromContext(r.Context())
			if !ok {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			u, err := userRepo.FindByID(userID)
			if err != nil {
				http.Error(w, "user not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"userId":      u.ID,
				"displayName": u.DisplayName,
				"mbti":        u.MBTI,
			})
		}),
	))

	// ===== Product API =====
	mux.HandleFunc("/products", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch r.Method {
		case http.MethodGet:
			products, err := store.List()
			if err != nil {
				log.Println("store.List error:", err)
				http.Error(w, "failed to list products", http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(products)

		case http.MethodPost:
			var p domain.Product
			if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
				http.Error(w, "invalid request body", http.StatusBadRequest)
				return
			}

			p.ID = "p_" + time.Now().Format("150405")
			p.Status = "available"
			p.CreatedAt = time.Now().Format(time.RFC3339)

			if err := store.Create(p); err != nil {
				http.Error(w, "failed to create product", http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(p)

		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// ===== GEMINI API =====
	mux.HandleFunc("/ai/product-summary", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			ProductID string `json:"productId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ProductID == "" {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		p, err := store.FindByID(req.ProductID)
		if err != nil {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}

		text, err := auth.GenerateProductSummary(p)
		if err != nil {
			log.Println("GenerateProductSummary error:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"text": text,
		})
	}))

	// ===== Purchase API =====
	mux.HandleFunc("/purchase", withCORS(
		middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
				return
			}

			var req struct {
				ProductID string `json:"productId"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ProductID == "" {
				http.Error(w, "invalid request", http.StatusBadRequest)
				return
			}

			buyerID, ok := middleware.UserIDFromContext(r.Context())
			if !ok {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			if err := store.Purchase(req.ProductID, buyerID); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"status": "sold"})
		}),
	))

	log.Println("Backend running at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
