import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import { Screen } from "../App";
import { fetchProducts } from "../lib/api";
import { mockProducts } from "../lib/mockData";

type HomeProps = {
    onNavigate: (screen: Screen) => void;
    currentUserId: string;
};

export function Home({ onNavigate }: HomeProps) {
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // 初回ロード：APIから商品取得（失敗したらmockにフォールバック）
    useEffect(() => {
        setLoading(true);
        fetchProducts()
            .then((data) => {
                setAllProducts(data);
                setProducts(data);
            })
            .catch((err) => {
                console.error("fetchProducts failed:", err);
                setAllProducts(mockProducts as any[]);
                setProducts(mockProducts as any[]);
            })
            .finally(() => setLoading(false));
    }, []);

    // 検索：allProductsをフィルタしてproductsへ反映
    useEffect(() => {
        if (!searchQuery.trim()) {
            setProducts(allProducts);
            return;
        }

        const q = searchQuery.toLowerCase();
        const filtered = allProducts.filter((p) => {
            const title = (p.title ?? p.name ?? "").toLowerCase();
            const desc = (p.description ?? "").toLowerCase();
            return title.includes(q) || desc.includes(q);
        });

        setProducts(filtered);
    }, [searchQuery, allProducts]);

    return (
        <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200">
                <div>マーケットプレイス</div>
                <button
                    onClick={() => onNavigate({ type: "myPage" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <User className="w-6 h-6" />
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="商品を検索"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-100 rounded-lg outline-none focus:bg-gray-200"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="p-4 text-gray-500 text-center">Loading products...</div>
            )}

            {/* Product Grid */}
            <div className="px-4 pb-20">
                <div className="grid grid-cols-2 gap-3">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => onNavigate({ type: "productDetail", productId: product.id })}
                            className="flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                            <div className="aspect-square bg-gray-100">
                                <img
                                    src={
                                        product.imageUrl ||
                                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
                                    }
                                    alt={product.title || "product"}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="p-3 flex flex-col items-start gap-1">
                                <div className="text-red-600">¥{Number(product.price ?? 0).toLocaleString()}</div>
                                <div className="text-sm text-left line-clamp-2">{product.title}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {!loading && products.length === 0 && (
                    <div className="text-center text-gray-500 py-8">該当する商品がありません</div>
                )}
            </div>


            {/* Floating Action Button */}
            <button
                onClick={() => onNavigate({ type: "createListing" })}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
            >
                <span className="text-2xl">+</span>
            </button>
        </div>
    );
}