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

    // フォーム
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExp, setCardExp] = useState("");
    const [cardCvc, setCardCvc] = useState("");

    // ✅ 修正ポイント1: token と product のチェックを外しました
    // これらは「ボタンを押した時」や「画面表示時」に別途チェックされているため、
    // ここに入れると「入力したのにボタンが押せない」原因になります。
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
                // トークンがなくても商品情報だけは取れるように undefined を渡す等の調整が必要かも
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
        // ✅ 修正ポイント2: ここでトークンチェックを行い、エラーを表示する
        if (!token) {
            setError("ログインが必要です（ログインしてから再度お試しください）");
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
        } catch (e: any) {
            setError(e?.message ?? "購入に失敗しました");
        } finally {
            setBuying(false);
        }
    };

    // ---- UI ----
    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading...</div>;
    }

    if (!product) {
        return <div className="p-6 text-center text-gray-500">商品が見つかりません</div>;
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white pb-10"> {/* pb-10を追加して下部に余白確保 */}
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
                    {/* ...他のinput省略（そのままでOK）... */}
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                        placeholder="電話番号"
                    />
                    <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                        placeholder="住所"
                    />
                    {/* クレジットカード欄 省略（そのままでOK）... */}
                    <div className="p-4 rounded-lg border border-gray-200">
                        <input value={cardNumber} onChange={(e)=>setCardNumber(e.target.value)} className="w-full h-12 px-4 border mb-3 rounded-lg" placeholder="カード番号"/>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={cardExp} onChange={(e)=>setCardExp(e.target.value)} className="w-full h-12 px-4 border rounded-lg" placeholder="MM/YY"/>
                            <input value={cardCvc} onChange={(e)=>setCardCvc(e.target.value)} className="w-full h-12 px-4 border rounded-lg" placeholder="CVC"/>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center whitespace-pre-line font-bold">
                        {error}
                    </div>
                )}

                {/* ✅ 修正ポイント3: 色を少し濃く(bg-gray-500)して視認性を上げました */}
                <button
                    onClick={handlePurchase}
                    disabled={!canSubmit || buying}
                    className={`w-full h-12 text-white font-bold rounded-lg transition-colors ${
                        !canSubmit || buying
                            ? "bg-gray-500 cursor-not-allowed" // グレーを500にして見やすく
                            : "bg-blue-600 hover:bg-blue-700 shadow-md"
                    }`}
                >
                    {buying ? "購入中..." : "購入する"}
                </button>

                {/* デバッグ用：何が足りないか表示（解決したら消してOK） */}
                {/* <div className="text-xs text-red-500">
                    デバッグ:
                    Name:{fullName.length>0?'OK':'NO'},
                    Phone:{phone.length>0?'OK':'NO'},
                    Addr:{address.length>0?'OK':'NO'},
                    Card:{cardNumber.length>0?'OK':'NO'}
                </div>
                */}
            </div>
        </div>
    );
}
