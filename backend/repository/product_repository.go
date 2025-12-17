package repository

import "freemarket-backend/domain"

type ProductRepository interface {
	Create(p domain.Product) error
	List() ([]domain.Product, error)
	Purchase(productID, buyerID string) error
}
