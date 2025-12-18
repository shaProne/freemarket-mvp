package domain

type Message struct {
	ID         string `json:"id"`
	ProductID  string `json:"productId"` // ← これを追加
	FromUserID string `json:"fromUserId"`
	ToUserID   string `json:"toUserId"`
	Body       string `json:"body"`
	CreatedAt  string `json:"createdAt"`
}
