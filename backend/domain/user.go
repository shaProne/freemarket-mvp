package domain

type User struct {
	ID           string `json:"userId"`
	PasswordHash string `json:"-"` // 絶対返さない
	DisplayName  string `json:"displayName"`
	MBTI         string `json:"mbti"`
	CreatedAt    string `json:"createdAt"`
}
