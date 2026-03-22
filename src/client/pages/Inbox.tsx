import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConversationList, Conversation } from '../features/inbox/ConversationList';
import { MessageThread } from '../features/inbox/MessageThread';
import { ComposeModal } from '../features/inbox/ComposeModal';
import apiClient from '../../shared/lib/apiClient';

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
  const activeConvRef = useRef<Conversation | null>(null); // Mirror để tránh stale closure trong socket
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
  const uploadFiles = async (files: FileList): Promise<Attachment[]> => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && Array.isArray(res.data.attachments)) {
        return res.data.attachments.map((a: any) => ({
          name: a.name, type: a.type, size: a.size, data: a.url
        }));
      }
      return [];
    } catch (e) {
      console.error('Lỗi upload file:', e);
      return [];
    }
  };

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

    const socket = io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const joinRoom = () => {
      if (currentUser.id) {
        socket.emit('join', currentUser.id);
        console.log(`[Socket] Joining room: ${currentUser.id}`);
      }
    };

    socket.on('connect', joinRoom);
    socket.on('reconnect', joinRoom);
    socket.on('connect_error', (err) => console.error('[Socket] connect_error:', err.message));
    socket.on('disconnect', () => console.log('[Socket] disconnected'));

    // Nếu socket đã connected trước khi listener được gắn (race condition)
    if (socket.connected) joinRoom();

    // Polling fallback every 30s
    const pollTimer = setInterval(refetchConversations, 30000);

    // Auto-open compose from Students page (?compose=1&to=...)
    const params = new URLSearchParams(window.location.search);
    if (params.get('compose') === '1' && params.get('to')) {
      setCompose(prev => ({ ...prev, receiverId: params.get('to') || '' }));
      setShowCompose(true);
    }

    return () => {
      socket.disconnect();
      clearInterval(pollTimer);
    };
  }, []);


  // ── Sync activeConvRef khi activeConv thay đổi ────────
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // ── Socket: incoming messages (mount once, dùng ref để tránh stale closure) ──
  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      const currentConv = activeConvRef.current;
      // Nếu message thuộc conversation đang mở → thêm vào messages list
      if (currentConv && msg.conversationId === currentConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev; // dedup
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          return [...prev, msg];
        });
      }
      // Cập nhật conversations sidebar (lastMessage + unreadCount)
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId);
        if (idx > -1) {
          const copy = [...prev];
          const conv = { ...copy[idx], lastMessage: msg };
          // Chỉ tăng unread nếu conversation này không đang được xem
          if (!currentConv || currentConv.id !== conv.id) {
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

    const handleMessageUpdated = (msg: any) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
      setConversations(prev => prev.map(c => 
        c.id === msg.conversationId && c.lastMessage?.id === msg.id 
          ? { ...c, lastMessage: { ...c.lastMessage, ...msg } } 
          : c
      ));
    };

    const handleMessageDeleted = (msg: any) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
      setConversations(prev => prev.map(c => 
        c.id === msg.conversationId && c.lastMessage?.id === msg.id 
          ? { ...c, lastMessage: { ...c.lastMessage, ...msg } } 
          : c
      ));
    };

    const handleNewConversation = () => refetchConversations();

    socketRef.current?.on('newMessage', handleNewMessage);
    socketRef.current?.on('newConversation', handleNewConversation);
    socketRef.current?.on('messageUpdated', handleMessageUpdated);
    socketRef.current?.on('messageDeleted', handleMessageDeleted);

    return () => {
      socketRef.current?.off('newMessage', handleNewMessage);
      socketRef.current?.off('newConversation', handleNewConversation);
      socketRef.current?.off('messageUpdated', handleMessageUpdated);
      socketRef.current?.off('messageDeleted', handleMessageDeleted);
    };
  }, []); // mount once – đọc activeConv qua ref



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
      // Gửi lên server – server sẽ emit 'newMessage' về cho tất cả participants
      // (kể cả sender), socket handler sẽ cập nhật state đồng bộ cho cả 2 phía
      await apiClient.post(`/conversations/${activeConv.id}/messages`, {
        senderId: currentUser.id,
        content,
        attachments: atts.length > 0 ? atts : undefined
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

  const handleUpdateMessage = async (msgId: string, newContent: string) => {
    try {
      await apiClient.put(`/conversations/messages/${msgId}`, { content: newContent });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      if (window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
        await apiClient.delete(`/conversations/messages/${msgId}`);
      }
    } catch (e) {
      console.error(e);
    }
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
          onAttach={async files => { const atts = await uploadFiles(files); setReplyAttachments(p => [...p, ...atts]); }}
          onRemoveAttachment={i => setReplyAttachments(p => p.filter((_, j) => j !== i))}
          onBack={() => setShowDetail(false)}
          onCompose={() => { setShowCompose(true); fetchCourses(); }}
          onUpdateMessage={handleUpdateMessage}
          onDeleteMessage={handleDeleteMessage}
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
          onAttach={async files => { const atts = await uploadFiles(files); setComposeAttachments(p => [...p, ...atts]); }}
          onRemoveAttachment={i => setComposeAttachments(p => p.filter((_, j) => j !== i))}
          onSend={handleComposeSend}
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}
