import React, { useRef } from 'react';
import { ArrowLeft, BookOpen, Paperclip, Send, X, Plus, Inbox as InboxIcon } from 'lucide-react';

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
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onAttach: (files: FileList) => void;
  onRemoveAttachment: (i: number) => void;
  onBack: () => void;
  onCompose: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const isImage = (type: string) => type.startsWith('image/');

export function MessageThread({
  conversation, messages, currentUserId, input, replyAttachments,
  messagesEndRef, onInputChange, onSend, onAttach, onRemoveAttachment, onBack, onCompose
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          const atts: Attachment[] = Array.isArray(msg.attachments) ? msg.attachments : [];
          return (
            <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                {msg.senderAvatar
                  ? <img src={msg.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  : msg.senderName?.charAt(0)}
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
                        <a key={i} href={att.data} download={att.name}
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
