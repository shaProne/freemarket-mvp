import { ArrowLeft, Plus } from 'lucide-react';
import { Screen } from '../App';
import { mockProducts } from '../lib/mockData';

type MyPageProps = {
  onNavigate: (screen: Screen) => void;
  currentUserId: string;
};

export function MyPage({ onNavigate, currentUserId }: MyPageProps) {
  const myProducts = mockProducts.filter((p) => p.sellerId === currentUserId);

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
        <div className="ml-2">マイページ</div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-gray-600">ユーザーID</div>
        <div className="mt-1">{currentUserId}</div>
      </div>

      {/* User's Listings */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2>あなたの出品一覧</h2>
          <button
            onClick={() => onNavigate({ type: 'createListing' })}
            className="px-4 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>出品</span>
          </button>
        </div>

        {myProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            まだ出品した商品はありません
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myProducts.map((product) => (
              <button
                key={product.id}
                onClick={() =>
                  onNavigate({ type: 'productDetail', productId: product.id })
                }
                className="flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 flex flex-col items-start gap-1">
                  <div className="text-red-600">
                    ¥{product.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-left line-clamp-2">
                    {product.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
