import { ArrowLeft, Heart } from 'lucide-react';
import { Screen } from '../App';
import { mockProducts } from '../lib/mockData';

type ProductDetailProps = {
  productId: string;
  onNavigate: (screen: Screen) => void;
  currentUserId: string;
};

export function ProductDetail({
  productId,
  onNavigate,
  currentUserId,
}: ProductDetailProps) {
  const product = mockProducts.find((p) => p.id === productId);

  if (!product) {
    return (
      <div className="max-w-md mx-auto p-4">
        <button
          onClick={() => onNavigate({ type: 'home' })}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="mt-8 text-center text-gray-500">商品が見つかりません</div>
      </div>
    );
  }

  const isOwnProduct = product.sellerId === currentUserId;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate({ type: 'home' })}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Heart className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image */}
      <div className="w-full aspect-[4/3] bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-6 flex flex-col gap-4">
        <div>
          <h1 className="mb-2">{product.name}</h1>
          <div className="text-red-600">¥{product.price.toLocaleString()}</div>
        </div>

        <div className="text-gray-600">{product.description}</div>

        {/* Buttons */}
        {!isOwnProduct && (
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => alert('購入機能は実装予定です')}
              className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              購入する
            </button>
            <button
              onClick={() =>
                onNavigate({
                  type: 'chat',
                  otherUserId: product.sellerId,
                  otherUserName: `出品者 (${product.sellerId})`,
                })
              }
              className="w-full h-12 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              メッセージを送る
            </button>
          </div>
        )}

        {isOwnProduct && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center text-gray-600">
            あなたが出品した商品です
          </div>
        )}
      </div>
    </div>
  );
}
