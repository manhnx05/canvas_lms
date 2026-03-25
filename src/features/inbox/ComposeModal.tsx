import { useRef } from 'react';
import { Plus, X, BookOpen, ChevronDown, Paperclip, Send, Trash2 } from 'lucide-react';

interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

interface ComposeState {
  courseId: string;
  receiverId: string;
  subject: string;
  content: string;
}

interface Props {
  courses: any[];
  courseMembers: any[];
  compose: ComposeState;
  attachments: Attachment[];
  sending: boolean;
  onComposeChange: (patch: Partial<ComposeState>) => void;
  onAttach: (files: FileList) => void;
  onRemoveAttachment: (i: number) => void;
  onSend: () => void;
  onClose: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

export function ComposeModal({
  courses, courseMembers, compose, attachments, sending,
  onComposeChange, onAttach, onRemoveAttachment, onSend, onClose
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800 text-white flex justify-between items-center">
          <h3 className="font-extrabold text-base flex items-center gap-2"><Plus className="w-4 h-4" /> Soạn Thư Mới</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Course */}
          <div className="border-b border-slate-100">
            <label className="flex items-center gap-2 px-5 py-3">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 w-20 shrink-0">Môn học</span>
              <div className="relative flex-1">
                <select
                  value={compose.courseId}
                  onChange={e => onComposeChange({ courseId: e.target.value, receiverId: '' })}
                  className="w-full outline-none text-sm text-slate-700 appearance-none bg-transparent pr-5"
                >
                  <option value="">Không thuộc môn học</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </label>
          </div>

          {/* Receiver */}
          <div className="border-b border-slate-100">
            <label className="flex items-center gap-2 px-5 py-3">
              <span className="text-xs font-semibold text-slate-500 w-20 shrink-0 ml-6">Gửi đến</span>
              <div className="relative flex-1">
                <select
                  value={compose.receiverId}
                  onChange={e => onComposeChange({ receiverId: e.target.value })}
                  className="w-full outline-none text-sm text-slate-700 appearance-none bg-transparent pr-5"
                  required
                >
                  <option value="">-- Chọn người nhận --</option>
                  {courseMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})</option>
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
                onChange={e => onComposeChange({ subject: e.target.value })}
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
              onChange={e => onComposeChange({ content: e.target.value })}
              placeholder="Viết nội dung tin nhắn..."
              className="w-full outline-none text-sm text-slate-800 resize-none bg-transparent leading-relaxed"
            />
          </div>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-2 py-1 text-xs">
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <span className="opacity-60">{formatFileSize(att.size)}</span>
                  <button onClick={() => onRemoveAttachment(i)} className="hover:text-red-500 ml-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef} type="file" multiple className="hidden"
              onChange={e => { if (e.target.files) { onAttach(e.target.files); e.target.value = ''; } }}
            />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors">
              <Paperclip className="w-4 h-4" /> Đính kèm
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">Hủy</button>
            <button
              onClick={onSend}
              disabled={sending || !compose.receiverId || !compose.subject || !compose.content}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors shadow-sm shadow-sky-200"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi thư
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
