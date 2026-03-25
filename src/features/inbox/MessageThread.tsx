import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Paperclip, Send, X, Plus, Inbox as InboxIcon, MoreVertical, Edit2, Trash2 } from 'lucide-react';

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
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface Conversation {
  id: string;
  subject?: string;
  courseName?: string;
  participants: any[];
}

interface Props {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  input: string;
  replyAttachments: Attachment[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onAttach: (files: FileList) => void;
  onRemoveAttachment: (i: number) => void;
  onBack: () => void;
  onCompose: () => void;
  onUpdateMessage: (msgId: string, content: string) => void;
  onDeleteMessage: (msgId: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const isImage = (type: string) => type.startsWith('image/');

export function MessageThread({
  conversation, messages, currentUserId, input, replyAttachments,
  messagesEndRef, onInputChange, onSend, onAttach, onRemoveAttachment, onBack, onCompose,
  onUpdateMessage, onDeleteMessage
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleEditStart = (msg: Message) => {
    if (msg.isDeleted) return;
    setEditingMsgId(msg.id);
    setEditContent(msg.content);
    setActiveMenu(null);
  };

  const handleEditSave = () => {
    if (editingMsgId && editContent.trim()) {
      onUpdateMessage(editingMsgId, editContent.trim());
      setEditingMsgId(null);
      setEditContent('');
    }
  };

  const handleEditCancel = () => {
    setEditingMsgId(null);
    setEditContent('');
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
        <InboxIcon className="w-16 h-16 opacity-20" />
        <p className="font-medium">Chọn một cuộc hội thoại để đọc</p>
        <button
          onClick={onCompose}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Soạn thư mới
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Thread Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <button className="md:hidden p-1 text-slate-400 hover:text-slate-600" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">{conversation.subject || 'Không có tiêu đề'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {conversation.courseName && (
                <span className="inline-flex items-center gap-1 text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                  <BookOpen className="w-3 h-3" />{conversation.courseName}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {conversation.participants.map((p: any) => p.name).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fafafa]">
        {messages.map((msg) => {
          const isMe = String(msg.senderId) === String(currentUserId);
          const atts: Attachment[] = Array.isArray(msg.attachments) ? msg.attachments : [];
          return (
            <div key={msg.id} className="flex flex-col bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              {/* Email Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm shadow-sm ${isMe ? 'bg-gradient-to-br from-indigo-500 to-sky-500' : 'bg-slate-300 text-slate-700'}`}>
                    {msg.senderAvatar
                      ? <img src={msg.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                      : msg.senderName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{msg.senderName} {isMe && <span className="text-slate-400 font-normal ml-1">(Tôi)</span>}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Tới: {conversation.participants.map(p => p.name).join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">{msg.timestamp}</span>
                  {isMe && !msg.isDeleted && (
                    <div className="relative group">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === msg.id ? null : msg.id); }} 
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === msg.id && (
                        <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-10 py-1">
                          <button onClick={() => handleEditStart(msg)} className="w-full text-left px-4 py-2 text-sm text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                          </button>
                          <button onClick={() => { onDeleteMessage(msg.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Thu hồi
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Body */}
              <div className="pt-3 pl-14">
                {msg.isDeleted ? (
                  <div className="text-sm italic text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    Tin nhắn đã bị thu hồi
                  </div>
                ) : editingMsgId === msg.id ? (
                  <div className="mt-2 border border-sky-200 rounded-xl overflow-hidden shadow-sm">
                    <textarea 
                      className="w-full p-3 bg-sky-50 outline-none resize-none text-sm text-slate-700" 
                      rows={3} 
                      value={editContent} 
                      onChange={e => setEditContent(e.target.value)} 
                    />
                    <div className="flex justify-end gap-2 p-2 bg-white border-t border-sky-100">
                      <button onClick={handleEditCancel} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">Hủy</button>
                      <button onClick={handleEditSave} className="text-xs font-bold bg-sky-500 text-white px-4 py-1.5 rounded-lg hover:bg-sky-600 transition-colors shadow-sm shadow-sky-200">Lưu thay đổi</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {msg.isEdited && <span className="text-xs text-slate-400 italic ml-2">(đã chỉnh sửa)</span>}
                    </div>
                    
                    {/* Attachments */}
                    {atts.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                        {atts.map((att, i) => (
                          isImage(att.type) ? (
                            <div key={i} className="group relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer">
                              <a href={att.data} download={att.name} target="_blank" rel="noreferrer" className="block w-full h-full">
                                <img src={att.data} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </a>
                            </div>
                          ) : (
                            <a key={i} href={att.data} download={att.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-colors group">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-sky-200 group-hover:bg-sky-100 transition-colors">
                                <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                              </div>
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-xs font-semibold text-slate-700 group-hover:text-sky-700 truncate max-w-[140px] transition-colors">{att.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{formatFileSize(att.size)}</span>
                              </div>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </>
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
                <button onClick={() => onRemoveAttachment(i)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
          <textarea
            rows={2}
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Viết tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
            className="flex-1 bg-transparent px-3 py-1 outline-none text-slate-800 text-sm resize-none"
          />
          <input
            ref={fileRef} type="file" multiple className="hidden"
            onChange={e => { if (e.target.files) { onAttach(e.target.files); e.target.value = ''; } }}
          />
          <button onClick={() => fileRef.current?.click()} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-colors" title="Đính kèm file">
            <Paperclip className="w-5 h-5" />
          </button>
          <button onClick={onSend} className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl transition-colors shadow-sm shadow-sky-200">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
