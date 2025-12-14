import { ArrowLeft, Upload } from 'lucide-react';
import { Screen } from '../App';
import { createProduct } from '../lib/api';
import { useState, useRef, ChangeEvent } from 'react';



type CreateListingProps = {
  onNavigate: (screen: Screen) => void;
  currentUserId: string;
};

export function CreateListing({ onNavigate, currentUserId }: CreateListingProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

    const handleSubmit = async () => {
        if (!name || !price || !description) {
            setError('すべての項目を入力してください');
            return;
        }

        setError(null);

        try {
            await createProduct({
                title: name,
                price: Number(price),
                description,
                sellerId: currentUserId,
            });

            onNavigate({ type: 'home' });
        } catch {
            setError('出品に失敗しました');
        }
    };


  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => onNavigate({ type: 'home' })}
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
          {error && (
              <div className="text-red-500 text-sm text-center">
                  {error}
              </div>
          )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          出品する
        </button>
      </div>
    </div>
  );
}
