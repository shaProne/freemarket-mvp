import { useState } from 'react';
import { Home } from './components/Home';
import { ProductDetail } from './components/ProductDetail';
import { CreateListing } from './components/CreateListing';
import { Chat } from './components/Chat';
import { MyPage } from './components/MyPage';

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  sellerId: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
};

export type Screen = 
  | { type: 'home' }
  | { type: 'productDetail'; productId: string }
  | { type: 'createListing' }
  | { type: 'chat'; otherUserId: string; otherUserName: string }
  | { type: 'myPage' };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: 'home' });
  const currentUserId = 'user_1234';

  return (
    <div className="min-h-screen bg-white">
      {currentScreen.type === 'home' && (
        <Home 
          onNavigate={setCurrentScreen}
          currentUserId={currentUserId}
        />
      )}
      {currentScreen.type === 'productDetail' && (
        <ProductDetail 
          productId={currentScreen.productId}
          onNavigate={setCurrentScreen}
          currentUserId={currentUserId}
        />
      )}
      {currentScreen.type === 'createListing' && (
        <CreateListing 
          onNavigate={setCurrentScreen}
          currentUserId={currentUserId}
        />
      )}
      {currentScreen.type === 'chat' && (
        <Chat 
          otherUserId={currentScreen.otherUserId}
          otherUserName={currentScreen.otherUserName}
          currentUserId={currentUserId}
          onNavigate={setCurrentScreen}
        />
      )}
      {currentScreen.type === 'myPage' && (
        <MyPage 
          onNavigate={setCurrentScreen}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
