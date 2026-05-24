/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizDragDropProps {
  questionId: string;
  text: string;
  tokens: string[];
  answeredThisQ?: string;
  onSelectAnswer: (answer: string) => void;
}

export const QuizDragDrop: React.FC<QuizDragDropProps> = ({ questionId, text, tokens, answeredThisQ, onSelectAnswer }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({}); // blank index -> token
  const [shuffledTokens, setShuffledTokens] = useState<string[]>([]);
  const [activeBlank, setActiveBlank] = useState<string | null>(null);

  useEffect(() => {
    if (answeredThisQ) {
      try {
        setAnswers(JSON.parse(answeredThisQ));
      } catch {
        // ignore
      }
    } else {
      setAnswers({});
      setActiveBlank(null);
    }
  }, [answeredThisQ, questionId]);

  useEffect(() => {
    if (tokens && tokens.length > 0) {
      const arr = [...tokens];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledTokens(arr);
    }
  }, [tokens, questionId]);

  const handleTokenClick = (token: string) => {
    if (answeredThisQ) return;
    
    // If a blank is selected, fill it
    if (activeBlank) {
      setAnswers(prev => ({ ...prev, [activeBlank]: token }));
      setActiveBlank(null);
    } else {
      // If no blank is selected, fill the first empty blank
      const blanks = Array.from((text || '').matchAll(/\[(\d+)\]/g)).map(m => m[1]);
      const firstEmpty = blanks.find(b => !answers[b]);
      if (firstEmpty) {
        setAnswers(prev => ({ ...prev, [firstEmpty]: token }));
      }
    }
  };

  const handleBlankClick = (blankId: string) => {
    if (answeredThisQ) return;
    if (answers[blankId]) {
      // Clear it
      setAnswers(prev => {
        const next = { ...prev };
        delete next[blankId];
        return next;
      });
    } else {
      setActiveBlank(blankId);
    }
  };

  const renderTextWithBlanks = () => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const blankId = match[1];
        const token = answers[blankId];
        const isActive = activeBlank === blankId;
        
        return (
          <span
            key={i}
            onClick={() => handleBlankClick(blankId)}
            className={`inline-flex items-center justify-center min-w-[80px] h-8 mx-1 px-3 rounded-lg border-2 cursor-pointer transition-all font-bold text-sm ${
              token 
                ? 'bg-sky-100 border-sky-400 text-sky-700' 
                : isActive 
                  ? 'bg-amber-50 border-amber-400 border-dashed animate-pulse' 
                  : 'bg-slate-50 border-slate-300 border-dashed text-slate-400 hover:bg-slate-100'
            } ${answeredThisQ ? 'cursor-default' : ''}`}
          >
            {token || (isActive ? 'Chọn từ...' : 'Trống')}
          </span>
        );
      }
      return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br/>') }} />;
    });
  };

  const blanksCount = text ? Array.from(text.matchAll(/\[(\d+)\]/g)).length : 0;
  const isComplete = Object.keys(answers).length === blanksCount;

  // Verify correctness if answered
  let isAllCorrect = true;
  if (answeredThisQ && tokens) {
    isAllCorrect = tokens.every((tok, idx) => answers[(idx + 1).toString()] === tok);
  }

  return (
    <div className="space-y-6">
      <div className={`bg-white p-6 rounded-2xl border ${answeredThisQ ? (isAllCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50') : 'border-sky-200'} leading-loose text-lg text-slate-700`}>
        {renderTextWithBlanks()}
      </div>

      <div className="flex flex-wrap gap-2">
        {shuffledTokens.map((token, i) => {
          // A token might be used multiple times if duplicate? We should check index or just value.
          // Since our logic relies on value right now, if there are duplicate tokens, this simple check disables all. 
          // Assuming tokens are unique for simplicity.
          const isUsed = Object.values(answers).includes(token);
          return (
            <button
              key={i}
              onClick={() => handleTokenClick(token)}
              disabled={isUsed || !!answeredThisQ}
              className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${
                isUsed 
                  ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50' 
                  : 'bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:-translate-y-0.5 active:scale-95 shadow-sm'
              }`}
            >
              {token}
            </button>
          );
        })}
      </div>

      {answeredThisQ && (
        <div className={`p-4 rounded-xl border-2 ${isAllCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            {isAllCorrect ? <><CheckCircle className="w-5 h-5"/> Chính xác!</> : <><XCircle className="w-5 h-5"/> Sai rồi!</>}
          </div>
          {!isAllCorrect && (
            <div className="text-sm mt-2">
              <p>Đáp án đúng:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {tokens?.map((tok, idx) => (
                  <span key={idx} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-xs">[{idx + 1}]: {tok}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!answeredThisQ && (
        <button 
          onClick={() => onSelectAnswer(JSON.stringify(answers))}
          disabled={!isComplete}
          className="w-full bg-indigo-100 text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-200 disabled:opacity-50 transition-colors mt-4"
        >
          Chốt đáp án
        </button>
      )}
    </div>
  );
};
