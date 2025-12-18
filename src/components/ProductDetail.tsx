import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Screen } from "../App";
import { fetchUserById } from "../lib/api";
import {
    fetchProducts,
    purchaseProduct,
    generateProductSummary,
    toggleLike,
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

    likeCount?: number;
    likedByMe?: boolean;
};

export function ProductDetail({
                                  productId,
                                  onNavigate,
                                  currentUserId,
                              }: ProductDetailProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [sellerDisplayName, setSellerDisplayName] = useState<string>("");
    const [buying, setBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Gemini summary
    const [aiText, setAiText] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const token = useMemo(() => localStorage.getItem("token") ?? "", []);

    // 1) 商品を取得
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetchProducts(token || undefined)
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
    }, [productId, token]);

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

    useEffect(() => {
        if (!product) return;

        fetchUserById(product.sellerId)
            .then((u) => setSellerDisplayName(u.displayName))
            .catch(() => setSellerDisplayName(product.sellerId));
    }, [product]);

    const isOwnProduct = product?.sellerId === currentUserId;
    const isSold = product?.status === "sold";
    const isConsidering = product?.status === "considering";

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

    const handleToggleLike = async () => {
        if (!token) {
            alert("いいねするにはログインしてください");
            return;
        }
        if (!product) return;

        // 楽観的UI更新
        const nextLiked = !(product.likedByMe ?? false);
        const nextCount = (product.likeCount ?? 0) + (nextLiked ? 1 : -1);
        const optimistic = {
            ...product,
            likedByMe: nextLiked,
            likeCount: Math.max(0, nextCount),
        };
        setProduct(optimistic);

        try {
            const res = await toggleLike(product.id, token);
            setProduct({ ...optimistic, likedByMe: res.liked, likeCount: res.likeCount });
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "いいねに失敗しました");

            // 失敗したら取り直す（確実に戻す）
            try {
                const data: Product[] = await fetchProducts(token || undefined);
                const found = data.find((p) => p.id === productId) ?? null;
                setProduct(found);
            } catch (err) {
                console.error(err);
            }
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

    const likeCount = product.likeCount ?? 0;
    const liked = product.likedByMe ?? false;

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

                {/* 右上：ハート + いいね数 */}
                <button
                    onClick={handleToggleLike}
                    className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100"
                >
                    <Heart
                        className={`w-6 h-6 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`}
                    />
                    <span className="text-sm text-gray-700">{likeCount}</span>
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

                    {/* ★ここ：considering のとき 0円表示しない */}
                    {isConsidering ? (
                        <div className="text-gray-600">価格：未定</div>
                    ) : (
                        <div className="text-red-600">
                            ¥{Number(product.price ?? 0).toLocaleString()}
                        </div>
                    )}

                    {product.status && (
                        <div className="mt-1 text-sm text-gray-500">status: {product.status}</div>
                    )}
                </div>

                <div className="text-gray-600 whitespace-pre-line">{product.description}</div>

                {!isOwnProduct && isConsidering && (
                    <div className="mt-2 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                        この商品は出品検討中です。出品者と価格の合意が取れ次第購入できます。
                    </div>
                )}

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
                        {/* ★購入は considering のとき出さない */}
                        {!isConsidering && (
                            <button
                                disabled={buying || isSold}
                                onClick={handlePurchase}
                                className={`w-full h-12 rounded-lg text-white ${
                                    buying || isSold ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {isSold ? "売り切れ" : buying ? "購入中..." : "購入する"}
                            </button>
                        )}

                        {/* ★DMは常に出す（consideringでもOK） */}
                        <button
                            onClick={() =>
                                onNavigate({
                                    type: "chat",
                                    otherUserId: product.sellerId,
                                    otherUserName: `出品者(${sellerDisplayName})`,
                                    productId: product.id, // ← 追加
                                })
                            }
                            className="w-full h-12 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            メッセージを送る
                        </button>
                    </div>
                )}

                {isOwnProduct && (
                    <div className="mt-4 flex flex-col gap-3">
                        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                            あなたが出品した商品です
                        </div>

                        <button
                            onClick={() => product && onNavigate({ type: "inbox", productId: product.id })}
                            className="w-full h-12 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            メッセージへ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}