import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Brain } from 'lucide-react';
import apiClient from '@/src/lib/apiClient';
import { LatexRenderer } from '../components/LatexRenderer';

export const ExamTaking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]); // { questionId, optionId }
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [attemptsCount, setAttemptsCount] = useState<number>(1);

  const user = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  useEffect(() => {
    void startExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0 && attempt && attempt.status !== 'completed') {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && attempt && attempt.status !== 'completed' && !loading) {
      void autoSubmit();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, attempt, loading]);

  const startExam = async () => {
    try {
      const examRes = await apiClient.get(`/exams/${id}`);
      setExam(examRes.data);

      const attemptRes = await apiClient.post(`/exams/${id}/start`, { userId: user.id });
      const currentAttempt = attemptRes.data;
      setAttempt(currentAttempt);
      if (currentAttempt.maxAttempts !== undefined) setMaxAttempts(currentAttempt.maxAttempts);
      if (currentAttempt.attemptsCount !== undefined) setAttemptsCount(currentAttempt.attemptsCount);

      if (currentAttempt.status === 'completed') {
        const storedAnswers = currentAttempt.answers?.map((a: any) => ({
          questionId: a.questionId,
          optionId: a.optionId
        })) || [];
        setAnswers(storedAnswers);
      } else {
        const elapsed = Math.floor((new Date().getTime() - new Date(currentAttempt.startTime).getTime()) / 1000);
        const remaining = (examRes.data.duration * 60) - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
      }
    } catch (error) {
      console.error(error);
      alert('Không thể bắt đầu bài làm');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!window.confirm(`Bạn muốn làm lại bài thi này? (Còn ${maxAttempts - attemptsCount} lượt)`)) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/exams/${id}/retry`);
      const newAttempt = res.data;
      
      setAttempt(newAttempt);
      setMaxAttempts(newAttempt.maxAttempts);
      setAttemptsCount(newAttempt.attemptsCount);
      setAnswers([]);
      setTimeLeft(exam.duration * 60);
    } catch (err: any) {
       console.error(err);
       alert(err.response?.data?.error || 'Không thể làm lại bài.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (attempt?.status === 'completed') return;
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, optionId } : a);
      }
      return [...prev, { questionId, optionId }];
    });
  };

  const handleSubmit = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài?')) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/exams/${id}/submit`, {
        attemptId: attempt.id,
        answers
      });
      setAttempt(res.data);
      alert('Nộp bài thành công!');
    } catch (error) {
      console.error(error);
      alert('Lỗi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/exams/${id}/submit`, {
        attemptId: attempt.id,
        answers
      });
      setAttempt(res.data);
      alert('Đã hết giờ làm bài! Hệ thống tự động nộp bài.');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải đề thi...</div>;
  if (!exam) return <div className="p-8 text-center text-red-500">Đề thi không tồn tại.</div>;

  const isCompleted = attempt?.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-center sticky top-4 z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-500">Môn: {exam.subject} | Lớp: {exam.grade}</p>
        </div>
        <div className="text-right">
          {isCompleted ? (
            <div className="text-green-600 font-bold text-xl flex items-center gap-2">
              <CheckCircle size={24} /> Điểm: <span className="text-3xl">{attempt?.score}/{exam.totalScore}</span>
            </div>
          ) : (
            <div className={`font-bold text-2xl flex items-center gap-2 ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
              <Clock size={28} /> {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {isCompleted && attempt.aiFeedback && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
             <Brain size={24} className="text-indigo-600" /> Nhận xét từ AI Giáo Viên
          </h2>
          <div className="text-indigo-900 leading-relaxed max-w-none text-base space-y-2"
               dangerouslySetInnerHTML={{ __html: attempt.aiFeedback.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      )}

      <div className="space-y-6">
        {exam.questions.map((q: any, i: number) => {
          const selectedOption = answers.find(a => a.questionId === q.id)?.optionId;
          const isCorrect = q.answer === selectedOption;
          
          return (
            <div key={q.id} className={`bg-white rounded-xl shadow-sm border p-6 ${isCompleted && isCorrect ? 'border-green-300 bg-green-50' : isCompleted && !isCorrect ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex gap-2 font-medium mb-4 text-gray-900 text-lg">
                <span className="font-bold text-indigo-600 mr-2 whitespace-nowrap">Câu {i + 1}:</span>
                <div className="flex-1"><LatexRenderer content={q.content || q.question} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(q.options) && q.options.map((opt: any, oIdx: number) => {
                  const isStringOpt = typeof opt === 'string';
                  const optId = isStringOpt ? String.fromCharCode(65 + oIdx) : opt.id;
                  const optText = isStringOpt ? opt : opt.text;
                  
                  const isSelected = selectedOption === optId;
                  const isCorrectOption = (q.answer || q.correctOptionId) === optId;
                  
                  let optionClass = "flex w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer items-start ";
                  
                  if (isCompleted) {
                    if (isCorrectOption) optionClass += "border-green-500 bg-green-100 font-bold text-green-900 shadow-sm ";
                    else if (isSelected) optionClass += "border-red-500 bg-red-100 text-red-900 ";
                    else optionClass += "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed ";
                  } else {
                    optionClass += isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm" : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
                  }

                  return (
                    <button
                      key={optId}
                      onClick={() => handleSelectOption(q.id, optId)}
                      disabled={isCompleted}
                      className={optionClass}
                    >
                      <div className="flex-1"><LatexRenderer content={optText} /></div>
                    </button>
                  );
                })}
              </div>
              
              {isCompleted && q.explanation && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl text-sm leading-relaxed">
                  <strong>Giải thích:</strong> <LatexRenderer content={q.explanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isCompleted ? (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-3.5 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
          >
            {submitting ? (
              <><span className="animate-spin text-xl">⏳</span> AI đang chấm bài...</>
            ) : 'Nộp Bài & Chấm Điểm'}
          </button>
        </div>
      ) : (
        attemptsCount < maxAttempts && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-3.5 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition shadow-lg"
            >
              🔄 Làm Lại Bài Thi (Còn {maxAttempts - attemptsCount} lượt)
            </button>
          </div>
        )
      )}
    </div>
  );
};
