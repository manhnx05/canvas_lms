import React, { useEffect, useState, useRef } from 'react';
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
  isEdited?: boolean;
  isDeleted?: boolean;
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

  // ── Setup: initial load + polling every 15s ──────────
  useEffect(() => {
    refetchConversations().then(() => setLoading(false));
    fetchCourses();

    // Auto-open compose from Students page (?compose=1&to=...)
    const params = new URLSearchParams(window.location.search);
    if (params.get('compose') === '1' && params.get('to')) {
      setCompose(prev => ({ ...prev, receiverId: params.get('to') || '' }));
      setShowCompose(true);
    }

    // Poll conversations every 15 seconds to show new messages
    const pollTimer = setInterval(refetchConversations, 15000);

    return () => {
      clearInterval(pollTimer);
    };
  }, []);

  // ── Poll active conversation messages every 10s ──────
  useEffect(() => {
    if (!activeConv) return;

    const fetchMessages = () =>
      apiClient.get(`/conversations/${activeConv.id}/messages`)
        .then(r => r.data)
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
            setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, unreadCount: 0 } : c));
          }
        });

    fetchMessages().then(() => {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    const msgPollTimer = setInterval(fetchMessages, 10000);
    return () => clearInterval(msgPollTimer);
  }, [activeConv?.id]);

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
      const res = await apiClient.post(`/conversations/${activeConv.id}/messages`, {
        senderId: currentUser.id,
        content,
        attachments: atts.length > 0 ? atts : undefined
      });
      // Optimistically add the sent message
      const newMsg = res.data;
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Update sidebar lastMessage
      setConversations(prev => prev.map(c =>
        c.id === activeConv.id ? { ...c, lastMessage: newMsg } : c
      ));
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
      const res = await apiClient.put(`/conversations/messages/${msgId}`, { content: newContent });
      const updated = res.data;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...updated } : m));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      if (window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
        const res = await apiClient.delete(`/conversations/messages/${msgId}`);
        const deleted = res.data;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...deleted } : m));
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
