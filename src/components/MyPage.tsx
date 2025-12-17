import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Screen } from "../App";
import { fetchProducts } from "../lib/api";

type MyPageProps = {
    onNavigate: (screen: Screen) => void;
    currentUserId: string;
};

type Product = {
    id: string;
    title: string;
    price: number;
    description: string;
    sellerId: string;
    status?: string;
    imageUrl?: string;
};

export function MyPage({ onNavigate, currentUserId }: MyPageProps) {
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        onNavigate({ type: "login" });
    };

    useEffect(() => {
        setLoading(true);
        fetchProducts()
            .then((data: Product[]) => {
                const mine = data.filter((p) => p.sellerId === currentUserId);
                setMyProducts(mine);
            })
            .catch((err) => {
                console.error(err);
                setMyProducts([]);
            })
            .finally(() => setLoading(false));
    }, [currentUserId]);

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center">
                    <button
                        onClick={() => onNavigate({ type: "home" })}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="ml-2">マイページ</div>
                </div>

                <button
                    onClick={handleLogout}
                    ClassName="text-sm px-8 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                    ログアウト
                </button>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-200">
                <div className="text-gray-600">ユーザーID</div>
                <div className="mt-1">{currentUserId}</div>
            </div>

            {/* User's Listings */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2>あなたの出品一覧</h2>
                    <button
                        onClick={() => onNavigate({ type: "createListing" })}
                        className="px-4 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>出品</span>
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-500">Loading...</div>
                ) : myProducts.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        まだ出品した商品はありません
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {myProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() =>
                                    onNavigate({ type: "productDetail", productId: product.id })
                                }
                                className="flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <div className="aspect-square bg-gray-100">
                                    <img
                                        src={
                                            product.imageUrl ||
                                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
                                        }
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-3 flex flex-col items-start gap-1">
                                    <div className="text-red-600">
                                        ¥{Number(product.price ?? 0).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-left line-clamp-2">
                                        {product.title}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}