import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Screen } from "../App";
import {
    fetchProducts,
    purchaseProduct,
    generateProductSummary,
} from "../lib/api";

type ProductDetailProps = {
    productId: string;
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

export function ProductDetail({
                                  productId,
                                  onNavigate,
                                  currentUserId,
                              }: ProductDetailProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const [buying, setBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Gemini summary
    const [aiText, setAiText] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const token = useMemo(() => localStorage.getItem("token"), []);

    // 1) 商品を取得
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetchProducts()
            .then((data: Product[]) => {
                const found = data.find((p) => p.id === productId) ?? null;
                setProduct(found);
            })
            .catch((err) => {
                console.error(err);
                setError("商品の取得に失敗しました");
                setProduct(null);
            })
            .finally(() => setLoading(false));
    }, [productId]);

    // 2) 商品が取れたら Gemini で要約生成（B案：詳細を見たとき自動）
    useEffect(() => {
        if (!product) return;

        setAiLoading(true);
        setAiError(null);
        setAiText(null);

        generateProductSummary(product.id)
            .then((res) => setAiText(res.text))
            .catch((e: any) => {
                console.error(e);
                setAiError(e?.message ?? "AI生成に失敗しました");
            })
            .finally(() => setAiLoading(false));
    }, [product]);

    const isOwnProduct = product?.sellerId === currentUserId;
    const isSold = product?.status === "sold";

    const handlePurchase = async () => {
        if (!token) {
            alert("先にログインしてください（tokenがありません）");
            return;
        }
        if (!product) return;

        setBuying(true);
        try {
            await purchaseProduct(product.id, token);
            alert("購入しました！");
            onNavigate({ type: "home" });
        } catch (e: any) {
            console.error(e);
            alert(`購入に失敗しました: ${e?.message ?? "unknown error"}`);
        } finally {
            setBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-md mx-auto p-4">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="mt-8 text-center text-gray-500">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto p-4">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="mt-8 text-center text-red-500">{error}</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-md mx-auto p-4">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="mt-8 text-center text-gray-500">商品が見つかりません</div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Heart className="w-6 h-6" />
                </button>
            </div>

            {/* Main Image */}
            <div className="w-full aspect-[4/3] bg-gray-100">
                <img
                    src={
                        product.imageUrl ||
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop"
                    }
                    alt={product.title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Product Info */}
            <div className="p-6 flex flex-col gap-4">
                <div>
                    <h1 className="mb-2">{product.title}</h1>
                    <div className="text-red-600">
                        ¥{Number(product.price ?? 0).toLocaleString()}
                    </div>
                    {product.status && (
                        <div className="mt-1 text-sm text-gray-500">status: {product.status}</div>
                    )}
                </div>

                <div className="text-gray-600 whitespace-pre-line">{product.description}</div>

                {/* Gemini Summary */}
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Geminiによる紹介</div>

                    {aiLoading && <div className="text-gray-400 text-sm">生成中...</div>}

                    {!aiLoading && aiError && (
                        <div className="text-red-500 text-sm whitespace-pre-line">{aiError}</div>
                    )}

                    {!aiLoading && !aiError && (
                        <div className="text-gray-700 whitespace-pre-line">
                            {aiText ?? "（生成結果なし）"}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                {!isOwnProduct && (
                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            disabled={buying || isSold}
                            onClick={handlePurchase}
                            className={`w-full h-12 rounded-lg text-white ${
                                buying || isSold ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSold ? "売り切れ" : buying ? "購入中..." : "購入する"}
                        </button>

                        <button
                            onClick={() =>
                                onNavigate({
                                    type: "chat",
                                    otherUserId: product.sellerId,
                                    otherUserName: `出品者 (${product.sellerId})`,
                                })
                            }
                            className="w-full h-12 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            メッセージを送る
                        </button>
                    </div>
                )}

                {isOwnProduct && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                        あなたが出品した商品です
                    </div>
                )}
            </div>
        </div>
    );
}