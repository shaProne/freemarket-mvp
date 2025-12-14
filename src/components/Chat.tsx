import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Screen, Message } from '../App';
import { mockMessages, getNextMessageId } from '../lib/mockData';

type ChatProps = {
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  onNavigate: (screen: Screen) => void;
};

export function Chat({
  otherUserId,
  otherUserName,
  currentUserId,
  onNavigate,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter messages between current user and other user
    const filteredMessages = mockMessages.filter(
      (msg) =>
        (msg.senderId === currentUserId && msg.receiverId === otherUserId) ||
        (msg.senderId === otherUserId && msg.receiverId === currentUserId)
    );
    setMessages(filteredMessages);
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: getNextMessageId(),
      senderId: currentUserId,
      receiverId: otherUserId,
      content: inputValue,
      timestamp: new Date(),
    };

    mockMessages.push(newMessage);
    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => onNavigate({ type: 'home' })}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>{otherUserName}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="h-16 px-4 border-t border-gray-200 flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="メッセージを入力"
          className="flex-1 h-10 px-4 bg-gray-100 rounded-full outline-none focus:bg-gray-200"
        />
        <button
          onClick={handleSend}
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
