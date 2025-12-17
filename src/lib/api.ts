const API_BASE = "http://localhost:8080";

export async function fetchProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error("failed to fetch");
    return res.json();
}

export async function createProduct(product: {
    title: string;
    price: number;
    description: string;
    sellerId: string;
    imageUrl?: string;
}) {
    const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `failed to create product (${res.status})`);
    }

    return res.json();
}

export async function purchaseProduct(productId: string, token: string) {
    const res = await fetch(`${API_BASE}/purchase`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "failed to purchase product");
    }

    return res.json();
}

export async function signup(userId: string, password: string, displayName: string, mbti: string) {
    const res = await fetch("http://localhost:8080/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password, mbti }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "signup failed");
    }
    return res.json(); // { status: "ok" } みたいなの
}

// GEMINI
export async function generateProductSummary(productId: string) {
    const res = await fetch(`${API_BASE}/ai/product-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "failed to generate summary");
    }

    return res.json() as Promise<{ text: string }>;
}

export async function login(userId: string, password: string) {
    const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "login failed");
    }
    return res.json(); // { token: "..." }
}

export type UserProfile = {
    userId: string;
    displayName: string;
    mbti: string;
};

// 自分のプロフィールを取る（JWTから判定）
export async function fetchMe(token: string) {
    const res = await fetch(`${API_BASE}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "failed to fetch me");
    }

    return (await res.json()) as UserProfile;
}