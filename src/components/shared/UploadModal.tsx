import React, { useRef, useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  title?: string;
  accept?: string;
  multiple?: boolean;
  hint?: string;
}

export function UploadModal({
  isOpen, onClose, onUpload,
  title = 'Tải lên tệp',
  accept = '*',
  multiple = false,
  hint = 'Kéo thả hoặc click để chọn tệp'
}: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setSelectedFiles(arr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-sky-400 bg-sky-50 scale-[1.02]'
                : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
            }`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-3 ${dragging ? 'text-sky-500' : 'text-slate-300'}`} />
            <p className="font-bold text-slate-600">{hint}</p>
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ: {accept === '*' ? 'Mọi định dạng' : accept}</p>
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              multiple={multiple}
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <FileText className="w-5 h-5 text-sky-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors">
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors shadow-sm shadow-sky-200"
            >
              Tải lên ({selectedFiles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
