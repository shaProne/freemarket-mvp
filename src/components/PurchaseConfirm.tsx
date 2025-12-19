import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Screen } from "../App";
import { fetchProducts, purchaseProduct, fetchUserById } from "../lib/api";

type PurchaseConfirmProps = {
    productId: string;
    currentUserId: string;
    onNavigate: (screen: Screen) => void;
};

type Product = {
    id: string;
    title: string;
    price: number;
    description: string;
    sellerId: string;
    status?: string;
};

export function PurchaseConfirm({
                                    productId,
                                    currentUserId,
                                    onNavigate,
                                }: PurchaseConfirmProps) {
    const token = useMemo(() => localStorage.getItem("token") ?? "", []);

    const [product, setProduct] = useState<Product | null>(null);
    const [sellerName, setSellerName] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // フォーム（形式上）
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExp, setCardExp] = useState("");
    const [cardCvc, setCardCvc] = useState("");

    // ✅ 修正箇所: ここから `!!token` と `!!product` を削除しました。
    // 入力欄さえ埋まれば見た目上はボタンを押せるようにします。
    const canSubmit =
        fullName.trim().length > 0 &&
        phone.trim().length > 0 &&
        address.trim().length > 0 &&
        cardNumber.trim().length > 0 &&
        cardExp.trim().length > 0 &&
        cardCvc.trim().length > 0;

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError(null);

            try {
                // ここは修正なし: tokenがなくても商品取得を試みる
                const products = await fetchProducts(token || undefined);
                const p = (products as Product[]).find((x) => x.id === productId) ?? null;

                if (cancelled) return;
                setProduct(p);

                if (p?.sellerId) {
                    try {
                        const u = await fetchUserById(p.sellerId);
                        if (!cancelled) setSellerName(u.displayName || p.sellerId);
                    } catch {
                        if (!cancelled) setSellerName(p.sellerId);
                    }
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "商品の取得に失敗しました");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [productId, token]);

    const handlePurchase = async () => {
        // ✅ 修正箇所: トークンチェックをここ（ボタンを押した瞬間）に移動しました。
        if (!token) {
            setError("ログインが必要です（tokenがありません）");
            return;
        }

        if (!product) return;
        if (!canSubmit) return;

        setBuying(true);
        setError(null);

        try {
            await purchaseProduct(product.id, token);

            onNavigate({
                type: "purchaseDone",
                productId: product.id,
                sellerId: product.sellerId,
                sellerName: sellerName || `出品者(${product.sellerId})`,
            } as any);
            // ↑ Screen型に purchaseDone が未追加なら一旦 as any。
        } catch (e: any) {
            setError(e?.message ?? "購入に失敗しました");
        } finally {
            setBuying(false);
        }
    };

    // ---- UI ----
    if (loading) {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-white">
                <div className="h-14 px-4 flex items-center border-b border-gray-200">
                    <button
                        onClick={() => onNavigate({ type: "productDetail", productId })}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="ml-2">購入確認</div>
                </div>
                <div className="p-6 text-center text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-white">
                <div className="h-14 px-4 flex items-center border-b border-gray-200">
                    <button
                        onClick={() => onNavigate({ type: "home" })}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="ml-2">購入確認</div>
                </div>
                <div className="p-6 text-center text-gray-500">商品が見つかりません</div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="h-14 px-4 flex items-center border-b border-gray-200">
                <button
                    onClick={() => onNavigate({ type: "productDetail", productId })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="ml-2">購入確認</div>
            </div>

            <div className="p-6 flex flex-col gap-5">
                {/* 商品概要 */}
                <div className="p-4 rounded-lg bg-gray-50">
                    <div className="text-sm text-gray-500">購入商品</div>
                    <div className="mt-1">{product.title}</div>
                    <div className="mt-1 text-red-600">¥{Number(product.price ?? 0).toLocaleString()}</div>
                    <div className="mt-1 text-sm text-gray-500">
                        出品者: {sellerName || product.sellerId}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">購入者: {currentUserId}</div>
                </div>

                {/* フォーム */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-gray-700">氏名</label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                            placeholder="例）山田 太郎"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-gray-700">電話番号</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                            placeholder="例）09012345678"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-gray-700">住所</label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                            placeholder="例）東京都..."
                        />
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-3">クレジットカード（形式上）</div>

                        <div className="flex flex-col gap-3">
                            <input
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                                placeholder="カード番号"
                            />

                            {/* ✅ 下段が半分になる & stateに紐づけ */}
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={cardExp}
                                    onChange={(e) => setCardExp(e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                                    placeholder="MM/YY"
                                />
                                <input
                                    value={cardCvc}
                                    onChange={(e) => setCardCvc(e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                                    placeholder="CVC"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center whitespace-pre-line">{error}</div>
                )}

                {/* ✅ ボタンは常に表示、埋まるまで disabled */}
                <button
                    onClick={handlePurchase}
                    disabled={!canSubmit || buying}
                    className={`w-full h-12 text-white rounded-lg ${
                        !canSubmit || buying ? "bg-gray-800" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {buying ? "購入中..." : "購入する"}
                </button>

                <div className="text-xs text-gray-500 text-center">
                    ※ デモなので、入力内容は保存されないピィ
                </div>
            </div>
        </div>
    );
}
