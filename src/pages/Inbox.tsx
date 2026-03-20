import React, { useEffect, useState, useRef } from 'react';
import { Send, Search, Plus, X, Paperclip, ChevronDown, BookOpen, Trash2, Inbox as InboxIcon, ArrowLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  attachments?: Attachment[];
  timestamp: string;
  isRead: boolean;
  conversationId?: string;
}

interface Conversation {
  id: string;
  subject?: string;
  courseId?: string;
  courseName?: string;
  unreadCount: number;
  participants: any[];
  lastMessage?: Message | null;
}

export function Inbox({ role }: { role: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseMembers, setCourseMembers] = useState<any[]>([]);
  const [compose, setCompose] = useState({
    courseId: '',
    receiverId: '',
    subject: '',
    content: ''
  });
  const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
  const [composeSending, setComposeSending] = useState(false);
  const composeFileRef = useRef<HTMLInputElement>(null);

  // Mobile: list or detail
  const [showDetail, setShowDetail] = useState(false);

  const fetchConversations = () => {
    fetch(`/api/conversations?userId=${currentUser.id}`)
      .then(r => r.json())
      .then(data => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchCourses = () => {
    fetch(`/api/courses`)
      .then(r => r.json())
      .then(data => setCourses(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchConversations();
    fetchCourses();

    socketRef.current = io();
    socketRef.current.emit('join', currentUser.id);

    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      if (activeConv && msg.conversationId === activeConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId);
        if (idx > -1) {
          const copy = [...prev];
          const conv = { ...copy[idx] };
          conv.lastMessage = msg;
          if (!activeConv || activeConv.id !== conv.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          copy.splice(idx, 1);
          return [conv, ...copy];
        } else {
          fetchConversations();
          return prev;
        }
      });
    };

    socketRef.current?.on('newMessage', handleNewMessage);
    return () => { socketRef.current?.off('newMessage', handleNewMessage); };
  }, [activeConv]);

  useEffect(() => {
    if (activeConv) {
      fetch(`/api/conversations/${activeConv.id}/messages`)
        .then(r => r.json())
        .then(data => {
          setMessages(Array.isArray(data) ? data : []);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          setConversations(prev => prev.map(c =>
            c.id === activeConv.id ? { ...c, unreadCount: 0 } : c
          ));
        });
    }
  }, [activeConv]);

  useEffect(() => {
    if (compose.courseId) {
      fetch(`/api/courses/${compose.courseId}`)
        .then(r => r.json())
        .then(data => {
          const people = (data.people || []).filter((p: any) => p.id !== currentUser.id);
          setCourseMembers(people);
        });
    } else {
      fetch(`/api/users?excludeId=${currentUser.id}`)
        .then(r => r.json())
        .then(data => setCourseMembers(Array.isArray(data) ? data : []));
    }
  }, [compose.courseId]);

  const readFiles = (files: FileList): Promise<Attachment[]> => {
    return Promise.all(Array.from(files).map(file => new Promise<Attachment>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: (e.target?.result as string)
      });
      reader.readAsDataURL(file);
    })));
  };

  const handleSend = async () => {
    if ((!input.trim() && replyAttachments.length === 0) || !activeConv) return;
    const content = input;
    const atts = [...replyAttachments];
    setInput('');
    setReplyAttachments([]);

    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, content, attachments: atts.length > 0 ? atts : undefined })
      });
      const newMsg = await res.json();
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === activeConv.id);
        if (idx === -1) return prev;
        const copy = [...prev];
        const item = { ...copy[idx], lastMessage: newMsg };
        copy.splice(idx, 1);
        return [item, ...copy];
      });
    } catch (e) { console.error(e); }
  };

  const handleComposeSend = async () => {
    if (!compose.receiverId || !compose.subject || !compose.content) return;
    setComposeSending(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: compose.receiverId,
          subject: compose.subject,
          courseId: compose.courseId || null,
          content: compose.content,
          attachments: composeAttachments.length > 0 ? composeAttachments : undefined
        })
      });
      const newConv = await res.json();
      setConversations(prev => {
        if (prev.find(c => c.id === newConv.id)) return prev.map(c => c.id === newConv.id ? newConv : c);
        return [newConv, ...prev];
      });
      setActiveConv(newConv);
      setShowDetail(true);
      setShowCompose(false);
      setCompose({ courseId: '', receiverId: '', subject: '', content: '' });
      setComposeAttachments([]);
    } catch (e) { console.error(e); }
    setComposeSending(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const isImage = (type: string) => type.startsWith('image/');

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-10rem)] flex relative">

      {/* Sidebar */}
      <div className={`${showDetail ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-100 flex-col bg-slate-50 shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-sky-500" />
              <h2 className="font-extrabold text-slate-800 text-lg">Hộp Thư</h2>
            </div>
            <button
              onClick={() => { setShowCompose(true); fetchCourses(); }}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-3 py-2 rounded-xl shadow-sm shadow-sky-200 transition-colors"
            >
              <Plus className="w-4 h-4" /> Soạn thư
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Tìm trong Hộp thư..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-sky-300 focus:bg-white transition-colors" />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <InboxIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hộp thư trống</p>
            </div>
          ) : conversations.map(conv => {
            const isActive = activeConv?.id === conv.id;
            const other = conv.participants[0];
            if (!other) return null;
            return (
              <div
                key={conv.id}
                onClick={() => { setActiveConv(conv); setShowDetail(true); }}
                className={`p-4 cursor-pointer border-b border-slate-100 transition-colors ${isActive ? 'bg-sky-50 border-l-4 border-l-sky-500' : 'hover:bg-slate-100'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                    {other.avatar ? <img src={other.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : other.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-sm font-bold truncate ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-600'}`}>{other.name}</p>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">{conv.lastMessage?.timestamp || ''}</span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500 font-normal'}`}>
                      {conv.subject || 'Không có tiêu đề'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-400 truncate">{conv.lastMessage?.content || 'Chưa có nội dung'}</p>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {conv.courseName && (
                          <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-medium">{conv.courseName}</span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel */}
      <div className={`${showDetail ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <button className="md:hidden p-1 text-slate-400 hover:text-slate-600" onClick={() => setShowDetail(false)}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{activeConv.subject || 'Không có tiêu đề'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activeConv.courseName && (
                      <span className="inline-flex items-center gap-1 text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                        <BookOpen className="w-3 h-3" />{activeConv.courseName}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {activeConv.participants.map((p: any) => p.name).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const atts: Attachment[] = Array.isArray(msg.attachments) ? msg.attachments : [];
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                      {msg.senderAvatar ? <img src={msg.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" /> : msg.senderName?.charAt(0)}
                    </div>
                    <div className={`max-w-[70%] space-y-1.5 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-baseline gap-2">
                        {!isMe && <p className="text-xs font-bold text-slate-600">{msg.senderName}</p>}
                        <p className="text-[10px] text-slate-400">{msg.timestamp}</p>
                      </div>
                      {msg.content && (
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-sky-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                          {msg.content}
                        </div>
                      )}
                      {atts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {atts.map((att, i) => (
                            isImage(att.type) ? (
                              <a key={i} href={att.data} download={att.name} target="_blank" rel="noreferrer">
                                <img src={att.data} alt={att.name} className="max-w-[200px] max-h-[160px] rounded-xl object-cover border border-slate-200 hover:opacity-90 transition-opacity" />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={att.data}
                                download={att.name}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${isMe ? 'bg-sky-400/40 border-sky-300 text-white hover:bg-sky-400/60' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[120px]">{att.name}</span>
                                <span className="opacity-60">{formatFileSize(att.size)}</span>
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            <div className="p-4 bg-white border-t border-slate-100">
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 px-2">
                  {replyAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-2 py-1 text-xs">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{att.name}</span>
                      <button onClick={() => setReplyAttachments(p => p.filter((_, j) => j !== i))} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                <textarea
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Viết tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  className="flex-1 bg-transparent px-3 py-1 outline-none text-slate-800 text-sm resize-none"
                />
                <input ref={replyFileRef} type="file" multiple className="hidden" onChange={async e => { if (!e.target.files) return; const files = await readFiles(e.target.files); setReplyAttachments(p => [...p, ...files]); e.target.value = ''; }} />
                <button onClick={() => replyFileRef.current?.click()} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-colors" title="Đính kèm file">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button onClick={handleSend} className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl transition-colors shadow-sm shadow-sky-200">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <InboxIcon className="w-16 h-16 opacity-20" />
            <p className="font-medium">Chọn một cuộc hội thoại để đọc</p>
            <button
              onClick={() => { setShowCompose(true); fetchCourses(); }}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Soạn thư mới
            </button>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
            {/* Compose Header */}
            <div className="px-5 py-4 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-base flex items-center gap-2"><Plus className="w-4 h-4" /> Soạn Thư Mới</h3>
              <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto">
              {/* Course Select */}
              <div className="border-b border-slate-100">
                <label className="flex items-center gap-2 px-5 py-3">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-500 w-20 shrink-0">Môn học</span>
                  <div className="relative flex-1">
                    <select
                      value={compose.courseId}
                      onChange={e => setCompose(prev => ({ ...prev, courseId: e.target.value, receiverId: '' }))}
                      className="w-full outline-none text-sm text-slate-700 appearance-none bg-transparent pr-5"
                    >
                      <option value="">Không thuộc môn học</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </label>
              </div>

              {/* To (Receiver) */}
              <div className="border-b border-slate-100">
                <label className="flex items-center gap-2 px-5 py-3">
                  <span className="text-xs font-semibold text-slate-500 w-20 shrink-0 ml-6">Gửi đến</span>
                  <div className="relative flex-1">
                    <select
                      value={compose.receiverId}
                      onChange={e => setCompose(prev => ({ ...prev, receiverId: e.target.value }))}
                      className="w-full outline-none text-sm text-slate-700 appearance-none bg-transparent pr-5"
                      required
                    >
                      <option value="">-- Chọn người nhận --</option>
                      {courseMembers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </label>
              </div>

              {/* Subject */}
              <div className="border-b border-slate-100">
                <label className="flex items-center gap-2 px-5 py-3">
                  <span className="text-xs font-semibold text-slate-500 w-20 shrink-0 ml-6">Tiêu đề</span>
                  <input
                    type="text"
                    value={compose.subject}
                    onChange={e => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Nhập tiêu đề..."
                    className="flex-1 outline-none text-sm text-slate-800 bg-transparent"
                    required
                  />
                </label>
              </div>

              {/* Content */}
              <div className="px-5 pt-3 pb-2">
                <textarea
                  rows={6}
                  value={compose.content}
                  onChange={e => setCompose(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Viết nội dung tin nhắn..."
                  className="w-full outline-none text-sm text-slate-800 resize-none bg-transparent leading-relaxed"
                />
              </div>

              {/* Attachments preview */}
              {composeAttachments.length > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                  {composeAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-2 py-1 text-xs">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <span className="opacity-60">{formatFileSize(att.size)}</span>
                      <button onClick={() => setComposeAttachments(p => p.filter((_, j) => j !== i))} className="hover:text-red-500 ml-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compose Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <input
                  ref={composeFileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={async e => {
                    if (!e.target.files) return;
                    const files = await readFiles(e.target.files);
                    setComposeAttachments(p => [...p, ...files]);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => composeFileRef.current?.click()}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors"
                >
                  <Paperclip className="w-4 h-4" /> Đính kèm
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCompose(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">Hủy</button>
                <button
                  onClick={handleComposeSend}
                  disabled={composeSending || !compose.receiverId || !compose.subject || !compose.content}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors shadow-sm shadow-sky-200"
                >
                  {composeSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Gửi thư
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
