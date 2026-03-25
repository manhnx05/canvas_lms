import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';
import apiClient from '@/src/lib/apiClient';

export const ExamTaking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]); // { questionId, optionId }
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, attempt, loading]);

  const startExam = async () => {
    try {
      const examRes = await apiClient.get(`/exams/${id}`);
      setExam(examRes.data);

      const attemptRes = await apiClient.post(`/exams/${id}/start`, { userId: user.id });
      setAttempt(attemptRes.data);

      if (attemptRes.data.status === 'completed') {
        const storedAnswers = attemptRes.data.answers.map((a: any) => ({
          questionId: a.questionId,
          optionId: a.optionId
        }));
        setAnswers(storedAnswers);
      } else {
        const elapsed = Math.floor((new Date().getTime() - new Date(attemptRes.data.startTime).getTime()) / 1000);
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
        userId: user.id,
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
        userId: user.id,
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

      <div className="space-y-6">
        {exam.questions.map((q: any, i: number) => {
          const selectedOption = answers.find(a => a.questionId === q.id)?.optionId;
          const isCorrect = q.correctOptionId === selectedOption;
          
          return (
            <div key={q.id} className={`bg-white rounded-xl shadow-sm border p-6 ${isCompleted && isCorrect ? 'border-green-300 bg-green-50' : isCompleted && !isCorrect ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <span className="font-bold text-indigo-600 mr-2">Câu {i + 1}:</span>
                {q.question}
              </h3>
              <div className="space-y-3">
                {q.options.map((opt: any) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrectOption = q.correctOptionId === opt.id;
                  
                  let optionClass = "block w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ";
                  
                  if (isCompleted) {
                    if (isCorrectOption) optionClass += "border-green-500 bg-green-100 font-bold ";
                    else if (isSelected) optionClass += "border-red-500 bg-red-100 ";
                    else optionClass += "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed ";
                  } else {
                    optionClass += isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      disabled={isCompleted}
                      className={optionClass}
                    >
                      <span className="font-bold mr-2">{opt.id}.</span> {opt.text}
                    </button>
                  );
                })}
              </div>
              
              {isCompleted && q.explanation && (
                <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                  <strong>Giải thích:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isCompleted && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Đang nộp bài...' : 'Nộp Bài'}
          </button>
        </div>
      )}
    </div>
  );
};
