export async function fetchProducts() {
    const res = await fetch("http://localhost:8080/products")
    if (!res.ok) throw new Error("failed to fetch")
    return res.json()
}
