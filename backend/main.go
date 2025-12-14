package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

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

	mux.HandleFunc("/products", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(products)
	})

	log.Println("Backend running at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
