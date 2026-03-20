import React, { useState, useEffect } from 'react';
import {
  Brain, ChevronRight, RotateCcw, CheckCircle, XCircle,
  Clock, Star, TrendingUp, AlertCircle, Loader
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  difficulty?: string;
  explanation?: string;
}

interface QuizSystemProps {
  assignmentId?: string;
  questions?: QuizQuestion[];
  topic?: string;
  onComplete?: (result: QuizResult) => void;
  studentName?: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  answers: Record<string, string>;
  aiFeedback?: string;
  timeTaken: number;
}

type Phase = 'ready' | 'quiz' | 'submitting' | 'result';

export function QuizSystem({ assignmentId, questions: initialQuestions, topic, onComplete, studentName }: QuizSystemProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions || []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedThisQ, setSelectedThisQ] = useState<string | null>(null);
  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'quiz') {
      timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startQuiz = async () => {
    let qs = questions;
    if (qs.length === 0 && topic) {
      setGeneratingAI(true);
      try {
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, numQuestions: 5, gradeLevel: 'Tiểu học' })
        });
        const data = await res.json();
        qs = data.questions || [];
        setQuestions(qs);
      } catch (e) { console.error(e); }
      setGeneratingAI(false);
    }
    if (qs.length === 0) return;
    setCurrentIdx(0);
    setAnswers({});
    setSelectedThisQ(null);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setPhase('quiz');
  };

  const selectAnswer = (optionId: string) => {
    if (answers[questions[currentIdx].id]) return; // already answered
    setSelectedThisQ(optionId);
    setAnswers(prev => ({ ...prev, [questions[currentIdx].id]: optionId }));
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedThisQ(answers[questions[currentIdx + 1]?.id] || null);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setPhase('submitting');
    const correct = questions.filter(q => answers[q.id] === q.correctOptionId).length;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const percentage = Math.round((correct / questions.length) * 100);

    let aiFeedback: string | undefined;
    try {
      const res = await fetch('/api/ai/evaluate-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers, studentName: studentName || currentUser.name })
      });
      const data = await res.json();
      aiFeedback = data.feedback;
    } catch (e) { console.error(e); }

    // Save to DB if assignmentId given
    if (assignmentId && currentUser.id) {
      try {
        await fetch(`/api/assignments/${assignmentId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, answers: { answers, aiFeedback, score: correct, total: questions.length } })
        });
      } catch (e) { console.error(e); }
    }

    const r: QuizResult = { score: correct, total: questions.length, percentage, answers, aiFeedback, timeTaken };
    setResult(r);
    setPhase('result');
    onComplete?.(r);
  };

  const reset = () => { setPhase('ready'); setResult(null); setAnswers({}); setCurrentIdx(0); };

  // ── Ready Screen ──
  if (phase === 'ready') {
    return (
      <div className="text-center py-10 space-y-6">
        <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-sky-200 rotate-3">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">{topic ? `Kiểm tra: ${topic}` : 'Bài kiểm tra'}</h2>
          <p className="text-slate-500 mt-2">
            {questions.length > 0 ? `${questions.length} câu hỏi` : `Sẽ tạo 5 câu hỏi bằng AI về chủ đề trên`} · Trả lời trắc nghiệm · Nhận nhận xét AI
          </p>
        </div>
        <button
          onClick={startQuiz}
          disabled={generatingAI}
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md shadow-sky-200 transition-all hover:-translate-y-0.5"
        >
          {generatingAI ? <><Loader className="w-5 h-5 animate-spin" />Đang tạo câu hỏi AI...</> : <><Brain className="w-5 h-5" />Bắt đầu làm bài</>}
        </button>
      </div>
    );
  }

  // ── Submitting Screen ──
  if (phase === 'submitting') {
    return (
      <div className="text-center py-14 space-y-4">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-extrabold text-slate-700 text-lg">AI đang chấm bài và nhận xét...</p>
        <p className="text-slate-400 text-sm">Vui lòng chờ trong giây lát 🧠</p>
      </div>
    );
  }

  // ── Result Screen ──
  if (phase === 'result' && result) {
    const getGrade = (pct: number) => {
      if (pct >= 90) return { label: 'Xuất sắc 🌟', color: 'text-amber-500', bg: 'bg-amber-50' };
      if (pct >= 70) return { label: 'Tốt 👍', color: 'text-emerald-600', bg: 'bg-emerald-50' };
      if (pct >= 50) return { label: 'Khá 📚', color: 'text-sky-600', bg: 'bg-sky-50' };
      return { label: 'Cần cố gắng hơn 💪', color: 'text-rose-600', bg: 'bg-rose-50' };
    };
    const grade = getGrade(result.percentage);

    return (
      <div className="space-y-6">
        {/* Score Card */}
        <div className={`${grade.bg} rounded-3xl p-6 text-center border-2 ${result.percentage >= 70 ? 'border-emerald-100' : 'border-rose-100'}`}>
          <p className={`text-sm font-bold uppercase tracking-wide ${grade.color} mb-2`}>{grade.label}</p>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="16" fill="none" stroke={result.percentage >= 70 ? '#10b981' : '#f43f5e'}
                strokeWidth="2.5" strokeDasharray={`${result.percentage} ${100 - result.percentage}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-extrabold text-slate-800">{result.percentage}%</p>
              <p className="text-xs text-slate-500">{result.score}/{result.total} câu</p>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600"><Clock className="w-4 h-4" />{formatTime(result.timeTaken)}</div>
            <div className="flex items-center gap-1.5 text-amber-600"><Star className="w-4 h-4 fill-amber-400" />+{result.score * 10} điểm</div>
          </div>
        </div>

        {/* Answer Review */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-700 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-sky-500" />Đáp án chi tiết</h3>
          {questions.map((q, i) => {
            const chosen = result.answers[q.id];
            const isCorrect = chosen === q.correctOptionId;
            return (
              <div key={q.id} className={`rounded-2xl p-4 border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{i + 1}. {q.question}</p>
                    <p className="text-xs mt-1">
                      Bé chọn: <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {q.options.find(o => o.id === chosen)?.text || '(chưa trả lời)'}
                      </span>
                      {!isCorrect && <>
                        {' '} · Đúng: <span className="text-emerald-600 font-bold">{q.options.find(o => o.id === q.correctOptionId)?.text}</span>
                      </>}
                    </p>
                    {q.explanation && <p className="text-xs text-slate-500 mt-1 italic">{q.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Feedback */}
        {result.aiFeedback && (
          <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100">
            <h3 className="font-extrabold text-indigo-700 flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" />Nhận xét từ AI giáo viên
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed space-y-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: result.aiFeedback.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        )}

        <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors">
          <RotateCcw className="w-4 h-4" />Làm lại bài
        </button>
      </div>
    );
  }

  // ── Quiz Screen ──
  const q = questions[currentIdx];
  const answeredThisQ = answers[q.id];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-sky-600">Câu {currentIdx + 1}/{questions.length}</span>
          {q.difficulty && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-600' :
              q.difficulty === 'hard' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {q.difficulty === 'easy' ? '😊 Dễ' : q.difficulty === 'hard' ? '🔥 Khó' : '🤔 Trung bình'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold">
          <Clock className="w-4 h-4" />
          {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 border border-sky-100">
        <p className="font-extrabold text-slate-800 text-lg leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map(opt => {
          const isChosen = answeredThisQ === opt.id;
          const isCorrect = opt.id === q.correctOptionId;
          const showResult = !!answeredThisQ;

          let cls = 'border-2 border-slate-200 bg-white text-slate-700';
          if (showResult) {
            if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
            else if (isChosen && !isCorrect) cls = 'border-rose-400 bg-rose-50 text-rose-700';
          } else if (isChosen) {
            cls = 'border-sky-400 bg-sky-50 text-sky-800';
          }

          return (
            <button
              key={opt.id}
              onClick={() => selectAnswer(opt.id)}
              disabled={!!answeredThisQ}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl font-semibold text-left transition-all hover:shadow-sm ${cls} ${!answeredThisQ ? 'hover:border-sky-300 hover:bg-sky-50 active:scale-[0.99]' : ''}`}
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                showResult && isCorrect ? 'bg-emerald-400 text-white' :
                showResult && isChosen && !isCorrect ? 'bg-rose-400 text-white' :
                'bg-slate-100 text-slate-600'
              }`}>{opt.id}</span>
              <span>{opt.text}</span>
              {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />}
              {showResult && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation after answering */}
      {answeredThisQ && q.explanation && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 font-medium"><strong>Giải thích:</strong> {q.explanation}</p>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={nextQuestion}
        disabled={!answeredThisQ}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-sm shadow-sky-200"
      >
        {currentIdx < questions.length - 1 ? <><ChevronRight className="w-5 h-5" />Câu tiếp theo</> : <><CheckCircle className="w-5 h-5" />Nộp bài</>}
      </button>
    </div>
  );
}
