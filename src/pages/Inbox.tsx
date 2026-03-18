import React, { useEffect, useState, useRef } from 'react';
import { Send, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { Role, Conversation, Message } from '../types';

export function Inbox({ role }: { role: Role }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        if (data.length > 0) setActiveConv(data[0]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetch(`/api/conversations/${activeConv.id}/messages`)
        .then(res => res.json())
        .then(data => {
          setMessages(data);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    }
  }, [activeConv]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv) return;
    
    const content = input;
    setInput("");
    
    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: role === 'student' ? 'stu1' : 't1', content })
      });
      const newMsg = await res.json();
      setMessages([...messages, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      console.error("Lỗi gửi tin nhắn", e);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r-2 border-sky-50 flex flex-col bg-sky-50/30">
        <div className="p-4 border-b-2 border-sky-50">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
            <input type="text" placeholder="Tìm tin nhắn..." className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-sky-100 rounded-2xl focus:border-sky-300 outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => {
            const isActive = activeConv?.id === conv.id;
            const other = conv.participants[0];
            return (
              <div key={conv.id} onClick={() => setActiveConv(conv)} className={`p-3 rounded-2xl cursor-pointer flex gap-3 items-center transition-colors ${isActive ? 'bg-sky-100' : 'hover:bg-sky-50'}`}>
                <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center text-sky-600 font-bold shrink-0">
                  {other.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sky-900 truncate">{other.name}</p>
                    <span className="text-xs text-sky-400">{conv.lastMessage.timestamp.split(' ')[0]}</span>
                  </div>
                  <p className="text-sm text-sky-500 truncate">{conv.lastMessage.content}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-4 border-b-2 border-sky-50 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-200 flex items-center justify-center text-sky-600 font-bold">
                  {activeConv.participants[0].name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sky-900">{activeConv.participants[0].name}</p>
                  <p className="text-xs text-emerald-500 font-medium">Đang hoạt động</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-sky-400 hover:bg-sky-50 rounded-xl"><Phone className="w-5 h-5" /></button>
                <button className="p-2 text-sky-400 hover:bg-sky-50 rounded-xl"><Video className="w-5 h-5" /></button>
                <button className="p-2 text-sky-400 hover:bg-sky-50 rounded-xl"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => {
                const isMe = msg.senderRole === role;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-3xl ${isMe ? 'bg-sky-500 text-white rounded-tr-sm' : 'bg-white border-2 border-sky-100 text-sky-900 rounded-tl-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-sky-100' : 'text-sky-400'}`}>{msg.timestamp}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t-2 border-sky-50">
              <div className="flex items-center gap-2 bg-sky-50/50 border-2 border-sky-100 rounded-2xl p-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Gửi tin nhắn..." 
                  className="flex-1 bg-transparent px-3 outline-none text-sky-900" 
                />
                <button onClick={handleSend} className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sky-400">Chọn một tin nhắn để xem</div>
        )}
      </div>
    </div>
  );
}
