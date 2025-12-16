package main

import "time"

// ===== Domain Models =====

type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       int       `json:"price"`
	ImageURL    string    `json:"imageUrl"`
	SellerID    string    `json:"sellerId"`
	BuyerID     *string   `json:"buyerId,omitempty"`
	Status      string    `json:"status"` // "available" | "sold"
	CreatedAt   time.Time `json:"createdAt"`
}

type Message struct {
	ID        string    `json:"id"`
	FromUser  string    `json:"fromUser"`
	ToUser    string    `json:"toUser"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

// ===== Repository Interfaces =====

type ProductRepository interface {
	List() ([]Product, error)
	GetByID(id string) (*Product, error)
	CreateProduct(p Product) error
	Purchase(productID string, buyerID string) error
}

type MessageRepository interface {
	ListBetween(userA, userB string) ([]Message, error)
	CreateMessage(m Message) error
}
