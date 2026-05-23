import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizMatchingProps {
  questionId: string;
  pairs: { left: string; right: string }[];
  answeredThisQ?: string;
  onSelectAnswer: (answer: string) => void;
}

export const QuizMatching: React.FC<QuizMatchingProps> = ({ questionId, pairs, answeredThisQ, onSelectAnswer }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);

  useEffect(() => {
    if (answeredThisQ) {
      try {
        setAnswers(JSON.parse(answeredThisQ));
      } catch (e) {}
    } else {
      setAnswers({});
    }
  }, [answeredThisQ, questionId]);

  useEffect(() => {
    // Shuffle the right side options once on mount
    if (pairs) {
      const rights = pairs.map(p => p.right);
      for (let i = rights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rights[i], rights[j]] = [rights[j], rights[i]];
      }
      setShuffledRights(rights);
    }
  }, [pairs, questionId]);

  const handleSelect = (left: string, right: string) => {
    if (answeredThisQ) return;
    setAnswers(prev => ({ ...prev, [left]: right }));
  };

  const isComplete = pairs && Object.keys(answers).length === pairs.length;

  return (
    <div className="space-y-4">
      {pairs.map((pair, idx) => {
        const selected = answers[pair.left] || '';
        const isCorrect = selected === pair.right;
        
        return (
          <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${answeredThisQ ? (isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-white border-sky-100 shadow-sm'}`}>
            <div className="flex-1 font-semibold text-slate-700">{pair.left}</div>
            <div className="shrink-0 text-sky-400 font-bold">⟶</div>
            <div className="flex-1">
              <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 outline-none"
                value={selected}
                onChange={(e) => handleSelect(pair.left, e.target.value)}
                disabled={!!answeredThisQ}
              >
                <option value="">-- Chọn đáp án --</option>
                {shuffledRights.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {answeredThisQ && (
              <div className="shrink-0">
                {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
              </div>
            )}
          </div>
        );
      })}

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
