package domain

type Product struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Price       int    `json:"price"`
	Description string `json:"description"`
	SellerID    string `json:"sellerId"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
}
