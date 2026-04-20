import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { PlickersSession, PlickersQuestion } from '@/src/types';

/**
 * Manual Scan Interface - Mock camera scanning for testing
 * Allows teachers to manually input card numbers and answers
 */
export function PlickersManualScan() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<PlickersSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [answer, setAnswer] = useState<'A' | 'B' | 'C' | 'D' | ''>('');

  // Response history
  const [responses, setResponses] = useState<any[]>([]);

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/plickers/sessions/${id}`);
      const json = await res.json();
      if (json.data) {
        setSession(json.data);
        setResponses(json.data.responses || []);
      }
    } catch (e) {
      toast.error('Không thể tải phiên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    // Auto refresh every 2s
    const interval = setInterval(loadSession, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !answer) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!session) return;

    const currentQuestion = session.questions?.[session.currentQ];
    if (!currentQuestion) {
      toast.error('Không có câu hỏi hiện tại');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/plickers/sessions/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: parseInt(cardNumber),
          questionId: currentQuestion.id,
          answer
        })
      });

      const json = await res.json();
      
      if (res.ok) {
        toast.success(json.message || 'Đã ghi nhận câu trả lời');
        setCardNumber('');
        setAnswer('');
        // Reload to get updated responses
        await loadSession();
      } else {
        toast.error(json.error || 'Lỗi khi gửi câu trả lời');
      }
    } catch (e) {
      toast.error('Không thể kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-semibold">Không tìm thấy phiên</p>
        <Link to="/plickers" className="text-violet-600 hover:underline mt-2 inline-block">
          Quay lại
        </Link>
      </div>
    );
  }

  const currentQuestion = session.questions?.[session.currentQ];
  const currentResponses = responses.filter(r => r.questionId === currentQuestion?.id);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to={`/plickers/${session.id}`}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manual Scan - {session.title}</h1>
            <p className="text-slate-500 text-sm">Mock camera scanning interface for testing</p>
          </div>
        </div>

        {/* Status Banner */}
        {session.status !== 'active' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800">
            <p className="font-semibold">⚠️ Phiên không ở trạng thái active</p>
            <p className="text-sm">Chỉ có thể nhận câu trả lời khi phiên đang active</p>
          </div>
        )}

        {/* Current Question */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-lg">
              Câu {session.currentQ + 1} / {session.questions?.length || 0}
            </span>
          </div>
          
          {currentQuestion ? (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-4">{currentQuestion.text}</h2>
              
              {currentQuestion.correctAnswer && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-emerald-700">
                    <strong>Đáp án đúng:</strong> {currentQuestion.correctAnswer}
                  </p>
                </div>
              )}

              {/* Response Stats */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const count = currentResponses.filter(r => r.answer === opt).length;
                  const isCorrect = currentQuestion.correctAnswer === opt;
                  
                  return (
                    <div
                      key={opt}
                      className={`rounded-xl p-3 border-2 ${
                        isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {opt}
                        </span>
                        <span className="text-lg font-black text-slate-800">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-slate-500">Không có câu hỏi</p>
          )}
        </div>

        {/* Scan Form */}
        {session.status === 'active' && currentQuestion && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Nhập câu trả lời</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Số thẻ (1-40)
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-violet-400 outline-none"
                  placeholder="VD: 5"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Đáp án
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(opt)}
                      disabled={submitting}
                      className={`py-2.5 rounded-xl font-bold border-2 transition-all ${
                        answer === opt
                          ? 'border-violet-500 bg-violet-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-violet-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !cardNumber || !answer}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Gửi câu trả lời
                </>
              )}
            </button>
          </form>
        )}

        {/* Response History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">
            Lịch sử câu trả lời ({currentResponses.length})
          </h3>
          
          {currentResponses.length === 0 ? (
            <p className="text-slate-400 text-sm italic">Chưa có câu trả lời nào</p>
          ) : (
            <div className="space-y-2">
              {currentResponses.map((r: any) => {
                const isCorrect = currentQuestion?.correctAnswer === r.answer;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 text-violet-700 font-bold rounded-lg flex items-center justify-center">
                        #{r.cardNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Thẻ số {r.cardNumber}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(r.scannedAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-slate-700">{r.answer}</span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
