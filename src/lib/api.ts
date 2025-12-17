export async function fetchProducts() {
    const res = await fetch("http://localhost:8080/products")
    if (!res.ok) throw new Error("failed to fetch")
    return res.json()
}

export async function createProduct(product: {
    title: string;
    price: number;
    description: string;
    sellerId: string;
}) {
    const res = await fetch("http://localhost:8080/products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
    });

    if (!res.ok) {
        throw new Error("failed to create product");
    }

    return res.json();
}

export async function purchaseProduct(productId: string, token: string) {
    const res = await fetch("http://localhost:8080/purchase", {
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
