import { useState } from "react";
import { signup, login } from "../lib/api";
import { Screen } from "../App";

const MBTI_LIST = [
    "INTJ","INTP","ENTJ","ENTP",
    "INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ",
    "ISTP","ISFP","ESTP","ESFP",
];

export function Signup({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [mbti, setMbti] = useState("INTP");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!userId || !password || !mbti) {
            setError("userId / password / MBTI を入力してください");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await signup(userId, password, mbti);

            // ついでに自動ログイン（UX良い）
            const { token } = await login(userId, password);
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId);
            localStorage.setItem("mbti", mbti);

            onNavigate({ type: "home" });
        } catch (e: any) {
            setError(e?.message ?? "signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white p-6">
            <h1 className="text-xl mb-6">新規登録</h1>

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
                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="pass1234"
            />

            <label className="block mt-4 mb-2 text-gray-700">MBTI</label>
            <select
                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white"
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
            >
                {MBTI_LIST.map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </select>

            {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}

            <button
                onClick={handleSignup}
                disabled={loading}
                className={`mt-6 w-full h-12 text-white rounded-lg ${
                    loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
                {loading ? "登録中..." : "登録する"}
            </button>

            <button
                onClick={() => onNavigate({ type: "login" } as any)}
                className="mt-4 w-full h-12 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                すでにアカウントがある（ログインへ）
            </button>
        </div>
    );
}