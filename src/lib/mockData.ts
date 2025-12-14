import { Product, Message } from '../App';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhoneケース',
    price: 3200,
    description: '新品未使用のiPhoneケースです。シンプルなデザインで使いやすいです。',
    imageUrl: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop',
    sellerId: 'user_5678',
  },
  {
    id: '2',
    name: 'ワイヤレスイヤホン',
    price: 8500,
    description: 'Bluetooth対応のワイヤレスイヤホンです。音質が良く、バッテリーも長持ちします。',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    sellerId: 'user_9999',
  },
  {
    id: '3',
    name: 'ノートパソコンスタンド',
    price: 2500,
    description: '折りたたみ式のノートパソコンスタンド。姿勢改善に役立ちます。',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    sellerId: 'user_1234',
  },
  {
    id: '4',
    name: 'スマートウォッチ',
    price: 15000,
    description: '健康管理機能付きのスマートウォッチ。歩数計、心拍計搭載。',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    sellerId: 'user_5678',
  },
  {
    id: '5',
    name: 'モバイルバッテリー',
    price: 3800,
    description: '大容量10000mAhのモバイルバッテリー。2台同時充電可能。',
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop',
    sellerId: 'user_9999',
  },
  {
    id: '6',
    name: 'USBケーブル',
    price: 1200,
    description: '高速充電対応のUSB-Cケーブル。1.5m。',
    imageUrl: 'https://images.unsplash.com/photo-1591290619762-c588f9babd7c?w=400&h=400&fit=crop',
    sellerId: 'user_1234',
  },
];

let messageIdCounter = 1;
export const mockMessages: Message[] = [
  {
    id: `msg_${messageIdCounter++}`,
    senderId: 'user_5678',
    receiverId: 'user_1234',
    content: 'こんにちは！この商品はまだありますか？',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: `msg_${messageIdCounter++}`,
    senderId: 'user_1234',
    receiverId: 'user_5678',
    content: 'こんにちは、はい、まだあります！',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: `msg_${messageIdCounter++}`,
    senderId: 'user_5678',
    receiverId: 'user_1234',
    content: '購入したいのですが、お値引きは可能でしょうか？',
    timestamp: new Date(Date.now() - 1800000),
  },
];

export function getNextMessageId(): string {
  return `msg_${messageIdCounter++}`;
}

let productIdCounter = 7;
export function getNextProductId(): string {
  return `${productIdCounter++}`;
}
