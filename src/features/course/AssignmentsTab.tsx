import React, { useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, Sparkles, Link } from 'lucide-react';
import { Role } from '@/src/types';
import apiClient from '@/src/lib/apiClient';

interface Props {
  courseId: string;
  courseTitle: string;
  assignments: any[];
  role: Role;
  onRefresh: () => void;
}

export function AssignmentsTab({ courseId, courseTitle, assignments, role, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [stars, setStars] = useState('10');
  const [type, setType] = useState('quiz');
  const [desc, setDesc] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleAIGenerate = async () => {
    if (!topic) return alert('Vui lòng nhập chủ đề bài kiểm tra!');
    setGenerating(true);
    try {
      const res = await apiClient.post('/ai/generate-quiz', { topic });
      const data = res.data;
      if (data.questions) setQuestions(data.questions);
      else alert('Lỗi khi sinh đề: ' + data.error);
    } catch { alert('Gọi AI thất bại.'); }
    setGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post('/assignments', { title, courseId, courseName: courseTitle, dueDate: due, starsReward: stars, type, description: desc, questions: questions.length > 0 ? questions : null });
    setTitle(''); setDue(''); setStars('10'); setDesc(''); setTopic(''); setQuestions([]); setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-sky-900">Nhiệm Vụ / Bài Tập</h2>
        {role === 'teacher' && (
          <button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-5 h-5" /> Giao Bài
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-100 space-y-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Tiêu đề bài tập" className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
          <div className="grid grid-cols-2 gap-4">
            <input required value={due} onChange={e => setDue(e.target.value)} type="text" placeholder="Hạn nộp (VD: Ngày mai)" className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
            <input required value={stars} onChange={e => setStars(e.target.value)} type="number" placeholder="Điểm thưởng (Sao)" className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col gap-3">
            <div className="flex gap-2">
              <input value={topic} onChange={e => setTopic(e.target.value)} type="text" placeholder="Nhập chủ đề để AI ra đề trắc nghiệm..." className="flex-1 px-4 py-2 rounded-lg border focus:border-amber-500 outline-none" />
              <button type="button" onClick={handleAIGenerate} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                <Sparkles className="w-4 h-4" /> {generating ? 'AI Đang Soạn...' : 'AI Tự Ra Đề'}
              </button>
            </div>
            {questions.length > 0 && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium border border-amber-100 flex items-center justify-between">
                <span>Đã sinh thành công {questions.length} câu hỏi trắc nghiệm!</span>
                <button type="button" onClick={() => setQuestions([])} className="text-amber-500 hover:text-amber-700">Xóa</button>
              </div>
            )}
          </div>
          <textarea required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả bài tập..." rows={3} className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 font-bold">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-sm">Lưu Bài Tập</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {assignments?.length === 0 && <p className="text-slate-400 italic">Chưa có bài tập nào.</p>}
        {assignments?.map((a: any) => (
          <a key={a.id} href={`/assignments/${a.id}`} className="block">
            <div className="p-4 bg-white border-2 border-slate-100 hover:border-sky-300 rounded-2xl flex items-center gap-4 transition-colors group">
              <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sky-900 text-lg">{a.title}</h3>
                <p className="text-sm text-sky-500 flex items-center gap-1 mt-1 font-medium">
                  <Clock className="w-4 h-4" /> Hạn: {a.dueDate}
                </p>
              </div>
              <div>
                {a.status === 'graded'
                  ? <CheckCircle className="text-emerald-500 w-8 h-8" />
                  : <div className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">+{a.starsReward} Sao</div>
                }
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
