package main

import (
	"errors"
	"sync"
	"time"
)

// ===== In-memory DB =====

type InMemoryStore struct {
	mu       sync.Mutex
	products []Product
	messages []Message
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		products: []Product{},
		messages: []Message{},
	}
}

// ===== Product Repository =====

func (s *InMemoryStore) List() ([]Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.products, nil
}

func (s *InMemoryStore) GetByID(id string) (*Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, p := range s.products {
		if p.ID == id {
			cp := p
			return &cp, nil
		}
	}
	return nil, errors.New("product not found")
}

func (s *InMemoryStore) CreateProduct(p Product) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.products = append(s.products, p)
	return nil
}

func (s *InMemoryStore) Purchase(productID string, buyerID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, p := range s.products {
		if p.ID == productID {
			if p.Status == "sold" {
				return errors.New("already sold")
			}
			s.products[i].Status = "sold"
			s.products[i].BuyerID = &buyerID
			return nil
		}
	}
	return errors.New("product not found")
}

// ===== Message Repository =====

func (s *InMemoryStore) ListBetween(userA, userB string) ([]Message, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var result []Message
	for _, m := range s.messages {
		if (m.FromUser == userA && m.ToUser == userB) ||
			(m.FromUser == userB && m.ToUser == userA) {
			result = append(result, m)
		}
	}
	return result, nil
}

func (s *InMemoryStore) CreateMessage(m Message) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	m.ID = "msg_" + time.Now().Format("150405.000")
	m.CreatedAt = time.Now()
	s.messages = append(s.messages, m)
	return nil
}
