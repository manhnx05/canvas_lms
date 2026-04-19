import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, BarChart3, Users, Loader2, ScanLine, ExternalLink } from 'lucide-react';
import type { PlickersSession, PlickersQuestion, PlickersResponse } from '@/src/types';

const FLASK_URL = 'http://localhost:5000';

export function PlickersSession() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<PlickersSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Thêm định kiểu để dễ đọc code
  type FullQuestion = PlickersQuestion & { responses?: PlickersResponse[] };

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/plickers/sessions/${id}`);
      const json = await res.json();
      if (json.data) setSession(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession();
    // Tuỳ chọn: thiết lập interval để auto-refresh kết quả
    const interval = setInterval(loadSession, 3000);
    return () => clearInterval(interval);
  }, [loadSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin" /> Đang tải dữ liệu...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-semibold">Khong tìm thấy phiên Plickers</p>
        <Link to="/plickers" className="text-violet-600 font-bold hover:underline mt-2 inline-block">Quay lại danh sách</Link>
      </div>
    );
  }

  const questions: FullQuestion[] = session.questions || [];
  const responses: PlickersResponse[] = session.responses || [];
  const totalStudents = new Set(responses.map(r => r.cardNumber)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/plickers" className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">{session.title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Tạo lúc: {session.createdAt ? new Date(session.createdAt).toLocaleString('vi-VN') : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <a
            href={`${FLASK_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <ScanLine className="w-4 h-4" /> Quét Thẻ
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">Tổng số câu hỏi</p>
            <p className="text-2xl font-black text-slate-800">{questions.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">Số học sinh đã quét</p>
            <p className="text-2xl font-black text-slate-800">{totalStudents}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">Tổng lượt phản hồi</p>
            <p className="text-2xl font-black text-slate-800">{responses.length}</p>
          </div>
        </div>
      </div>

      {/* Questions & Results */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-700 text-lg">Chi tiết câu hỏi</h2>
        
        {questions.map((q, i) => {
          const qResponses = q.responses || [];
          const counts = { A: 0, B: 0, C: 0, D: 0 };
          qResponses.forEach(r => {
            if (counts[r.answer as keyof typeof counts] !== undefined) {
              counts[r.answer as keyof typeof counts]++;
            }
          });
          const total = qResponses.length;

          return (
            <div key={q.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="mb-4">
                <span className="inline-block text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-lg mb-2">Câu {i + 1}</span>
                <p className="font-semibold text-slate-800">{q.text}</p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const percent = total > 0 ? (counts[opt] / total) * 100 : 0;
                  const isCorrect = q.correctAnswer === opt;
                  
                  return (
                    <div key={opt} className={`rounded-xl p-3 border-2 ${isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {opt}
                        </span>
                        <span className="font-black text-slate-700">{counts[opt]}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-slate-400'}`} 
                          style={{ width: \`\${percent}%\` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
