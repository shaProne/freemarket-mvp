import { useState } from "react";
import { login } from "../lib/api";
import { Screen } from "../App";

export function Login({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!userId || !password) {
            setError("userId と password を入力してください");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { token } = await login(userId, password);
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId);
            onNavigate({ type: "home" });
        } catch (e: any) {
            setError(e?.message ?? "login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white p-6">
            <h1 className="text-xl mb-6">ログイン：u_999, pass1234をお使いください。</h1>

            <label className="block mb-2 text-gray-700">User ID</label>
            <input
                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="u_001"
            />

            <label className="block mt-4 mb-2 text-gray-700">Password</label>
            <input
                type="password"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600 mb-4"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="pass1234"
            />



            {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}

            <button
                onClick={handleLogin}
                disabled={loading}
                className={`mt-6 w-full h-12 text-white rounded-lg ${
                    loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
                {loading ? "ログイン中..." : "ログイン"}
            </button>

            <button
                onClick={() => onNavigate({ type: "signup" })}
                className="mt-4 w-full h-12 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                新規登録
            </button>

        </div>
    );
}