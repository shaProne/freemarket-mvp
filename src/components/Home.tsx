import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Search, User, Heart } from "lucide-react";
import { Screen } from "../App";
import { fetchProducts, toggleLike } from "../lib/api";
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

    const token = useMemo(() => localStorage.getItem("token") ?? "", []);

    // 初回ロード：APIから商品取得（失敗したらmockにフォールバック）
    useEffect(() => {
        setLoading(true);
        fetchProducts(token || undefined)
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
    }, [token]);

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

    const handleToggleLike = async (e: MouseEvent, productId: string) => {
        e.stopPropagation(); // ← 商品詳細への遷移クリックを止める

        if (!token) {
            alert("いいねするにはログインしてください");
            return;
        }

        // 楽観的UI更新（先に表示を変える）
        setAllProducts((prev) =>
            prev.map((p) => {
                if (p.id !== productId) return p;
                const liked = !(p.likedByMe ?? false);
                const count = (p.likeCount ?? 0) + (liked ? 1 : -1);
                return { ...p, likedByMe: liked, likeCount: Math.max(0, count) };
            })
        );

        try {
            const res = await toggleLike(productId, token);
            // サーバ結果で確定
            setAllProducts((prev) =>
                prev.map((p) =>
                    p.id === productId
                        ? { ...p, likedByMe: res.liked, likeCount: res.likeCount }
                        : p
                )
            );
        } catch (err: any) {
            console.error(err);
            alert(err?.message ?? "いいねに失敗しました");

            // 失敗したら取り直して整合性を戻す
            try {
                const data = await fetchProducts(token || undefined);
                setAllProducts(data);
                // products は searchEffect で追従する
            } catch (e) {
                console.error(e);
            }
        }
    };

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
                    {products.map((product) => {
                        const likeCount = product.likeCount ?? 0;
                        const liked = product.likedByMe ?? false;

                        return (
                            <button
                                key={product.id}
                                onClick={() =>
                                    onNavigate({ type: "productDetail", productId: product.id })
                                }
                                className="relative flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors big-white"
                            >
                                {/* 右上：ハート + いいね数 */}
                                <button
                                    type="button"
                                    onClick={(e) => handleToggleLike(e, product.id)}
                                    className="absolute top-2 right-2 z-10 flex items-center gap-1 text-red-500"
                                >
                                    <Heart
                                        className={`w-4 h-4 ${
                                            liked ? "fill-red-500 text-red-500" : "text-gray-500"
                                        }`}
                                    />
                                    <span className="text-xs text-gray-700">{likeCount}</span>
                                </button>

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

                                <div className="p-3 flex flex-col items-start gap-1 border-t border-gray-200">

                                {product.status === "considering" ? (
                                        <div className="text-red-600">出品検討中</div>
                                    ) : (
                                        <div className="text-red-600">
                                            {product.status === "considering"
                                                ? "出品検討中"
                                                : `¥${Number(product.price ?? 0).toLocaleString()}`}
                                        </div>
                                    )}
                                    <div className="text-sm text-left line-clamp-2">
                                        {product.title}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {!loading && products.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        該当する商品がありません
                    </div>
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