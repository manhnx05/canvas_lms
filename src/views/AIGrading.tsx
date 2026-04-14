import React, { useState, useEffect, useRef } from 'react';
import { Camera, Send, FileImage, Loader2, Bot, User as UserIcon, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export function AIGrading() {
   const [sessions, setSessions] = useState<any[]>([]);
   const [currentSession, setCurrentSession] = useState<any>(null);
   const [messages, setMessages] = useState<any[]>([]);
   const [input, setInput] = useState('');
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [filePreview, setFilePreview] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   
   const fileInputRef = useRef<HTMLInputElement>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   const fetchSessions = async () => {
      try {
         const token = localStorage.getItem('canvas_token');
         const res = await fetch('/api/ai-grading', {
            headers: { 'Authorization': `Bearer ${token}`}
         });
         const data = await res.json();
         if (res.ok) {
            setSessions(data.sessions);
         }
      } catch (err) {
         console.error(err);
      }
   };

   useEffect(() => {
      fetchSessions();
   }, []);

   useEffect(() => {
      setTimeout(() => {
         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
   }, [messages]);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         setSelectedFile(file);
         const reader = new FileReader();
         reader.onload = (ev) => {
            setFilePreview(ev.target?.result as string);
         };
         reader.readAsDataURL(file);
      }
   };

   const startNewSession = () => {
      setCurrentSession(null);
      setMessages([]);
      setSelectedFile(null);
      setFilePreview(null);
      setInput('');
   };

   const selectSession = (session: any) => {
      setCurrentSession(session);
      setMessages(session.messages || []);
      setSelectedFile(null);
      setFilePreview(null);
   };

   const handleSend = async () => {
      if (!input.trim() && !selectedFile) return;
      if (!currentSession && !selectedFile) {
         toast.error("Phiên chấm mới yêu cầu tải lên ảnh phiếu bài tập.");
         return;
      }

      const token = localStorage.getItem('canvas_token');
      setIsProcessing(true);

      try {
         if (!currentSession) {
            // New Session via Image Upload
            const formData = new FormData();
            formData.append('file', selectedFile!);
            if (input) formData.append('message', input);

            setMessages([{ role: 'user', content: input || 'Gửi phiếu bài tập...', imageUrl: filePreview }]);
            setInput('');
            setSelectedFile(null);
            setFilePreview(null);

            const res = await fetch('/api/ai-grading', {
               method: 'POST',
               headers: { 'Authorization': `Bearer ${token}`},
               body: formData
            });

            const data = await res.json();
            if (res.ok) {
               setCurrentSession(data.session);
               setMessages(data.session.messages);
               fetchSessions();
               toast.success("Đã chấm điểm xong!");
            } else {
               toast.error(data.error || "Có lỗi xảy ra");
               setMessages([]);
            }
         } else {
            // Chat in existing session
            setMessages(prev => [...prev, { role: 'user', content: input }]);
            const messageToSend = input;
            setInput('');

            const res = await fetch(`/api/ai-grading/${currentSession.id}`, {
               method: 'POST',
               headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({ message: messageToSend })
            });

            const data = await res.json();
            if (res.ok) {
               setMessages(prev => [...prev, data.reply]);
            } else {
               toast.error(data.error || "Có lỗi xảy ra");
            }
         }
      } catch (err: any) {
         toast.error(err.message || 'Lỗi hệ thống');
      } finally {
         setIsProcessing(false);
      }
   };

   return (
      <div className="flex h-[calc(100vh-80px)] bg-white rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
         {/* Sidebar */}
         <div className="w-80 bg-sky-50/50 border-r border-sky-100 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-sky-100">
               <button 
                  onClick={startNewSession}
                  className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-medium transition-colors"
               >
                  <Plus className="w-5 h-5" />
                  <span>Chấm bài mới</span>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
               {sessions.map(s => (
                  <button 
                     key={s.id}
                     onClick={() => selectSession(s)}
                     className={`w-full text-left p-3 rounded-xl transition-all ${currentSession?.id === s.id ? 'bg-sky-200 shadow-sm text-sky-800' : 'hover:bg-sky-100 text-sky-700'}`}
                  >
                     <div className="font-semibold text-sm truncate">{s.studentName || 'Học sinh ẩn danh'}</div>
                     <div className="text-xs opacity-70 truncate">{new Date(s.createdAt).toLocaleDateString()} • Điểm: {s.score ?? '?'}</div>
                  </button>
               ))}
            </div>
         </div>

         {/* Chat Area */}
         <div className="flex-1 flex flex-col relative">
            {/* Header info */}
            {currentSession && (currentSession.studentName || currentSession.score) && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow border border-sky-100 flex gap-4 text-sm font-semibold text-slate-700">
                     <span>Bé: <span className="text-sky-600">{currentSession.studentName || 'Chưa rõ'}</span></span>
                     {currentSession.studentClass && <span>• Lớp: <span className="text-amber-600">{currentSession.studentClass}</span></span>}
                     {currentSession.score !== null && <span>• Điểm: <span className="text-rose-500 font-bold">{currentSession.score}/10</span></span>}
                  </div>
               </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
               {messages.length === 0 && !currentSession ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                     <div className="w-20 h-20 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-10 h-10" />
                     </div>
                     <h3 className="text-xl font-bold text-sky-800 mb-2">Chấm Bài AI Tự Động</h3>
                     <p className="text-sm max-w-sm text-sky-600">Tải lên hoặc chụp phiếu bài tập của học sinh. AI sẽ tự động đọc tên, lớp, chấm điểm và gợi ý nhận xét siêu chuẩn!</p>
                  </div>
               ) : (
                  messages.map((msg, i) => (
                     <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                        {msg.role === 'model' && (
                           <div className="w-10 h-10 shrink-0 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm mt-1">
                              <Bot className="w-6 h-6" />
                           </div>
                        )}
                        <div className={`flex flex-col ${msg.role === 'user' ? 'last:items-end' : ''}`}>
                           {msg.imageUrl && (
                              <img src={msg.imageUrl} alt="Uploaded worksheet" className="w-64 rounded-2xl border-4 border-white shadow-md mb-2 object-cover object-top" />
                           )}
                           <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                              <div className="prose prose-sm prose-p:leading-relaxed max-w-none break-words">
                                 <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                           </div>
                        </div>
                        {msg.role === 'user' && (
                           <div className="w-10 h-10 shrink-0 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 mt-1">
                              <UserIcon className="w-6 h-6" />
                           </div>
                        )}
                     </div>
                  ))
               )}
               {isProcessing && (
                  <div className="flex gap-4 max-w-3xl mr-auto">
                     <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm mt-1 animate-pulse">
                        <Bot className="w-6 h-6" />
                     </div>
                     <div className="px-5 py-3.5 rounded-2xl bg-slate-50 text-slate-500 font-medium rounded-tl-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                        AI đang phân tích phiếu bài tập...
                     </div>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-sky-100 bg-slate-50/50">
               {filePreview && (
                  <div className="mb-3 relative inline-block">
                     <img src={filePreview} alt="Preview" className="h-20 rounded-lg shadow-sm border-2 border-sky-200" />
                     <button onClick={() => { setFilePreview(null); setSelectedFile(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform">✕</button>
                  </div>
               )}
               <div className="flex gap-3 bg-white p-2 rounded-2xl border border-sky-200 shadow-sm">
                  {!currentSession && (
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-sky-500 hover:bg-sky-50 rounded-xl transition-colors shrink-0"
                     >
                        <FileImage className="w-6 h-6" />
                     </button>
                  )}
                  <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={handleFileChange} 
                     accept="image/*"
                  />
                  <input 
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     placeholder={currentSession ? "Gửi phản hồi / hỏi đáp với AI..." : "Gửi phiếu & tin nhắn..."}
                     className="flex-1 bg-transparent border-none outline-none px-2 font-medium text-slate-700 placeholder:text-slate-400"
                  />
                  <button 
                     onClick={handleSend}
                     disabled={isProcessing || (!input.trim() && !filePreview)}
                     className="px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:hover:bg-sky-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                     <Send className="w-5 h-5" />
                     <span className="hidden md:inline">Gửi</span>
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
