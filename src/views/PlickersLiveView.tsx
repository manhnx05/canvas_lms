import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Maximize, Play, CheckCircle2 } from 'lucide-react';
import type { PlickersSession, PlickersQuestion, PlickersResponse } from '@/src/types';

export function PlickersLiveView() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<PlickersSession | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any>(null); // from SSE
  const [showAnswer, setShowAnswer] = useState(false);

  // Load static base data
  const loadBase = useCallback(async () => {
    try {
      const res = await fetch(`/api/plickers/sessions/${id}`);
      const json = await res.json();
      if (json.data) {
        setSession(json.data);
        if (json.data.courseId) {
          const eRes = await fetch(`/api/courses/${json.data.courseId}/enrollments`);
          const eJson = await eRes.json();
          if (eJson.data) setEnrollments(eJson.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  // SSE Stream for Real-time
  useEffect(() => {
    if (!id) return;
    const sse = new EventSource(`/api/plickers/sessions/${id}/stream`);
    
    sse.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload && payload.data) {
          setLiveData(payload.data);
        }
      } catch(err) {}
    };

    sse.onerror = () => {
      console.log("SSE Reconnecting...");
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [id]);

  // Force close fullscreen on unmount
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
      }
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(()=>{});
    } else {
      document.exitFullscreen().catch(()=>{});
    }
  };

  if (!session) {
    return <div className="h-screen w-full flex items-center justify-center text-slate-400 bg-slate-900"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Phụ thuộc liveData hoac session
  const currentQIndex = liveData ? liveData.currentQ : session.currentQ;
  const questions: PlickersQuestion[] = session.questions || [];
  const currentQuestion = questions[currentQIndex];

  // Map students
  const cardMap = new Map<number, typeof enrollments[0]>();
  enrollments.forEach(e => {
    if (e.plickerCardId) cardMap.set(e.plickerCardId, e);
  });

  // Check who answered current Q
  const answeredCards = new Set<number>();
  if (liveData && liveData.responses) {
    liveData.responses.forEach((r: any) => {
      if (r.questionId === currentQuestion?.id) {
        answeredCards.add(r.cardNumber);
      }
    });
  } else if (session.responses) {
    session.responses.forEach(r => {
      if (r.questionId === currentQuestion?.id) answeredCards.add(r.cardNumber);
    });
  }

  const isEnded = (liveData ? liveData.status : session.status) === 'ended';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white overflow-hidden">
      {/* Topbar */}
      <div className="h-14 bg-slate-950/50 flex items-center justify-between px-6 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link to={`/plickers/${session.id}`} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-slate-200">
            {session.title} 
            {isEnded && <span className="ml-3 text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-md">Đã kết thúc</span>}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAnswer(!showAnswer)} className="px-4 py-1.5 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg">
            {showAnswer ? 'Ẩn đáp án' : 'Hiển thị đáp án'}
          </button>
          <button onClick={toggleFullscreen} className="text-slate-400 hover:text-white p-2">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Q Panel */}
        <div className="flex-1 flex flex-col p-8 lg:p-16 justify-center">
          {currentQuestion ? (
            <div className="max-w-4xl mx-auto w-full">
              <span className="text-indigo-400 font-black text-xl mb-4 block tracking-widest uppercase">Câu {currentQIndex + 1} / {questions.length}</span>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight mb-12 text-white">
                {currentQuestion.text}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isCorrect = showAnswer && currentQuestion.correctAnswer === opt;
                  const isWrong = showAnswer && currentQuestion.correctAnswer && currentQuestion.correctAnswer !== opt;
                  
                  return (
                    <div 
                      key={opt}
                      className={`rounded-3xl p-6 md:p-8 border-4 text-2xl md:text-3xl font-bold flex items-center gap-6 transition-all duration-500
                        ${isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 scale-105' : 
                          isWrong ? 'border-slate-800 bg-slate-900 text-slate-600 opacity-50' : 
                          'border-slate-800 bg-slate-800/50 text-slate-300'}`}
                    >
                      <span className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl
                        ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-100'}
                      `}>{opt}</span>
                      <span className="opacity-0">Lựa chọn {opt}</span> {/* Dummy text because options not in schema initially */}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-2xl font-bold">Phiên kiểm tra đã hoàn tất.</div>
          )}
        </div>

        {/* Right Student Panel */}
        <div className="w-80 bg-slate-950/80 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-300">Đã nộp: <span className="text-emerald-400 text-xl">{answeredCards.size}</span></h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {[...cardMap.values()].sort((a,b) => a.user.name.localeCompare(b.user.name)).map(e => {
              const hasAnswered = answeredCards.has(e.plickerCardId!);
              return (
                <div 
                  key={e.plickerCardId} 
                  className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all duration-300
                    ${hasAnswered ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-transparent bg-slate-800/50'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${hasAnswered ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}
                  `}>
                    #{e.plickerCardId}
                  </div>
                  <span className={`font-semibold flex-1 truncate ${hasAnswered ? 'text-white' : 'text-slate-400'}`}>
                    {e.user.name}
                  </span>
                  {hasAnswered && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
