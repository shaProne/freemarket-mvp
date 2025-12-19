// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export type Product = {
    id: string;
    title: string;
    price: number;
    description: string;
    sellerId: string;
    status?: string;
    imageUrl?: string;

    likeCount?: number;
    likedByMe?: boolean;
};


export async function fetchProducts(token?: string) {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products`, { headers });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `failed to fetch (${res.status})`);
    }
    return res.json();
}


export async function createProduct(product: {
    title: string;
    price: number;
    description: string;
    sellerId: string;
    imageUrl?: string;
    status?: "available" | "considering";
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
    const res = await fetch(`${API_BASE}/signup`, {   // ←ここ
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password, displayName, mbti }),
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

// DM
export async function fetchMessages(otherUserId: string, productId: string, token: string) {
    const res = await fetch(
        `${API_BASE}/messages?otherUserId=${encodeURIComponent(otherUserId)}&productId=${encodeURIComponent(productId)}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "failed to fetch messages");
    }

    return res.json() as Promise<
        { id: string; productId: string; fromUserId: string; toUserId: string; body: string; createdAt: string }[]
    >;
}

export async function sendMessage(toUserId: string, productId: string, body: string, token: string) {
    const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId, productId, body }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "failed to send message");
    }

    return res.json() as Promise<{
        id: string;
        productId: string;
        fromUserId: string;
        toUserId: string;
        body: string;
        createdAt: string;
    }>;
}

export async function fetchUserById(userId: string) {
    const res = await fetch(`${API_BASE}/users/${userId}`);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "failed to fetch user");
    }

    return res.json() as Promise<{
        userId: string;
        displayName: string;
        mbti: string;
    }>;
}

export async function fetchProductChats(productId: string, token: string) {
    const res = await fetch(`${API_BASE}/product-chats?productId=${encodeURIComponent(productId)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "failed to fetch product chats");
    return JSON.parse(text) as Array<{ userId: string; displayName: string }>;
}


export async function login(userId: string, password: string) {
    const res = await fetch(`${API_BASE}/login`, {    // ←ここ
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

export async function toggleLike(productId: string, token: string) {
    const res = await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || "failed to toggle like");

    // バックが {"likeCount":2,"liked":true} を返している前提
    return JSON.parse(text) as { liked: boolean; likeCount: number };
}

export async function fetchProductsAuthed(token?: string) {
    const res = await fetch(`${API_BASE}/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("failed to fetch");
    return res.json();
}