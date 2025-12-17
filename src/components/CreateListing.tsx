import { useState, useRef, ChangeEvent } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { Screen } from "../App";
import { createProduct } from "../lib/api";
import { uploadImage } from "../lib/upload";

type CreateListingProps = {
    onNavigate: (screen: Screen) => void;
    currentUserId: string;
};

export function CreateListing({ onNavigate, currentUserId }: CreateListingProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<"available" | "considering">("available");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        // considering のときは price 不要
        if (!name || !description) {
            setError("商品名と説明は必須です");
            return;
        }
        if (status === "available" && !price) {
            setError("価格を入力してください");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            let imageUrl: string | undefined = undefined;

            // 画像があるなら Firebase Storage へアップロードしてURL取得
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, currentUserId);
            }

            await createProduct({
                title: name,
                price: status === "considering" ? 0 : Number(price),
                description,
                sellerId: currentUserId,
                imageUrl,
                status, // ← considering 対応
            });

            onNavigate({ type: "home" });
        } catch (e: any) {
            setError(e?.message ?? "出品に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="h-14 px-4 flex items-center border-b border-gray-200">
                <button
                    onClick={() => onNavigate({ type: "home" })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="ml-2">商品を出品</div>
            </div>

            <div className="p-6 flex flex-col gap-6">
                {/* Upload Box */}
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-600"
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="プレビュー"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <>
                                <Upload className="w-8 h-8" />
                                <div>+ 画像をアップロード</div>
                            </>
                        )}
                    </button>
                </div>

                {/* Input Fields */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-gray-700">商品名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                            placeholder="商品名を入力"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-gray-700">価格</label>

                        {/* 状態選択 */}
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setStatus("available")}
                                className={`px-3 h-10 rounded-lg border ${
                                    status === "available"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300"
                                }`}
                            >
                                通常出品
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus("considering")}
                                className={`px-3 h-10 rounded-lg border ${
                                    status === "considering"
                                        ? "bg-yellow-500 text-white border-yellow-500"
                                        : "bg-white text-gray-700 border-gray-300"
                                }`}
                            >
                                出品考え中（価格未定）
                            </button>
                        </div>

                        {/* 価格入力は通常出品だけ */}
                        {status === "available" ? (
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    ¥
                                </span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full h-12 pl-8 pr-4 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                                    placeholder="0"
                                />
                            </div>
                        ) : (
                            <div className="h-12 flex items-center px-4 rounded-lg bg-gray-100 text-gray-600">
                                価格：未定
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 text-gray-700">説明</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 resize-none"
                            placeholder="商品の説明を入力"
                        />
                    </div>
                </div>

                {/* エラー表示 */}
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full h-12 text-white rounded-lg ${
                        submitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {submitting ? "出品中..." : "出品する"}
                </button>
            </div>
        </div>
    );
}