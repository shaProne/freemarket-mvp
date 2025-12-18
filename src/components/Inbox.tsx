import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Screen } from "../App";
import { fetchProductChats } from "../lib/api";

type InboxProps = {
    productId: string;
    currentUserId: string;
    onNavigate: (screen: Screen) => void;
};

type ChatUser = {
    userId: string;
    displayName: string;
};

export function Inbox({ productId, onNavigate }: InboxProps) {
    // ✅ 絶対に配列で持つ（null禁止）
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const token = useMemo(() => localStorage.getItem("token") ?? "", []);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!token) {
                setErr("ログインが必要です（tokenがありません）");
                setLoading(false);
                setUsers([]); // ✅ nullにしない
                return;
            }

            setLoading(true);
            setErr(null);

            try {
                const data = await fetchProductChats(productId, token);

                // ✅ dataがnull/undefined/非配列でも落ちない
                const arr = Array.isArray(data) ? data : [];
                if (!cancelled) setUsers(arr);
            } catch (e: any) {
                console.error(e);
                if (!cancelled) {
                    setErr(e?.message ?? "相手一覧の取得に失敗しました");
                    setUsers([]); // ✅ nullにしない
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [productId, token]);

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-200">
                <button
                    onClick={() => onNavigate({ type: "productDetail", productId })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>メッセージ</div>
            </div>

            {loading && <div className="p-4 text-gray-500 text-center">Loading...</div>}

            {!loading && err && (
                <div className="p-4 text-red-600 text-sm whitespace-pre-line text-center">
                    {err}
                </div>
            )}

            {!loading && !err && (
                <div className="p-4 flex flex-col gap-2">
                    {(users ?? []).length === 0 && (
                        <div className="text-gray-500 text-center py-8">
                            まだメッセージは届いていません
                        </div>
                    )}

                    {(users ?? []).map((u) => (
                        <button
                            key={u.userId}
                            onClick={() =>
                                onNavigate({
                                    type: "chat",
                                    otherUserId: u.userId,
                                    otherUserName: `購入希望者(${u.displayName})`,
                                    productId,
                                })
                            }
                            className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 text-left"
                        >
                            <div className="text-sm text-gray-900">{u.displayName}</div>
                            <div className="text-xs text-gray-500 mt-1">{u.userId}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
