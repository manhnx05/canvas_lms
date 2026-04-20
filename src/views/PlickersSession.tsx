import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, BarChart3, Users, Loader2, ScanLine, ExternalLink, ArrowLeft, ArrowRight, MonitorPlay, AlertTriangle, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { PlickersSession, PlickersQuestion, PlickersResponse } from '@/src/types';

const FLASK_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000';

export function PlickersSession() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<PlickersSession | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingQuestion, setIsChangingQuestion] = useState(false);

  // Thêm định kiểu để dễ đọc code
  type FullQuestion = PlickersQuestion & { responses?: PlickersResponse[] };

  const loadSession = useCallback(async (showLoader = false) => {
    if (showLoader) setIsChangingQuestion(true);
    try {
      const res = await fetch(`/api/plickers/sessions/${id}`);
      const json = await res.json();
      if (json.data) {
        setSession(json.data);
        if (json.data.courseId && enrollments.length === 0) { // Only load once
          const eRes = await fetch(`/api/courses/${json.data.courseId}/enrollments`);
          const eJson = await eRes.json();
          if (eJson.data) setEnrollments(eJson.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      if (showLoader) setIsChangingQuestion(false);
    }
  }, [id, enrollments.length]);

  useEffect(() => {
    loadSession();
    // Chỉ auto-refresh khi session đang active, giảm tần suất xuống 5s
    const interval = setInterval(() => {
      if (session?.status === 'active') {
        loadSession();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loadSession, session?.status]);

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

  // Build mapping from cardNumber -> student info
  const cardMap = new Map<number, typeof enrollments[0]>();
  enrollments.forEach(e => {
    if (e.plickerCardId) cardMap.set(e.plickerCardId, e);
  });

  const handleUpdateCurrentQ = async (newQIndex: number) => {
    if (newQIndex < 0 || newQIndex >= questions.length || !session) return;
    setIsChangingQuestion(true);
    try {
      await fetch(`/api/plickers/sessions/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ currentQ: newQIndex })
      });
      await loadSession(true); // Reload with loading state
      toast.success(`Đã chuyển sang câu ${newQIndex + 1}`);
    } catch(err) {
      toast.error('Lỗi chuyển câu!');
      setIsChangingQuestion(false);
    }
  };

  const handleToggleShowAnswer = async () => {
    if (!session) return;
    try {
      const newValue = !session.showAnswer;
      await fetch(`/api/plickers/sessions/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ showAnswer: newValue })
      });
      setSession({...session, showAnswer: newValue});
      toast.success(newValue ? 'Đã hiển thị đáp án trên màn chiếu' : 'Đã ẩn đáp án');
    } catch(err) {
      toast.error('Lỗi cập nhật!');
    }
  };

  const handleToggleShowGraph = async () => {
    if (!session) return;
    try {
      const newValue = !session.showGraph;
      await fetch(`/api/plickers/sessions/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ showGraph: newValue })
      });
      setSession({...session, showGraph: newValue});
      toast.success(newValue ? 'Đã hiển thị biểu đồ trên màn chiếu' : 'Đã ẩn biểu đồ');
    } catch(err) {
      toast.error('Lỗi cập nhật!');
    }
  };

  // --- Advanced Analytics ---
  let hardestQuestion: any = null;
  let strugglingStudents: any[] = [];
  
  if (session?.status === 'ended') {
    let minCorrectRate = 100;
    
    // Tìm câu bị sai nhiều nhất
    questions.forEach((q, idx) => {
      const qResponses = responses.filter(r => r.questionId === q.id);
      if (qResponses.length > 0) {
        const correctCount = qResponses.filter(r => r.answer === q.correctAnswer).length;
        const rate = (correctCount / qResponses.length) * 100;
        if (rate <= minCorrectRate) {
          minCorrectRate = rate;
          hardestQuestion = { question: q, index: idx, rate };
        }
      }
    });

    // Lọc học sinh yếu
    const studentScores = new Map<number, { correct: number, total: number }>();
    responses.forEach(r => {
      const q = questions.find(x => x.id === r.questionId);
      const isCorrect = q?.correctAnswer === r.answer;
      const stats = studentScores.get(r.cardNumber) || { correct: 0, total: 0 };
      stats.total++;
      if (isCorrect) stats.correct++;
      studentScores.set(r.cardNumber, stats);
    });

    for (const [cardNumber, stats] of studentScores.entries()) {
      const rate = questions.length > 0 ? (stats.correct / questions.length) * 100 : 0;
      if (rate < 50) {
        strugglingStudents.push({
          card: cardNumber,
          info: cardMap.get(cardNumber),
          rate,
          correct: stats.correct
        });
      }
    }
  }

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
            href={`/plickers/${session.id}/scan`}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <ScanLine className="w-4 h-4" /> Manual Scan (Test)
          </a>
           <a
            href={`/plickers/${session.id}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <MonitorPlay className="w-4 h-4" /> Bật Máy Chiếu (Live View)
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
           <a
            href={`${FLASK_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <ScanLine className="w-4 h-4" /> Quét Thẻ (Camera)
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>
      </div>

      {/* Control Panel for Live Session */}
      {session.status === 'active' && (
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-xl mb-1">Đang ở: Câu hỏi số {session.currentQ + 1}</h3>
              <p className="text-indigo-100 text-sm">Chuyển câu hỏi ở đây sẽ tự động đồng bộ trên màn hình trình chiếu.</p>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
              <button 
                onClick={() => handleUpdateCurrentQ(session.currentQ - 1)}
                disabled={session.currentQ <= 0 || isChangingQuestion}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isChangingQuestion ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
              <span className="font-black w-24 text-center">Câu {session.currentQ + 1} / {questions.length}</span>
              <button 
                onClick={() => handleUpdateCurrentQ(session.currentQ + 1)}
                disabled={session.currentQ >= questions.length - 1 || isChangingQuestion}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isChangingQuestion ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Live View Controls */}
          <div className="flex gap-3 pt-3 border-t border-white/20">
            <button
              onClick={handleToggleShowAnswer}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                session.showAnswer
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {session.showAnswer ? '✓ Đang hiển thị đáp án' : 'Hiển thị đáp án trên màn chiếu'}
            </button>
            <button
              onClick={handleToggleShowGraph}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                session.showGraph
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {session.showGraph ? '✓ Đang hiển thị biểu đồ' : 'Hiển thị biểu đồ thống kê'}
            </button>
          </div>
        </div>
      )}

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

      {/* Advanced Analytics Dashboard */}
      {session.status === 'ended' && (hardestQuestion || strugglingStudents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Hardest Question */}
          {hardestQuestion && (
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-rose-500" />
              </div>
              <h3 className="text-rose-800 font-extrabold text-lg flex items-center gap-2 mb-4 relative z-10">
                <AlertTriangle className="w-5 h-5" /> Điểm Mù Kiến Thức
              </h3>
              <div className="bg-white/60 p-4 rounded-2xl relative z-10">
                <span className="text-xs font-bold text-rose-500 mb-1 block uppercase tracking-wider">
                  Câu hỏi lừa nhiều nhất (Câu {hardestQuestion.index + 1})
                </span>
                <p className="font-bold text-slate-800 text-lg">"{hardestQuestion.question.text}"</p>
                <div className="mt-3 flex items-center justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500">Tỷ lệ trả lời đúng:</p>
                    <p className="font-black text-2xl text-rose-600">{Math.round(hardestQuestion.rate)}%</p>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Đáp án chuẩn: </span>
                    <strong className="text-emerald-600">{hardestQuestion.question.correctAnswer}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Struggling Students */}
          {strugglingStudents.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingDown className="w-24 h-24 text-amber-500" />
              </div>
              <h3 className="text-amber-800 font-extrabold text-lg flex items-center gap-2 mb-4 relative z-10">
                <TrendingDown className="w-5 h-5" /> Nhóm Học Sinh Mất Gốc
              </h3>
              <div className="relative z-10 max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {strugglingStudents.map(st => (
                  <div key={st.card} className="flex items-center justify-between bg-white/70 p-2.5 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 text-amber-700 font-bold rounded-lg flex items-center justify-center text-xs">
                        #{st.card}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {st.info ? st.info.user.name : 'Chưa định danh'}
                        </p>
                        <p className="text-xs text-slate-500">Đúng {st.correct}/{questions.length} câu</p>
                      </div>
                    </div>
                    <span className="font-black text-amber-600 bg-amber-100 px-2 py-1 rounded w-16 text-center text-xs block">
                      {Math.round(st.rate)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Student List */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-600 mb-3">Học sinh đã trả lời ({total})</h3>
                {qResponses.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {qResponses.map(r => {
                      const studentInfo = cardMap.get(r.cardNumber);
                      const isCorrect = q.correctAnswer === r.answer;
                      return (
                        <div key={r.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                          {studentInfo ? (
                            <img src={studentInfo.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="avt" className="w-8 h-8 rounded-full border border-slate-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">#{r.cardNumber}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate" title={studentInfo?.user.name}>
                              {studentInfo ? studentInfo.user.name : `Thẻ số ${r.cardNumber}`}
                            </p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Đáp án: {r.answer}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Chưa có phản hồi</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
