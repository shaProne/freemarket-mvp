import { ArrowLeft, MessageCircle } from "lucide-react";
import { Screen } from "../App";

type PurchaseDoneProps = {
    productId: string;
    sellerId: string;
    sellerName: string;
    currentUserId: string;
    onNavigate: (screen: Screen) => void;
};

export function PurchaseDone({
                                 productId,
                                 sellerId,
                                 sellerName,
                                 onNavigate,
                             }: PurchaseDoneProps) {
    return (
        <div className="max-w-md mx-auto min-h-screen bg-white">
            <div className="h-14 px-4 flex items-center border-b border-gray-200">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="ml-2">購入完了</div>
            </div>

            <div className="p-6 flex flex-col gap-4">
                <div className="p-5 rounded-lg bg-green-50 text-green-900">
                    <div className="text-lg">ご購入ありがとうございます！</div>
                    <div className="mt-2 text-sm">
                        出品者からのメッセージをお待ちください。
                    </div>
                </div>

                <button
                    onClick={() => onNavigate({ type: "productDetail", productId })}
                    className="w-full h-12 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                    商品に戻る
                </button>

                <button
                    onClick={() =>
                        onNavigate({
                            type: "chat",
                            otherUserId: sellerId,
                            otherUserName: `出品者(${sellerName})`,
                            productId,
                        })
                    }
                    className="w-full h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                    <MessageCircle className="w-5 h-5" />
                    メッセージへ移動
                </button>
            </div>
        </div>
    );
}