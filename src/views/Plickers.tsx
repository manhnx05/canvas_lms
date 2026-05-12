import { useState, useEffect, useCallback } from 'react';
import { ScanLine, Plus, ExternalLink, Trash2, PlayCircle, StopCircle, MonitorPlay, ChevronRight, Loader2, BookOpen, ListChecks, Users } from 'lucide-react';
import type { PlickersSession, Course } from '@/src/types';
import { parseQuestionsFromText } from '@/src/utils/plickersParser';

interface PlickersProps {
  role: string;
}

const FLASK_URL = 'http://localhost:5000';

const STATUS_MAP = {
  idle: { label: 'Chờ', color: 'bg-slate-100 text-slate-600' },
  active: { label: 'Đang chạy', color: 'bg-emerald-100 text-emerald-700' },
  ended: { label: 'Kết thúc', color: 'bg-rose-100 text-rose-600' },
} as const;

export function Plickers({ role }: PlickersProps) {
  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  const [sessions, setSessions] = useState<PlickersSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    questions: [{ text: '', correctAnswer: '' }],
  });
  
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/plickers/sessions?teacherId=${currentUser.id}`);
      const json = await res.json();
      if (json.data) setSessions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  const loadCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem('canvas_token');
      const res = await fetch('/api/courses', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        throw new Error('Failed to fetch courses');
      }
      const json = await res.json();
      if (Array.isArray(json)) {
        setCourses(json);
      } else if (json.data) {
        setCourses(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    if (role === 'teacher') loadCourses();
  }, [loadSessions, loadCourses, role]);

  // Create session
  const handleCreate = async () => {
    if (!form.title.trim() || form.questions.some(q => !q.text.trim())) return;
    setCreating(true);
    try {
      const res = await fetch('/api/plickers/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          courseId: form.courseId || undefined,
          teacherId: currentUser.id,
          questions: form.questions.map((q, i) => ({ text: q.text, correctAnswer: q.correctAnswer || null, order: i })),
        }),
      });
      const json = await res.json();
      if (json.data) {
        setSessions(prev => [json.data, ...prev]);
        setShowCreate(false);
        setForm({ title: '', courseId: '', questions: [{ text: '', correctAnswer: '' }] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  // Delete session
  const handleDelete = async (id: string) => {
    if (!confirm('Xóa phiên Plickers này?')) return;
    await fetch(`/api/plickers/sessions/${id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Update session status
  const handleStatus = async (id: string, status: 'active' | 'ended' | 'idle') => {
    const res = await fetch(`/api/plickers/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.data) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: json.data.status } : s));
    }
  };

  // Add/remove question in form
  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, { text: '', correctAnswer: '' }] }));
  const removeQuestion = (i: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i: number, field: string, value: string) =>
    setForm(f => ({ ...f, questions: f.questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q) }));

  // Quick import parser
  const handleImport = () => {
    const newQuestions = parseQuestionsFromText(importText);
    
    if (newQuestions.length > 0) {
      setForm(f => ({
        ...f,
        questions: [...f.questions.filter(q => q.text.trim() !== ''), ...newQuestions]
      }));
      setImportText('');
      setShowImport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            Plickers — Kiểm tra nhanh
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tạo phiên kiểm tra bằng thẻ Plickers vật lý, quét kết quả theo thời gian thực</p>
        </div>
        {role === 'teacher' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo phiên mới
          </button>
        )}
      </div>

      {/* Quick Launch Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg">🚀 Mở ứng dụng Plickers</p>
          <p className="text-violet-200 text-sm mt-1">Mở Teacher Dashboard để quét thẻ, hoặc Student Display để chiếu câu hỏi lên màn hình lớn</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a
            href={`${FLASK_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-white/30"
          >
            <ScanLine className="w-4 h-4" /> Teacher Dashboard
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <a
            href={`${FLASK_URL}/display`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <MonitorPlay className="w-4 h-4" /> Student Display
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <a
            href="https://assets.plickers.com/plickers-cards/PlickersCards_2up.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-900 text-white border-none px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <ScanLine className="w-4 h-4" /> In Mã Mới (PDF)
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-700 text-base flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-violet-500" /> Danh sách phiên kiểm tra
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <ScanLine className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">Chưa có phiên nào</p>
            <p className="text-slate-400 text-sm mt-1">Nhấn "Tạo phiên mới" để bắt đầu</p>
          </div>
        ) : (
          sessions.map(session => {
            const statusInfo = STATUS_MAP[session.status] ?? STATUS_MAP.idle;
            return (
              <div key={session.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                {/* Icon */}
                <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <ScanLine className="w-5 h-5 text-violet-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 truncate">{session.title}</p>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {(session.questions?.length ?? 0)} câu hỏi
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {(session as any)._count?.responses ?? 0} phản hồi
                    </span>
                    <span>{session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                </div>

                {/* Actions */}
                {role === 'teacher' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {session.status === 'idle' && (
                      <button
                        onClick={() => handleStatus(session.id, 'active')}
                        title="Bắt đầu phiên"
                        className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </button>
                    )}
                    {session.status === 'active' && (
                      <button
                        onClick={() => handleStatus(session.id, 'ended')}
                        title="Kết thúc phiên"
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <StopCircle className="w-5 h-5" />
                      </button>
                    )}
                    <a
                      href={`/plickers/${session.id}`}
                      className="p-2 rounded-xl text-violet-600 hover:bg-violet-50 transition-colors"
                      title="Xem chi tiết"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Session Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-800">✨ Tạo phiên Plickers mới</h2>
              <p className="text-slate-500 text-sm mt-1">Nhập tên phiên và danh sách câu hỏi</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên phiên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Kiểm tra Toán lớp 4A - Bài 3"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-400 outline-none"
                />
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Lớp học (tùy chọn)</label>
                <select
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-400 outline-none bg-white"
                >
                  <option value="">-- Không chọn --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-slate-700">Câu hỏi <span className="text-rose-500">*</span></label>
                  <button 
                    onClick={() => setShowImport(!showImport)}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-700"
                  >
                    {showImport ? 'Nhập thủ công' : 'Import Tự Động Siêu Tốc'}
                  </button>
                </div>

                {showImport && (
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 mb-4 scale-up">
                    <p className="text-xs text-violet-600 mb-2 font-bold">
                      Cú pháp: Câu 1: [Nội dung]<br/>Đáp án: [A/B/C/D]
                    </p>
                    <textarea 
                      className="w-full h-32 p-3 text-sm border border-violet-200 rounded-lg outline-none focus:border-violet-500"
                      placeholder="Dán nội dung vào đây..."
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                    />
                    <button 
                      onClick={handleImport}
                      className="mt-2 w-full bg-violet-600 text-white font-bold text-sm py-2 rounded-lg hover:bg-violet-700 transition"
                    >
                      Bắt đầu Convert
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {form.questions.map((q, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-violet-600 bg-violet-100 rounded-lg px-2 py-0.5">Câu {i + 1}</span>
                        {form.questions.length > 1 && (
                          <button onClick={() => removeQuestion(i)} className="ml-auto text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={q.text}
                        onChange={e => updateQuestion(i, 'text', e.target.value)}
                        placeholder="Nội dung câu hỏi..."
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold">Đáp án đúng:</span>
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => updateQuestion(i, 'correctAnswer', q.correctAnswer === opt ? '' : opt)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold border-2 transition-all ${q.correctAnswer === opt ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 text-slate-500 hover:border-violet-300'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addQuestion}
                    className="w-full border-2 border-dashed border-violet-300 text-violet-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-violet-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Thêm câu hỏi
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tạo phiên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
