import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader, Trash2, BookOpen } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface AiChatSectionProps {
  studentName?: string;
  context?: any;
}

const QUICK_QUESTIONS = [
  '2 + 3 × 4 = ?',
  'Việt Nam có thủ đô là thành phố nào?',
  'Giải thích cho bé hiểu phân số là gì?',
  'Hành tinh nào gần Mặt Trời nhất?',
];

export function AiChatSection({ studentName, context }: AiChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: `Xin chào${studentName ? ` **${studentName}**` : ''}! 👋 Cô là trợ lý AI, sẵn sàng giúp bé học tập. Bé hỏi gì mà cô biết nhé! 🌟` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, studentName, context })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Cô chưa hiểu câu hỏi, bé hỏi lại nhé! 😊' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '😢 Có lỗi kết nối, bé thử lại sau nhé!' }]);
    }
    setLoading(false);
  };

  const renderText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-sky-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800 text-sm">Trợ lý AI học tập</p>
            <p className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />Online – Gemini AI
            </p>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-400 transition-colors" title="Xóa lịch sử">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2.5`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-sky-500' : 'bg-gradient-to-br from-indigo-500 to-sky-500'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-sky-500 text-white rounded-tr-sm'
                : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'
            }`}>
              {msg.role === 'assistant'
                ? <div dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                : msg.text
              }
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-xs text-slate-400">Cô đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-2 border-t border-slate-50">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="shrink-0 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-3 py-1.5 rounded-full border border-indigo-100 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Bé nhập câu hỏi vào đây..."
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 px-2"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white p-2 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
