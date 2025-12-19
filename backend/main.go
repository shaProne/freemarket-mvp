package main

import (
	"encoding/json"
	"freemarket-backend/auth"
	"freemarket-backend/db"
	"freemarket-backend/domain"
	"freemarket-backend/middleware"
	"freemarket-backend/repository"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv" // ← ★追加
	"golang.org/x/crypto/bcrypt"
)

// ===== CORS =====

func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	// ローカル（Viteなら5173もよく使う）
	if origin == "http://localhost:3000" || origin == "http://localhost:5173" {
		return true
	}
	// Vercel: 本番 + preview まとめて許可
	if origin == "https://freemarket-mvp.vercel.app" {
		return true
	}
	if strings.HasSuffix(origin, ".vercel.app") && strings.HasPrefix(origin, "https://") {
		return true
	}
	return false
}

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		allowed := map[string]bool{
			"http://localhost:3000":             true,
			"https://freemarket-mvp.vercel.app": true,
		}

		if origin == "" || allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		h(w, r)
	}
}

// ===== 任意トークンから userId を取り出す（/products GET 用）=====
// 認証必須ではなく「付いてたら読む」だけ
func tryGetUserID(r *http.Request) (string, bool) {
	h := r.Header.Get("Authorization")
	if h == "" {
		return "", false
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return "", false
	}

	claims, err := auth.VerifyToken(strings.TrimPrefix(h, prefix))
	if err != nil {
		return "", false
	}
	return claims.UserID, true
}

// ===== App =====

func main() {

	// ★ これを最初に書く（他より上）
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ .env not found (using OS env vars)")
	}

	database, err := db.NewDB()
	if err != nil {
		log.Fatal("DB connection failed:", err) // ★ returnじゃなく死ぬ
	}

	store := repository.NewSQLiteProductRepository(database)
	userRepo := repository.NewUserRepository(database)
	likeRepo := repository.NewSQLiteLikeRepository(database)
	msgRepo := repository.NewSQLiteMessageRepository(database)

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
			log.Println("signup insert error:", err) // ★これ必須
			http.Error(w, "user already exists (or db error)", http.StatusBadRequest)
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

	// ===== Me API =====
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

	// ===== Likes API (toggle) =====
	// POST /likes  { productId: "p_xxx" }
	// Authorization: Bearer <token>
	// → 既にいいね済みなら Unlike、未いいねなら Like（= toggle）
	mux.HandleFunc("/likes", withCORS(
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

			userID, ok := middleware.UserIDFromContext(r.Context())
			if !ok {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			liked, err := likeRepo.IsLiked(req.ProductID, userID)
			if err != nil {
				log.Println("likeRepo.IsLiked error:", err)
				http.Error(w, "failed to check like", http.StatusInternalServerError)
				return
			}

			if liked {
				if err := likeRepo.Unlike(req.ProductID, userID); err != nil {
					log.Println("likeRepo.Unlike error:", err)
					http.Error(w, "failed to unlike", http.StatusInternalServerError)
					return
				}
			} else {
				if err := likeRepo.Like(req.ProductID, userID); err != nil {
					log.Println("likeRepo.Like error:", err)
					http.Error(w, "failed to like", http.StatusInternalServerError)
					return
				}
			}

			cnt, err := likeRepo.CountByProduct(req.ProductID)
			if err != nil {
				log.Println("likeRepo.CountByProduct error:", err)
				http.Error(w, "failed to count likes", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			// フロント(toggleLike)は { liked, likeCount } を期待してるのでそれに合わせる
			json.NewEncoder(w).Encode(map[string]any{
				"liked":     !liked,
				"likeCount": cnt,
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

			uid, ok := tryGetUserID(r)

			// いいね数 + 自分がいいねしたか（tokenがあれば）
			for i := range products {
				c, err := likeRepo.CountByProduct(products[i].ID)
				if err != nil {
					log.Println("likeRepo.CountByProduct error:", err)
					c = 0
				}
				products[i].LikeCount = c

				if ok {
					liked, err := likeRepo.IsLiked(products[i].ID, uid)
					if err == nil {
						products[i].LikedByMe = liked
					}
				}
			}

			json.NewEncoder(w).Encode(products)

		case http.MethodPost:
			var p domain.Product
			if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
				http.Error(w, "invalid request body", http.StatusBadRequest)
				return
			}

			p.ID = "p_" + time.Now().Format("150405")
			p.CreatedAt = time.Now().Format(time.RFC3339)

			// status デフォルト
			if p.Status == "" {
				p.Status = "available"
			}

			// status バリデーション（3択）
			if p.Status != "available" && p.Status != "sold" && p.Status != "considering" {
				http.Error(w, "invalid status", http.StatusBadRequest)
				return
			}

			// considering のときは価格を 0 扱い（価格未定）
			if p.Status == "considering" {
				p.Price = 0
			}

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

	// ===== Messages API =====
	// 商品単位で会話するので query に productId 必須
	mux.HandleFunc("/messages", withCORS(
		middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := middleware.UserIDFromContext(r.Context())
			if !ok {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			switch r.Method {
			case http.MethodGet:
				other := r.URL.Query().Get("otherUserId")
				productID := r.URL.Query().Get("productId")
				if other == "" || productID == "" {
					http.Error(w, "otherUserId and productId are required", http.StatusBadRequest)
					return
				}

				msgs, err := msgRepo.ListConversation(userID, other, productID)
				if err != nil {
					http.Error(w, "failed to list messages", http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(msgs)

			case http.MethodPost:
				var req struct {
					ToUserID  string `json:"toUserId"`
					ProductID string `json:"productId"`
					Body      string `json:"body"`
				}
				if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
					http.Error(w, "invalid request", http.StatusBadRequest)
					return
				}
				if req.ToUserID == "" || req.ProductID == "" || req.Body == "" {
					http.Error(w, "toUserId, productId and body are required", http.StatusBadRequest)
					return
				}

				m := domain.Message{
					ID:         "m_" + time.Now().Format("150405.000000000"),
					ProductID:  req.ProductID,
					FromUserID: userID,
					ToUserID:   req.ToUserID,
					Body:       req.Body,
					CreatedAt:  time.Now().Format(time.RFC3339),
				}

				if err := msgRepo.Create(m); err != nil {
					http.Error(w, "failed to send message", http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(m)

			default:
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			}
		}),
	))

	// ===== User API =====
	mux.HandleFunc("/users/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		userID := strings.TrimPrefix(r.URL.Path, "/users/")
		if userID == "" {
			http.Error(w, "userId required", http.StatusBadRequest)
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
	}))

	// ===== Product Chat Users API =====
	// 商品ごとにDMしてきたユーザー一覧（相手一覧）
	mux.HandleFunc("/product-chats", withCORS(
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

			productID := r.URL.Query().Get("productId")
			if productID == "" {
				http.Error(w, "productId is required", http.StatusBadRequest)
				return
			}

			userIDs, err := msgRepo.ListChatUsersByProduct(userID, productID)
			if err != nil {
				http.Error(w, "failed to list chat users", http.StatusInternalServerError)
				return
			}

			type ChatUser struct {
				UserID      string `json:"userId"`
				DisplayName string `json:"displayName"`
			}

			var res []ChatUser
			for _, uid := range userIDs {
				u, err := userRepo.FindByID(uid)
				if err != nil {
					continue
				}
				res = append(res, ChatUser{
					UserID:      uid,
					DisplayName: u.DisplayName,
				})
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(res)
		}),
	))

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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Listening on port", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
