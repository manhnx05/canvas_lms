import { useRef, useState, useMemo, useEffect } from 'react';
import { Plus, X, BookOpen, ChevronDown, Paperclip, Send, Trash2, Search } from 'lucide-react';

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
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const receiverDropdownRef = useRef<HTMLDivElement>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [receiverSearch, setReceiverSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
        setCourseSearch('');
      }
      if (receiverDropdownRef.current && !receiverDropdownRef.current.contains(event.target as Node)) {
        setShowReceiverDropdown(false);
        setReceiverSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!courseSearch) return courses;
    return courses.filter(c => 
      c.title.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, courseSearch]);

  // Filter receivers based on search
  const filteredReceivers = useMemo(() => {
    if (!receiverSearch) return courseMembers;
    return courseMembers.filter(u => 
      u.name.toLowerCase().includes(receiverSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(receiverSearch.toLowerCase())
    );
  }, [courseMembers, receiverSearch]);

  // Get selected course name
  const selectedCourseName = courses.find(c => c.id === compose.courseId)?.title || 'Không thuộc môn học';
  
  // Get selected receiver name
  const selectedReceiver = courseMembers.find(u => u.id === compose.receiverId);
  const selectedReceiverName = selectedReceiver 
    ? `${selectedReceiver.name} (${selectedReceiver.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})`
    : '-- Chọn người nhận --';

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
              <div className="relative flex-1" ref={courseDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="w-full outline-none text-sm text-slate-700 text-left flex items-center justify-between"
                >
                  <span>{selectedCourseName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                
                {showCourseDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={e => setCourseSearch(e.target.value)}
                          placeholder="Tìm môn học..."
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-sky-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          onComposeChange({ courseId: '', receiverId: '' });
                          setShowCourseDropdown(false);
                          setCourseSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 transition-colors"
                      >
                        Không thuộc môn học
                      </button>
                      {filteredCourses.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onComposeChange({ courseId: c.id, receiverId: '' });
                            setShowCourseDropdown(false);
                            setCourseSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 transition-colors"
                        >
                          {c.title}
                        </button>
                      ))}
                      {filteredCourses.length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-400 text-center">Không tìm thấy môn học</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Receiver */}
          <div className="border-b border-slate-100">
            <label className="flex items-center gap-2 px-5 py-3">
              <span className="text-xs font-semibold text-slate-500 w-20 shrink-0 ml-6">Gửi đến</span>
              <div className="relative flex-1" ref={receiverDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowReceiverDropdown(!showReceiverDropdown)}
                  className="w-full outline-none text-sm text-slate-700 text-left flex items-center justify-between"
                >
                  <span className={!compose.receiverId ? 'text-slate-400' : ''}>{selectedReceiverName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                
                {showReceiverDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={receiverSearch}
                          onChange={e => setReceiverSearch(e.target.value)}
                          placeholder="Tìm người nhận..."
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-sky-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto">
                      {filteredReceivers.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onComposeChange({ receiverId: u.id });
                            setShowReceiverDropdown(false);
                            setReceiverSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 transition-colors flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600 shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</div>
                          </div>
                        </button>
                      ))}
                      {filteredReceivers.length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-400 text-center">Không tìm thấy người nhận</div>
                      )}
                    </div>
                  </div>
                )}
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
