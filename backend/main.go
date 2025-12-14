package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		h(w, r)
	}
}

type Product struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Price       int    `json:"price"`
	Description string `json:"description"`
	SellerID    string `json:"sellerId"`
	CreatedAt   string `json:"createdAt"`
}

var products = []Product{
	{
		ID:          "p_001",
		Title:       "MacBook Air M1",
		Price:       78000,
		Description: "状態良好です",
		SellerID:    "u_001",
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
	},
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	mux.HandleFunc("/products", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch r.Method {
		case http.MethodGet:
			json.NewEncoder(w).Encode(products)

		case http.MethodPost:
			var p Product
			if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
				http.Error(w, "invalid request body", http.StatusBadRequest)
				return
			}
			p.ID = "p_" + time.Now().Format("150405")
			p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
			products = append(products, p)
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(p)

		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	log.Println("Backend running at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
