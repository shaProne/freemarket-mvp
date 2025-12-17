package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"freemarket-backend/domain"
)

type geminiReq struct {
	Contents []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
}

type geminiRes struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func GenerateText(prompt string) (string, error) {
	key := os.Getenv("GEMINI_API_KEY")
	if key == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not set")
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s",
		key,
	)

	// リトライ（503対策）
	backoffs := []time.Duration{0, 800 * time.Millisecond, 1600 * time.Millisecond}

	var lastStatus int
	var lastBody string

	for i, wait := range backoffs {
		if wait > 0 {
			time.Sleep(wait)
		}

		req := geminiReq{
			Contents: []struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			}{
				{
					Parts: []struct {
						Text string `json:"text"`
					}{{Text: prompt}},
				},
			},
		}

		b, _ := json.Marshal(req)
		httpReq, _ := http.NewRequest("POST", url, bytes.NewReader(b))
		httpReq.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			return "", err
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		lastStatus = resp.StatusCode
		lastBody = string(bodyBytes)

		if resp.StatusCode == 503 && i < len(backoffs)-1 {
			// overloaded → retry
			continue
		}

		if resp.StatusCode >= 300 {
			return "", fmt.Errorf("gemini error status=%d body=%s", resp.StatusCode, lastBody)
		}

		var gr geminiRes
		if err := json.Unmarshal(bodyBytes, &gr); err != nil {
			return "", err
		}
		if len(gr.Candidates) == 0 || len(gr.Candidates[0].Content.Parts) == 0 {
			return "", fmt.Errorf("gemini returned empty")
		}
		return gr.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("gemini error status=%d body=%s", lastStatus, lastBody)
}

func GenerateProductSummary(p domain.Product) (string, error) {
	prompt := fmt.Sprintf(
		`以下の商品について、購入検討者向けに短く紹介してください。


【説明】%s

条件：
- 魅力を何点か伝える。
- 日本語
- 簡潔に
- 注意点は述べない
- **での強調禁止
`,
		p.Title, p.Price, p.Description,
	)
	return GenerateText(prompt)
}
