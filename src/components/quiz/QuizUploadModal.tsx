import React, { useState } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';

interface QuizUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsLoaded: (questions: any[]) => void;
}

const EXAMPLE_JSON = `[
  {
    "id": "q1",
    "question": "2 + 3 = ?",
    "options": [
      {"id": "A", "text": "4"},
      {"id": "B", "text": "5"},
      {"id": "C", "text": "6"},
      {"id": "D", "text": "7"}
    ],
    "correctOptionId": "B",
    "difficulty": "easy"
  }
]`;

export function QuizUploadModal({ isOpen, onClose, onQuestionsLoaded }: QuizUploadModalProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [showExample, setShowExample] = useState(false);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        let questions: any[];
        
        if (file.name.endsWith('.json')) {
          questions = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parser: question,A,B,C,D,correctId,difficulty
          const lines = content.split('\n').filter(l => l.trim()).slice(1);
          questions = lines.map((line, i) => {
            const [question, a, b, c, d, correctOptionId, difficulty] = line.split(',');
            return {
              id: `q${i + 1}`,
              question: question?.trim(),
              options: [
                { id: 'A', text: a?.trim() },
                { id: 'B', text: b?.trim() },
                { id: 'C', text: c?.trim() },
                { id: 'D', text: d?.trim() }
              ],
              correctOptionId: correctOptionId?.trim() || 'A',
              difficulty: difficulty?.trim() || 'medium'
            };
          });
        } else {
          throw new Error('Chỉ hỗ trợ file .json hoặc .csv');
        }

        if (!Array.isArray(questions) || questions.length === 0) throw new Error('File không có câu hỏi nào');
        if (!questions[0].question || !questions[0].options || !questions[0].correctOptionId) {
          throw new Error('Cấu trúc câu hỏi không đúng định dạng');
        }

        setPreview(questions.slice(0, 3));
        setStatus('success');
        setErrorMsg('');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Lỗi đọc file');
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleLoad = () => {
    if (preview.length > 0) {
      onQuestionsLoaded(preview);
      onClose();
      setStatus('idle');
      setPreview([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-500" /> Tải lên bộ câu hỏi
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Drop zone */}
          <label
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="block border-2 border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-2xl p-8 text-center cursor-pointer transition-all"
          >
            <FileJson className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-600">Kéo thả hoặc click để chọn file</p>
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ: <strong>.json</strong>, <strong>.csv</strong></p>
            <input type="file" accept=".json,.csv" className="hidden" onChange={handleInput} />
          </label>

          {/* Status */}
          {status === 'error' && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700 text-sm">Lỗi đọc file</p>
                <p className="text-rose-600 text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {status === 'success' && preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <p className="font-bold text-sm">Đọc file thành công! Xem trước {preview.length} câu đầu:</p>
              </div>
              {preview.map((q, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="font-semibold text-slate-700 text-sm">{i + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-1 mt-1.5">
                    {q.options?.map((opt: any) => (
                      <span key={opt.id} className={`text-xs px-2 py-0.5 rounded-lg ${opt.id === q.correctOptionId ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white text-slate-500'}`}>
                        {opt.id}: {opt.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Example */}
          <div>
            <button onClick={() => setShowExample(s => !s)} className="text-xs text-sky-600 font-semibold hover:underline">
              📄 {showExample ? 'Ẩn' : 'Xem'} ví dụ định dạng JSON
            </button>
            {showExample && (
              <pre className="mt-2 text-xs bg-slate-900 text-emerald-400 rounded-xl p-4 overflow-x-auto">{EXAMPLE_JSON}</pre>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-500 font-semibold rounded-2xl text-sm">
            Hủy
          </button>
          <button
            onClick={handleLoad}
            disabled={status !== 'success'}
            className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold rounded-2xl text-sm shadow-sm"
          >
            Tải vào hệ thống
          </button>
        </div>
      </div>
    </div>
  );
}
