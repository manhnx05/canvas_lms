import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Send, FileImage, Loader2, Bot, User as UserIcon, Plus, AlertTriangle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

// ─── Image compression ────────────────────────────────────────────────────────
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); resolve(file); };
  });
};

// ─── Image quality analysis ───────────────────────────────────────────────────
interface ImageWarning {
  dark?: boolean;    // average brightness < 60
  blurry?: boolean;  // Laplacian variance < threshold
}

/**
 * Analyze a File for brightness and blur issues using a canvas.
 * Returns an object with flags for each detected issue.
 */
const analyzeImageQuality = (file: File): Promise<ImageWarning> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const SAMPLE_SIZE = 200; // sample at 200×200 for speed
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve({}); return; }

      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

      // ── Brightness ────────────────────────────────
      let totalBrightness = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        // Luma: 0.299R + 0.587G + 0.114B
        totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgBrightness = totalBrightness / pixelCount;

      // ── Blur (simplified Laplacian variance) ──────
      // Compute grayscale
      const gray: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      // Apply 3×3 Laplacian kernel to interior pixels, collect variance
      const W = SAMPLE_SIZE;
      const laplValues: number[] = [];
      for (let y = 1; y < SAMPLE_SIZE - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          const lapl =
            -gray[idx - W - 1] - gray[idx - W] - gray[idx - W + 1]
            - gray[idx - 1] + 8 * gray[idx] - gray[idx + 1]
            - gray[idx + W - 1] - gray[idx + W] - gray[idx + W + 1];
          laplValues.push(lapl);
        }
      }
      const mean = laplValues.reduce((a, b) => a + b, 0) / laplValues.length;
      const variance = laplValues.reduce((a, b) => a + (b - mean) ** 2, 0) / laplValues.length;

      resolve({
        dark: avgBrightness < 60,
        blurry: variance < 80, // empirically tuned threshold
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({}); };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
export function AIGrading() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [imageWarnings, setImageWarnings] = useState<ImageWarning[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('canvas_token');
      const res = await fetch('/api/ai-grading', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSessions(data.sessions);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }, [messages]);

  // ─── Process files (compress + quality analysis) ──────────────────────────
  const processFiles = useCallback(async (files: File[]) => {
    setIsCompressing(true);

    const newPreviews = files.map(f => URL.createObjectURL(f));
    setFilePreviews(prev => [...prev, ...newPreviews]);

    const [compressedFiles, warnings] = await Promise.all([
      Promise.all(files.map(f => compressImage(f))),
      Promise.all(files.map(f => analyzeImageQuality(f))),
    ]);

    setSelectedFiles(prev => [...prev, ...compressedFiles]);
    setImageWarnings(prev => [...prev, ...warnings]);
    setIsCompressing(false);

    // Show toast if any quality issue detected
    const hasIssues = warnings.some(w => w.dark || w.blurry);
    if (hasIssues) {
      toast('⚠️ Một số ảnh có thể bị tối hoặc mờ. Kiểm tra cảnh báo bên dưới trước khi gửi.', {
        icon: '🔍',
        style: { background: '#fefce8', color: '#854d0e', fontWeight: 600 },
        duration: 4000,
      });
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removeFile = (idx: number) => {
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setImageWarnings(prev => prev.filter((_, i) => i !== idx));
  };

  const startNewSession = () => {
    setCurrentSession(null);
    setMessages([]);
    setSelectedFiles([]);
    setFilePreviews([]);
    setImageWarnings([]);
    setInput('');
  };

  const selectSession = (session: any) => {
    setCurrentSession(session);
    setMessages(session.messages || []);
    setSelectedFiles([]);
    setFilePreviews([]);
    setImageWarnings([]);
  };

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;
    if (!currentSession && selectedFiles.length === 0) {
      toast.error('Phiên chấm mới yêu cầu tải lên ảnh phiếu bài tập.');
      return;
    }

    const token = localStorage.getItem('canvas_token');
    setIsProcessing(true);

    try {
      if (!currentSession) {
        const formData = new FormData();
        selectedFiles.forEach((f, idx) => formData.append(`file_${idx}`, f));
        formData.append('fileCount', selectedFiles.length.toString());
        if (input) formData.append('message', input);

        setMessages([{ role: 'user', content: input || 'Gửi phiếu bài tập...', imageUrl: filePreviews.join('|||') }]);
        setInput('');
        setSelectedFiles([]);
        setFilePreviews([]);
        setImageWarnings([]);

        const res = await fetch('/api/ai-grading', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();

        if (res.ok) {
          setCurrentSession(data.session);
          setMessages(data.session.messages);
          fetchSessions();
          toast.success('Đã chấm điểm xong!');
        } else {
          toast.error(data.message || data.error || 'Có lỗi xảy ra');
          setMessages([]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        const messageToSend = input;
        setInput('');

        const res = await fetch(`/api/ai-grading/${currentSession.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageToSend })
        });
        const data = await res.json();
        if (res.ok) {
          setMessages(prev => [...prev, data.reply]);
        } else {
          toast.error(data.error || 'Có lỗi xảy ra');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-sky-50/50 border-r border-sky-100 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-sky-100">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Chấm bài mới</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => selectSession(s)}
              className={`w-full text-left p-3 rounded-xl transition-all ${currentSession?.id === s.id ? 'bg-sky-200 shadow-sm text-sky-800' : 'hover:bg-sky-100 text-sky-700'}`}
            >
              <div className="font-semibold text-sm truncate">{s.studentName || 'Học sinh ẩn danh'}</div>
              <div className="text-xs opacity-70 truncate">{new Date(s.createdAt).toLocaleDateString()} • Điểm: {s.score ?? '?'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Session info header */}
        {currentSession && (currentSession.studentName || currentSession.score) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow border border-sky-100 flex gap-4 text-sm font-semibold text-slate-700">
              <span>Bé: <span className="text-sky-600">{currentSession.studentName || 'Chưa rõ'}</span></span>
              {currentSession.studentClass && <span>• Lớp: <span className="text-amber-600">{currentSession.studentClass}</span></span>}
              {currentSession.score !== null && <span>• Điểm: <span className="text-rose-500 font-bold">{currentSession.score}/10</span></span>}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && !currentSession ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-20 h-20 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-sky-800 mb-2">Chấm Bài AI Tự Động</h3>
              <p className="text-sm max-w-sm text-sky-600">
                Tải lên hoặc chụp trực tiếp phiếu bài tập của học sinh. AI sẽ tự động đọc tên, lớp, chấm điểm và gợi ý nhận xét siêu chuẩn!
              </p>
              <div className="mt-4 flex gap-3 text-xs text-sky-500">
                <span className="bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">📷 Chụp trực tiếp</span>
                <span className="bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">🖼 Tải ảnh lên</span>
                <span className="bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">📄 Nhiều trang</span>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                {msg.role === 'model' && (
                  <div className="w-10 h-10 shrink-0 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm mt-1">
                    <Bot className="w-6 h-6" />
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'last:items-end' : ''}`}>
                  {msg.imageUrl && (
                    <div className="flex flex-wrap gap-2 justify-end mb-2">
                      {msg.imageUrl.split('|||').map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Uploaded worksheet" className="w-64 max-h-96 rounded-2xl border-4 border-white shadow-md object-cover object-top" />
                      ))}
                    </div>
                  )}
                  <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                    <div className="prose prose-sm prose-p:leading-relaxed max-w-none break-words">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 shrink-0 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 mt-1">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex gap-4 max-w-3xl mr-auto">
              <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm mt-1 animate-pulse">
                <Bot className="w-6 h-6" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-slate-50 text-slate-500 font-medium rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                AI đang phân tích phiếu bài tập...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-sky-100 bg-slate-50/50">
          {/* Image previews with quality warnings */}
          {filePreviews.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {filePreviews.map((preview, idx) => {
                const warn = imageWarnings[idx] || {};
                const hasWarn = warn.dark || warn.blurry;
                return (
                  <div key={idx} className="relative inline-block group">
                    <img
                      src={preview}
                      alt="Preview"
                      className={`h-20 w-auto rounded-lg shadow-sm object-cover border-2 transition-all ${hasWarn ? 'border-amber-400' : 'border-sky-200'}`}
                    />
                    {/* Warning badge */}
                    {hasWarn && (
                      <div className="absolute top-1 left-1 bg-amber-400 text-white rounded-full p-0.5 shadow-sm" title={[warn.dark && 'Ảnh tối', warn.blurry && 'Ảnh mờ'].filter(Boolean).join(' · ')}>
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                    )}
                    {/* Warning tooltip on hover */}
                    {hasWarn && (
                      <div className="absolute -top-9 left-0 hidden group-hover:flex bg-amber-700 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg z-10 gap-1">
                        {warn.dark && <span>🌑 Tối</span>}
                        {warn.blurry && <span>🔵 Mờ</span>}
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {isCompressing && (
            <div className="mb-2 flex items-center gap-2 text-xs text-sky-600 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang nén và kiểm tra chất lượng ảnh...
            </div>
          )}

          <div className="flex gap-3 bg-white p-2 rounded-2xl border border-sky-200 shadow-sm">
            {!currentSession && (
              <>
                {/* Camera capture button — opens device camera directly on mobile */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  title="Chụp bài làm trực tiếp"
                  className="p-3 text-sky-500 hover:bg-sky-50 rounded-xl transition-colors shrink-0 flex flex-col items-center gap-0.5"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold leading-none hidden md:block">Chụp</span>
                </button>

                {/* Gallery / file picker button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Chọn ảnh từ thư viện"
                  className="p-3 text-sky-500 hover:bg-sky-50 rounded-xl transition-colors shrink-0 flex flex-col items-center gap-0.5"
                >
                  <FileImage className="w-5 h-5" />
                  <span className="text-[9px] font-bold leading-none hidden md:block">Thư viện</span>
                </button>
              </>
            )}

            {/* Hidden inputs */}
            {/* Camera: capture="environment" triggers rear camera on mobile */}
            <input
              type="file"
              className="hidden"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              multiple
            />
            {/* File picker: no capture attribute → opens gallery/file browser */}
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={currentSession ? 'Gửi phản hồi / hỏi đáp với AI...' : 'Gửi phiếu & tin nhắn...'}
              className="flex-1 bg-transparent border-none outline-none px-2 font-medium text-slate-700 placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={isProcessing || isCompressing || (!input.trim() && filePreviews.length === 0)}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:hover:bg-sky-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden md:inline">{isCompressing ? 'Đang nén...' : 'Gửi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
