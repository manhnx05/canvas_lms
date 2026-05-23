import React from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LEVELS = ['NB', 'TH', 'VD', 'VDC'] as const;
const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

export interface EditableQuestion {
  id: string;
  content: string;
  level: string;
  type: string;
  options: string[];      // ["A. ...", "B. ...", "C. ...", "D. ..."]
  answer: string;         // "A" | "B" | "C" | "D"
  explanation: string;
  score: number;
}

interface ExamQuestionEditorProps {
  question: EditableQuestion;
  index: number;
  onChange: (updated: EditableQuestion) => void;
  onDelete: () => void;
}

/**
 * Inline editor for a single exam question.
 * Supports drag-and-drop via @dnd-kit/sortable when used inside a SortableContext.
 */
export function ExamQuestionEditor({ question, index, onChange, onDelete }: ExamQuestionEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const update = (field: keyof EditableQuestion, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const updateOption = (optIdx: number, value: string) => {
    const newOptions = [...question.options];
    // Keep the prefix "A. " etc. and replace text after it
    const prefix = `${OPTION_IDS[optIdx]}. `;
    newOptions[optIdx] = prefix + value.replace(/^[A-D]\.\s*/, '');
    onChange({ ...question, options: newOptions });
  };

  const getOptionText = (opt: string) => opt.replace(/^[A-D]\.\s*/, '');

  const LEVEL_COLORS: Record<string, string> = {
    NB: 'bg-blue-100 text-blue-800 border-blue-200',
    TH: 'bg-green-100 text-green-800 border-green-200',
    VD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    VDC: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-2xl p-5 transition-all ${isDragging ? 'shadow-2xl border-indigo-400' : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none p-1 rounded"
          title="Kéo để sắp xếp"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <span className="text-sm font-bold text-gray-500 min-w-[60px]">Câu {index + 1}</span>

        {/* Level selector */}
        <div className="flex gap-1">
          {LEVELS.map(lv => (
            <button
              key={lv}
              onClick={() => update('level', lv)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${question.level === lv ? LEVEL_COLORS[lv] : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400'}`}
            >
              {lv}
            </button>
          ))}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500 font-medium">Điểm:</span>
          <input
            type="number"
            min="0"
            step="0.25"
            value={question.score}
            onChange={e => update('score', parseFloat(e.target.value) || 0)}
            className="w-16 text-center text-sm font-bold border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none"
          />
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          title="Xóa câu hỏi"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Question content */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nội dung câu hỏi</label>
        <textarea
          value={question.content}
          onChange={e => update('content', e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none resize-none leading-relaxed"
          placeholder="Nhập nội dung câu hỏi..."
        />
      </div>

      {/* Options */}
      {question.type === 'multiple_choice' && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Các đáp án</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPTION_IDS.map((optId, optIdx) => {
              const isCorrect = question.answer === optId;
              return (
                <div
                  key={optId}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  {/* Correct answer toggle */}
                  <button
                    onClick={() => update('answer', optId)}
                    className={`w-7 h-7 rounded-full font-bold text-sm flex-shrink-0 border-2 transition-all ${isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-400'}`}
                    title={isCorrect ? 'Đáp án đúng' : 'Đặt làm đáp án đúng'}
                  >
                    {optId}
                  </button>
                  <input
                    type="text"
                    value={getOptionText(question.options[optIdx] || '')}
                    onChange={e => updateOption(optIdx, e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400"
                    placeholder={`Đáp án ${optId}...`}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Click vào ký tự A/B/C/D để đặt làm đáp án đúng</p>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Giải thích đáp án</label>
        <textarea
          value={question.explanation || ''}
          onChange={e => update('explanation', e.target.value)}
          rows={1}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none resize-none"
          placeholder="Giải thích tại sao đáp án đúng (không bắt buộc)..."
        />
      </div>
    </div>
  );
}

// ─── Add question button ──────────────────────────────────────────────────────
interface AddQuestionButtonProps {
  onClick: () => void;
}

export function AddQuestionButton({ onClick }: AddQuestionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-bold hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
    >
      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
      Thêm câu hỏi thủ công
    </button>
  );
}
