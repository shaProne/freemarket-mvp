package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"freemarket-backend/db"
	"freemarket-backend/domain"
	"freemarket-backend/repository"
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

	mux := http.NewServeMux()

	// health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	// ===== Product API =====

	mux.HandleFunc("/products", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch r.Method {

		case http.MethodGet:
			products, err := store.List()
			if err != nil {
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

	// ===== 購入API =====
	mux.HandleFunc("/purchase", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			ProductID string `json:"productId"`
			BuyerID   string `json:"buyerId"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		if err := store.Purchase(req.ProductID, req.BuyerID); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "sold",
		})
	}))

	log.Println("Backend running at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
