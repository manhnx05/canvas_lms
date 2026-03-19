import React, { useEffect, useState, useRef } from 'react';
import { Send, Search, MoreVertical, Phone, Video, Plus, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Role, Conversation, Message } from '../types';

export function Inbox({ role }: { role: Role }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  // Modal states
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");

  const fetchConversations = () => {
    fetch(`/api/conversations?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        if (data.length > 0 && !activeConv) setActiveConv(data[0]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConversations();
    
    // Connect Socket.io
    socketRef.current = io();
    socketRef.current.emit('join', currentUser.id);

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      // If the message belongs to the current active conversation
      if (activeConv && msg.conversationId === activeConv.id) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      
      // Update conversations list (move to top, update lastMessage and unread list)
      setConversations(prevConvs => {
        const convIndex = prevConvs.findIndex(c => c.id === msg.conversationId);
        if (convIndex > -1) {
          const updatedConvs = [...prevConvs];
          const conv = updatedConvs[convIndex];
          conv.lastMessage = msg;
          if (!activeConv || activeConv.id !== conv.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          // Move to top
          updatedConvs.splice(convIndex, 1);
          return [conv, ...updatedConvs];
        } else {
          // New conversation created by someone else
          fetchConversations();
          return prevConvs;
        }
      });
    };

    socketRef.current?.on('newMessage', handleNewMessage);

    return () => {
      socketRef.current?.off('newMessage', handleNewMessage);
    };
  }, [activeConv]);

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
        body: JSON.stringify({ senderId: currentUser.id, content })
      });
      const newMsg = await res.json();
      
      // Update local message state as the socket event handles the receiver, 
      // but sender can just reliably append it instantly
      setMessages([...messages, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Update local lastMessage immediately
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === activeConv.id);
        const copy = [...prev];
        copy[idx].lastMessage = newMsg;
        const item = copy.splice(idx, 1)[0];
        return [item, ...copy];
      });

    } catch (e) {
      console.error("Lỗi gửi tin nhắn", e);
    }
  };

  const openNewChat = () => {
    setShowNewChat(true);
    fetch(`/api/users?excludeId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  const startConversation = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId: targetUserId })
      });
      const newConv = await res.json();
      setShowNewChat(false);
      
      // Formatting
      const formatted = {
        id: newConv.id,
        unreadCount: newConv.unreadCount || 0,
        participants: newConv.participants.filter((p: any) => p.userId !== currentUser.id).map((p: any) => p.user),
        lastMessage: newConv.messages[0] || null
      };
      
      setConversations(prev => {
        if (prev.find(c => c.id === formatted.id)) return prev;
        return [formatted, ...prev];
      });
      setActiveConv(formatted);
    } catch (error) {
      console.error("Lỗi bắt đầu tin nhắn", error);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex relative">
      {/* Sidebar */}
      <div className="w-1/3 border-r-2 border-sky-50 flex flex-col bg-sky-50/30">
        <div className="p-4 border-b-2 border-sky-50 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
            <input type="text" placeholder="Tìm tin nhắn..." className="w-full pl-12 pr-4 py-2 bg-white border-2 border-sky-100 rounded-2xl focus:border-sky-300 outline-none" />
          </div>
          <button onClick={openNewChat} className="p-2.5 bg-sky-500 text-white rounded-2xl hover:bg-sky-600 transition-colors shrink-0 shadow-sm shadow-sky-200">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => {
            const isActive = activeConv?.id === conv.id;
            const other = conv.participants[0];
            if (!other) return null;
            return (
              <div key={conv.id} onClick={() => setActiveConv(conv)} className={`p-3 rounded-2xl cursor-pointer flex gap-3 items-center transition-colors ${isActive ? 'bg-sky-100' : 'hover:bg-sky-50'}`}>
                <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center text-sky-600 font-bold shrink-0">
                  {other.avatar ? <img src={other.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : other.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sky-900 truncate">{other.name}</p>
                    <span className="text-xs text-sky-400">{conv.lastMessage?.timestamp?.split(' ')[0] || ''}</span>
                  </div>
                  <p className="text-sm text-sky-500 truncate">{conv.lastMessage?.content || 'Chưa có tin nhắn'}</p>
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
                  {activeConv.participants[0]?.avatar ? <img src={activeConv.participants[0].avatar} alt="" className="w-full h-full rounded-full object-cover" /> : activeConv.participants[0]?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sky-900">{activeConv.participants[0]?.name}</p>
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
                const isMe = msg.senderId === currentUser.id;
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
          <div className="flex-1 flex items-center justify-center text-sky-400 font-medium">Chọn một tin nhắn để xem</div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-xl w-full max-w-sm flex flex-col h-[500px]">
            <div className="p-4 border-b-2 border-sky-50 flex justify-between items-center">
              <h3 className="font-extrabold text-sky-900 text-lg">Tin nhắn mới</h3>
              <button onClick={() => setShowNewChat(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b-2 border-sky-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm theo tên..." 
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-300 outline-none text-sm" 
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                <div 
                  key={u.id} 
                  onClick={() => startConversation(u.id)}
                  className="p-3 flex items-center gap-3 hover:bg-sky-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
