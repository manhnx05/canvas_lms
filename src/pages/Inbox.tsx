import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConversationList, Conversation } from '../features/inbox/ConversationList';
import { MessageThread } from '../features/inbox/MessageThread';
import { ComposeModal } from '../features/inbox/ComposeModal';
import apiClient from '../lib/apiClient';

interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: Attachment[];
  timestamp: string;
  isRead: boolean;
  conversationId?: string;
}

export function Inbox({ role }: { role: string }) {
  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply state
  const [input, setInput] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseMembers, setCourseMembers] = useState<any[]>([]);
  const [compose, setCompose] = useState({ courseId: '', receiverId: '', subject: '', content: '' });
  const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
  const [composeSending, setComposeSending] = useState(false);

  // Mobile view
  const [showDetail, setShowDetail] = useState(false);

  // ── Helpers ──────────────────────────────────────────
  const readFiles = (files: FileList): Promise<Attachment[]> =>
    Promise.all(Array.from(files).map(file => new Promise<Attachment>((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve({ name: file.name, type: file.type, size: file.size, data: e.target?.result as string });
      reader.readAsDataURL(file);
    })));

  const refetchConversations = () =>
    apiClient.get(`/conversations?userId=${currentUser.id}`)
      .then(r => r.data)
      .then(data => { if (Array.isArray(data)) setConversations(data); })
      .catch(() => {});

  const fetchCourses = () => {
    apiClient.get(`/courses?userId=${currentUser.id}`)
      .then(r => r.data)
      .then(data => setCourses(Array.isArray(data) ? data : []));
  };

  // ── Setup ────────────────────────────────────────────
  useEffect(() => {
    refetchConversations().then(() => setLoading(false));
    fetchCourses();

    socketRef.current = io({ transports: ['websocket', 'polling'] });
    
    const joinRoom = () => socketRef.current?.emit('join', currentUser.id);

    if (socketRef.current.connected) {
      joinRoom();
    } else {
      socketRef.current.on('connect', joinRoom);
    }
    socketRef.current.on('reconnect', joinRoom);
    
    socketRef.current.on('connect_error', (err) => console.error('Socket connect_error:', err.message));
    socketRef.current.on('disconnect', () => console.log('Socket disconnected'));

    // Polling fallback every 30s
    const pollTimer = setInterval(refetchConversations, 30000);

    // Auto-open compose from Students page (?compose=1&to=...)
    const params = new URLSearchParams(window.location.search);
    if (params.get('compose') === '1' && params.get('to')) {
      setCompose(prev => ({ ...prev, receiverId: params.get('to') || '' }));
      setShowCompose(true);
    }

    return () => { socketRef.current?.disconnect(); clearInterval(pollTimer); };
  }, []);

  // ── Socket: incoming messages ─────────────────────────
  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      if (activeConv && msg.conversationId === activeConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          return [...prev, msg];
        });
      }
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId);
        if (idx > -1) {
          const copy = [...prev];
          const conv = { ...copy[idx], lastMessage: msg };
          if (!activeConv || activeConv.id !== conv.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          copy.splice(idx, 1);
          return [conv, ...copy];
        } else {
          refetchConversations();
          return prev;
        }
      });
    };
    const handleNewConversation = () => refetchConversations();
    socketRef.current?.on('newMessage', handleNewMessage);
    socketRef.current?.on('newConversation', handleNewConversation);
    return () => {
      socketRef.current?.off('newMessage', handleNewMessage);
      socketRef.current?.off('newConversation', handleNewConversation);
    };
  }, [activeConv]);

  // ── Fetch messages on active conversation change ──────
  useEffect(() => {
    if (!activeConv) return;
    apiClient.get(`/conversations/${activeConv.id}/messages`)
      .then(r => r.data)
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, unreadCount: 0 } : c));
      });
  }, [activeConv]);

  // ── Fetch course members on courseId change ───────────
  useEffect(() => {
    if (compose.courseId) {
      apiClient.get(`/courses/${compose.courseId}`)
        .then(r => r.data)
        .then(data => setCourseMembers((data.people || []).filter((p: any) => p.id !== currentUser.id)));
    } else {
      apiClient.get(`/users?excludeId=${currentUser.id}`)
        .then(r => r.data)
        .then(data => setCourseMembers(Array.isArray(data) ? data : []));
    }
  }, [compose.courseId]);

  // ── Handlers ─────────────────────────────────────────
  const handleSend = async () => {
    if ((!input.trim() && replyAttachments.length === 0) || !activeConv) return;
    const content = input;
    const atts = [...replyAttachments];
    setInput(''); setReplyAttachments([]);
    try {
      const res = await apiClient.post(`/conversations/${activeConv.id}/messages`, { senderId: currentUser.id, content, attachments: atts.length > 0 ? atts : undefined });
      const newMsg = res.data;
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === activeConv.id);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy.splice(idx, 1);
        return [{ ...prev[idx], lastMessage: newMsg }, ...copy];
      });
    } catch (e) { console.error(e); }
  };

  const handleComposeSend = async () => {
    if (!compose.receiverId || !compose.subject || !compose.content) return;
    setComposeSending(true);
    try {
      const res = await apiClient.post('/conversations', {
        senderId: currentUser.id, receiverId: compose.receiverId,
        subject: compose.subject, courseId: compose.courseId || null,
        content: compose.content, attachments: composeAttachments.length > 0 ? composeAttachments : undefined
      });
      const newConv = res.data;
      setConversations(prev =>
        prev.find(c => c.id === newConv.id) ? prev.map(c => c.id === newConv.id ? newConv : c) : [newConv, ...prev]
      );
      setActiveConv(newConv); setShowDetail(true); setShowCompose(false);
      setCompose({ courseId: '', receiverId: '', subject: '', content: '' });
      setComposeAttachments([]);
    } catch (e) { console.error(e); }
    setComposeSending(false);
  };

  // ── Render ────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-10rem)] flex relative">

      {/* Conversation Sidebar */}
      <div className={`${showDetail ? 'hidden md:flex' : 'flex'} flex-col`}>
        <ConversationList
          conversations={conversations}
          activeConvId={activeConv?.id}
          onSelect={conv => { setActiveConv(conv); setShowDetail(true); }}
          onCompose={() => { setShowCompose(true); fetchCourses(); }}
        />
      </div>

      {/* Message Panel */}
      <div className={`${showDetail ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        <MessageThread
          conversation={activeConv}
          messages={messages}
          currentUserId={currentUser.id}
          input={input}
          replyAttachments={replyAttachments}
          messagesEndRef={messagesEndRef}
          onInputChange={setInput}
          onSend={handleSend}
          onAttach={async files => { const atts = await readFiles(files); setReplyAttachments(p => [...p, ...atts]); }}
          onRemoveAttachment={i => setReplyAttachments(p => p.filter((_, j) => j !== i))}
          onBack={() => setShowDetail(false)}
          onCompose={() => { setShowCompose(true); fetchCourses(); }}
        />
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          courses={courses}
          courseMembers={courseMembers}
          compose={compose}
          attachments={composeAttachments}
          sending={composeSending}
          onComposeChange={patch => setCompose(prev => ({ ...prev, ...patch }))}
          onAttach={async files => { const atts = await readFiles(files); setComposeAttachments(p => [...p, ...atts]); }}
          onRemoveAttachment={i => setComposeAttachments(p => p.filter((_, j) => j !== i))}
          onSend={handleComposeSend}
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}
