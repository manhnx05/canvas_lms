import React, { useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';

interface QuizFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: QuizFilters) => void;
  currentFilters: QuizFilters;
}

export interface QuizFilters {
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  topic: string;
  questionType: 'all' | 'multiple_choice';
  numQuestions: number;
}

const TOPICS = [
  'Tất cả', 'Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Lịch sử', 'Địa lý', 'Đạo đức', 'Mỹ thuật', 'Âm nhạc'
];

export function QuizFilterModal({ isOpen, onClose, onApply, currentFilters }: QuizFilterModalProps) {
  const [filters, setFilters] = useState<QuizFilters>(currentFilters);

  if (!isOpen) return null;

  const set = (key: keyof QuizFilters, val: any) => setFilters(f => ({ ...f, [key]: val }));

  const difficultyOptions = [
    { value: 'all', label: 'Tất cả', color: 'bg-slate-100 text-slate-600' },
    { value: 'easy', label: '😊 Dễ', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'medium', label: '🤔 Trung bình', color: 'bg-amber-100 text-amber-700' },
    { value: 'hard', label: '🔥 Khó', color: 'bg-rose-100 text-rose-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-500" /> Lọc bài kiểm tra
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Difficulty */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Độ khó</label>
            <div className="grid grid-cols-2 gap-2">
              {difficultyOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('difficulty', opt.value)}
                  className={`py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    filters.difficulty === opt.value
                      ? `${opt.color} border-current scale-[1.02] shadow-sm`
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Môn học / Chủ đề</label>
            <div className="relative">
              <select
                value={filters.topic}
                onChange={e => set('topic', e.target.value)}
                className="w-full appearance-none border-2 border-slate-200 rounded-xl py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:border-sky-400 outline-none bg-white"
              >
                {TOPICS.map(t => <option key={t} value={t === 'Tất cả' ? '' : t}>{t}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              Số câu hỏi: <span className="text-sky-600">{filters.numQuestions}</span>
            </label>
            <input
              type="range"
              min={3}
              max={20}
              value={filters.numQuestions}
              onChange={e => set('numQuestions', parseInt(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setFilters({ difficulty: 'all', topic: '', questionType: 'all', numQuestions: 5 }); }}
              className="flex-1 py-2.5 border-2 border-slate-200 text-slate-500 font-semibold rounded-2xl hover:bg-slate-50 text-sm"
            >
              Đặt lại
            </button>
            <button
              onClick={() => { onApply(filters); onClose(); }}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl text-sm shadow-sm"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
