import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { ProductDetail } from "./components/ProductDetail";
import { CreateListing } from "./components/CreateListing";
import { Chat } from "./components/Chat";
import { MyPage } from "./components/MyPage";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Inbox } from "./components/Inbox"; // パスは君の構成に合わせて
import { PurchaseConfirm } from "./components/PurchaseConfirm";
import { PurchaseDone } from "./components/PurchaseDone";

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
    | { type: "inbox"; productId: string } // ← 追加
    | {
    type: "chat";
    otherUserId: string;
    otherUserName: string;
    productId: string; // ← 追加
}
    | { type: "myPage" }
    | { type: "purchaseConfirm"; productId: string }
    | { type: "purchaseDone"; productId: string; sellerId: string; sellerName: string };

export default function App() {
    const hasToken = !!localStorage.getItem("token");
    const initialUserId = localStorage.getItem("userId") ?? "";

    const [currentScreen, setCurrentScreen] = useState<Screen>(
        hasToken ? {type: "home"} : {type: "login"}
    );

    const [currentUserId, setCurrentUserId] = useState<string>(initialUserId);

    // token が消されたらログイン画面へ戻す
    useEffect(() => {
        if (!localStorage.getItem("token")) {
            setCurrentScreen({type: "login"});
        }
    }, []);

    return (
        <div className="min-h-screen relative">
            {/* 背景画像 */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 0,
                    backgroundImage: "url(/bgg.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(0px)",
                    transform: "scale(1.05)", // ぼかしの端の白抜け防止
                }}
            />

            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1,
                    backgroundColor: "rgba(255,255,255,0.1)", // 読みやすさ用の薄い膜
                    pointerEvents: "none",
                }}
            />

            {/* アプリ本体 */}
            <div className="relative z-10 max-w-md mx-auto min-h-screen">
                {currentScreen.type === "login" && (
                    <Login
                        onNavigate={(screen) => {
                            const uid = localStorage.getItem("userId") ?? "";
                            setCurrentUserId(uid);
                            setCurrentScreen(screen);
                        }}
                    />
                )}

                {currentScreen.type === "signup" && <Signup onNavigate={setCurrentScreen}/>}

                {currentScreen.type === "home" && (
                    <Home onNavigate={setCurrentScreen} currentUserId={currentUserId}/>
                )}

                {currentScreen.type === "productDetail" && (
                    <ProductDetail
                        productId={currentScreen.productId}
                        onNavigate={setCurrentScreen}
                        currentUserId={currentUserId}
                    />
                )}

                {currentScreen.type === "createListing" && (
                    <CreateListing onNavigate={setCurrentScreen} currentUserId={currentUserId}/>
                )}

                {currentScreen.type === "inbox" && (
                    <Inbox
                        productId={currentScreen.productId}
                        currentUserId={currentUserId}
                        onNavigate={setCurrentScreen}
                    />
                )}

                {currentScreen.type === "chat" && (
                    <Chat
                        otherUserId={currentScreen.otherUserId}
                        otherUserName={currentScreen.otherUserName}
                        productId={currentScreen.productId}
                        currentUserId={currentUserId}
                        onNavigate={setCurrentScreen}
                    />
                )}

                {currentScreen.type === "myPage" && (
                    <MyPage onNavigate={setCurrentScreen} currentUserId={currentUserId}/>
                )}

                {currentScreen.type === "purchaseConfirm" && (
                    <PurchaseConfirm
                        productId={currentScreen.productId}
                        currentUserId={currentUserId}
                        onNavigate={setCurrentScreen}
                    />
                )}

                {currentScreen.type === "purchaseDone" && (
                    <PurchaseDone
                        productId={currentScreen.productId}
                        sellerId={currentScreen.sellerId}
                        sellerName={currentScreen.sellerName}
                        currentUserId={currentUserId}
                        onNavigate={setCurrentScreen}
                    />
                )}
            </div>
        </div>
    );
}