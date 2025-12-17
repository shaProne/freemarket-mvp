import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { ProductDetail } from "./components/ProductDetail";
import { CreateListing } from "./components/CreateListing";
import { Chat } from "./components/Chat";
import { MyPage } from "./components/MyPage";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";

export type Product = {
    id: string;
    title: string;
    price: number;
    description: string;
    imageUrl?: string;
    sellerId: string;
    status?: string;
    createdAt?: string;
};

export type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
};

export type Screen =
    | { type: "login" }
    | { type: "signup" }
    | { type: "home" }
    | { type: "productDetail"; productId: string }
    | { type: "createListing" }
    | { type: "chat"; otherUserId: string; otherUserName: string }
    | { type: "myPage" };

export default function App() {
    const hasToken = !!localStorage.getItem("token");
    const initialUserId = localStorage.getItem("userId") ?? "";

    const [currentScreen, setCurrentScreen] = useState<Screen>(
        hasToken ? { type: "home" } : { type: "login" }
    );

    const [currentUserId, setCurrentUserId] = useState<string>(initialUserId);

    // token が消されたらログイン画面へ戻す
    useEffect(() => {
        if (!localStorage.getItem("token")) {
            setCurrentScreen({ type: "login" });
        }
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {currentScreen.type === "login" && (
                <Login
                    onNavigate={(screen) => {
                        // Login.tsx から home に戻す想定だが、
                        // 念のため userId をここでも同期
                        const uid = localStorage.getItem("userId") ?? "";
                        setCurrentUserId(uid);
                        setCurrentScreen(screen);
                    }}
                />
            )}

            {currentScreen.type === "signup" && (
                <Signup onNavigate={setCurrentScreen} />
            )}

            {currentScreen.type === "home" && (
                <Home onNavigate={setCurrentScreen} currentUserId={currentUserId} />
            )}

            {currentScreen.type === "productDetail" && (
                <ProductDetail
                    productId={currentScreen.productId}
                    onNavigate={setCurrentScreen}
                    currentUserId={currentUserId}
                />
            )}

            {currentScreen.type === "createListing" && (
                <CreateListing onNavigate={setCurrentScreen} currentUserId={currentUserId} />
            )}

            {currentScreen.type === "chat" && (
                <Chat
                    otherUserId={currentScreen.otherUserId}
                    otherUserName={currentScreen.otherUserName}
                    currentUserId={currentUserId}
                    onNavigate={setCurrentScreen}
                />
            )}

            {currentScreen.type === "myPage" && (
                <MyPage onNavigate={setCurrentScreen} currentUserId={currentUserId} />
            )}
        </div>
    );
}