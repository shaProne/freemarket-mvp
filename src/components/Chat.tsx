import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Screen } from "../App";
import { fetchMessages, sendMessage, fetchMe } from "../lib/api";

type ChatProps = {
    otherUserId: string;
    otherUserName: string;
    productId: string; // ← 必須
    currentUserId: string;
    onNavigate: (screen: Screen) => void;
};

type Msg = {
    id: string;
    productId: string;
    fromUserId: string;
    toUserId: string;
    body: string;
    createdAt: string;
};

export function Chat({
                         otherUserId,
                         otherUserName,
                         productId, // ✅ 受け取る（これが抜けてた）
                         currentUserId,
                         onNavigate,
                     }: ChatProps) {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [myDisplayName, setMyDisplayName] = useState<string>(currentUserId);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = useMemo(() => localStorage.getItem("token") ?? "", []);

    // 自分の displayName（/me）
    useEffect(() => {
        if (!token) return;
        fetchMe(token)
            .then((me) => {
                if (me?.displayName) setMyDisplayName(me.displayName);
            })
            .catch(() => {});
    }, [token]);

    // 会話取得
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError(null);

            if (!token) {
                setError("メッセージを見るにはログインが必要です（tokenがありません）");
                setMessages([]);
                setLoading(false);
                return;
            }

            try {
                // ✅ productId を渡す（productID じゃない）
                const data = await fetchMessages(otherUserId, productId, token);
                const arr = Array.isArray(data) ? data : [];
                if (!cancelled) setMessages(arr);
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? "failed to fetch");
                    setMessages([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [otherUserId, productId, token]); // ✅ productId も依存に入れる

    // スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text) return;

        if (!token) {
            alert("送信にはログインが必要です");
            return;
        }

        setSending(true);
        setError(null);

        try {
            // ✅ 新シグネチャ: (toUserId, productId, body, token)
            const sent = await sendMessage(otherUserId, productId, text, token);

            setMessages((prev) => [...(Array.isArray(prev) ? prev : []), sent]);
            setInputValue("");
        } catch (e: any) {
            setError(e?.message ?? "failed to send");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <div>{otherUserName}</div>
                    <div className="text-xs text-gray-500">あなた: {myDisplayName}</div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && <div className="text-gray-500 text-center">Loading...</div>}

                {!loading && error && (
                    <div className="text-red-500 text-sm whitespace-pre-line">{error}</div>
                )}

                {!loading &&
                    !error &&
                    (messages ?? []).map((msg) => {
                        const isMe = msg.fromUserId === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                                        isMe ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                                    }`}
                                >
                                    {msg.body}
                                    <div
                                        className={`mt-1 text-[10px] ${
                                            isMe ? "text-white/70" : "text-gray-500"
                                        }`}
                                    >
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="h-16 px-4 border-t border-gray-200 flex items-center gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="メッセージを入力"
                    className="flex-1 h-10 px-4 bg-gray-100 rounded-full outline-none focus:bg-gray-200"
                />
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className={`w-10 h-10 text-white rounded-full flex items-center justify-center ${
                        sending ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
