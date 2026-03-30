import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Settings, CheckCircle, Settings2, Sparkles, ArrowRight, ArrowLeft, Send, Clock, Calendar } from 'lucide-react';
import { LatexRenderer } from '../components/LatexRenderer';
import apiClient from '@/src/lib/apiClient';

interface ExamConfig {
  title: string;
  subject: string;   // Course.title (môn/lớp học)
  grade: string;
  duration: number;
  totalScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  nbCount: number;
  thCount: number;
  vdCount: number;
  vdcCount: number;
  textbookMode: boolean;
  textbookScope: string;
  textbookTheme: string;
  textbookLesson: number;
}

export const ExamGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Danh sách lớp học thật từ API
  const [courses, setCourses] = useState<any[]>([]);
  const [textbook, setTextbook] = useState<any>(null);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);

  // Giao bài settings
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignDuration, setAssignDuration] = useState<number | ''>('');

  React.useEffect(() => {
    // Lấy danh sách lớp học (môn học) thật từ module Quản lý Lớp học
    apiClient.get('/courses')
      .then(res => setCourses(res.data))
      .catch(console.error);

    fetch('/textbooks/tu-nhien-xa-hoi-3.json')
      .then(res => res.json())
      .then(data => setTextbook(data))
      .catch(console.error);
  }, []);

  const [config, setConfig] = useState<ExamConfig>({
    title: 'Đề kiểm tra trắc nghiệm',
    subject: '',   // Sẽ được chọn từ dropdown lớp học
    grade: '3',
    duration: 45,
    totalScore: 10,
    difficulty: 'medium',
    nbCount: 6,
    thCount: 4,
    vdCount: 2,
    vdcCount: 1,
    textbookMode: false,
    textbookScope: 'full',
    textbookTheme: 'GIA ĐÌNH',
    textbookLesson: 1,
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const handleConfigChange = (key: keyof ExamConfig, value: string | number | boolean) => {
    if (typeof value === 'number' && isNaN(value)) return;
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      // Khi chọn lớp học, auto-fill tên đề thi
      if (key === 'subject') {
        next.title = `Đề kiểm tra - ${value}`;
      }
      return next;
    });
  };

  const generateAIExam = async () => {
    if (!config.subject) {
      setError('Vui lòng chọn lớp học / môn học trước khi tạo đề.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setCreatedExamId(null);

      const userStr = localStorage.getItem('canvas_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const endpoint = config.textbookMode ? '/exams/generate-from-textbook' : '/exams/generate-ai-quick';
      const payload = config.textbookMode
        ? { ...config, createdBy: user?.id, textbookData: textbook }
        : { ...config, createdBy: user?.id };

      const res = await apiClient.post(endpoint, payload).catch((err: any) => {
        throw new Error(err.response?.data?.error || 'Lỗi tạo đề');
      });

      const data = res.data;
      setGeneratedQuestions(data.questions);
      // Lưu lại examId để dùng khi giao bài
      if (data.exam?.id) setCreatedExamId(data.exam.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourseId) {
      setError('Vui lòng chọn lớp học để giao bài');
      return;
    }
    if (!createdExamId) {
      setError('Không tìm thấy ID đề thi, vui lòng tạo lại đề.');
      return;
    }

    try {
      setAssigning(true);
      setError('');

      const res = await apiClient.post(`/exams/${createdExamId}/assign`, {
        courseId: selectedCourseId,
        deadline: deadline || null,
        duration: assignDuration || config.duration
      });

      const data = res.data;
      setSuccessMsg(`✅ Đã giao bài thành công cho ${courses.find(c => c.id === selectedCourseId)?.title}! Đã thông báo cho ${data.notified} học sinh.`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Lỗi khi giao bài');
    } finally {
      setAssigning(false);
    }
  };

  const renderStepIcon = (num: number, icon: any, label: string) => (
    <div className={`flex flex-col items-center ${step >= num ? 'text-indigo-600' : 'text-gray-400'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= num ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
        Ra Đề Thi Thông Minh (AI)
      </h1>

      {/* Stepper */}
      <div className="flex justify-between items-center mb-12 relative px-20">
        <div className="absolute left-1/4 right-1/4 h-1 bg-gray-200 top-5 -z-10" />
        {renderStepIcon(1, <Settings2 size={20} />, '1. Thiết lập & Chọn Phạm Vi')}
        {renderStepIcon(2, <CheckCircle size={20} />, '2. Duyệt Đề & Giao Bài')}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
          {error}
        </div>
      )}

      {/* --- STEP 1 --- */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Cấu hình cơ bản
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên đề thi</label>
              <input
                type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={config.title} onChange={e => handleConfigChange('title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lớp học / Môn học
                <span className="ml-2 text-xs text-indigo-500 font-normal">(từ danh sách lớp của bạn)</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={config.subject}
                onChange={e => handleConfigChange('subject', e.target.value)}
              >
                <option value="">-- Chọn lớp học --</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khối lớp</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={config.grade} onChange={e => handleConfigChange('grade', e.target.value)}>
                {['1','2','3','4','5'].map(g => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
              <input type="number" min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={config.duration} onChange={e => handleConfigChange('duration', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <hr className="my-8 border-gray-100" />

          {/* Sách giáo khoa Toggle */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <BookOpen className="text-indigo-600" /> Tích hợp Sách giáo khoa (Tự nhiên Xã hội 3)
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.textbookMode} onChange={e => handleConfigChange('textbookMode', e.target.checked)} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {config.textbookMode && textbook && (
              <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-800 mb-2">Phạm vi kiến thức ra đề:</label>
                  <select className="w-full px-4 py-2 border border-indigo-200 rounded-lg bg-white"
                    value={config.textbookScope} onChange={e => handleConfigChange('textbookScope', e.target.value)}>
                    <option value="full">Cả năm</option>
                    <option value="term1">Học kì 1 (Bài 1 - 15)</option>
                    <option value="term2">Học kì 2 (Bài 16 - 27)</option>
                    <option value="theme">Ra đề theo Giới hạn Chương (Chủ đề)</option>
                    <option value="lesson">Ra đề theo Giới hạn Bài học cụ thể</option>
                  </select>
                </div>

                {config.textbookScope === 'theme' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-indigo-800 mb-2">Chọn Chủ đề (Chương):</label>
                    <select className="w-full px-4 py-2 border border-indigo-200 rounded-lg bg-white font-bold text-indigo-900"
                      value={config.textbookTheme} onChange={e => handleConfigChange('textbookTheme', e.target.value)}>
                      {Array.from(new Set(textbook.lessons.map((l: any) => l.theme))).map(t => <option key={String(t)} value={String(t)}>{String(t)}</option>)}
                    </select>
                  </div>
                )}

                {config.textbookScope === 'lesson' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-indigo-800 mb-2">Chọn Bài Học:</label>
                    <select className="w-full px-4 py-2 border border-indigo-200 rounded-lg bg-white font-bold text-indigo-900"
                      value={config.textbookLesson} onChange={e => handleConfigChange('textbookLesson', parseInt(e.target.value))}>
                      {textbook.lessons.map((l: any) => <option key={l.lesson_id} value={l.lesson_id}>Bài {l.lesson_id}: {l.title}</option>)}
                    </select>
                  </div>
                )}
                <p className="text-sm mt-1 text-indigo-600 italic">AI sẽ tự động đối chiếu nội dung SGK {textbook.book_info?.title} và khoanh vùng theo chuẩn bạn yêu cầu.</p>
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Settings className="text-orange-500" /> Ma trận đề (Chuẩn CV 7991)
          </h2>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-bold text-blue-800 mb-2">Nhận biết</label>
              <input type="number" min="0" className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white"
                value={config.nbCount} onChange={e => handleConfigChange('nbCount', parseInt(e.target.value) || 0)} />
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <label className="block text-sm font-bold text-green-800 mb-2">Thông hiểu</label>
              <input type="number" min="0" className="w-full px-3 py-2 border border-green-200 rounded-lg bg-white"
                value={config.thCount} onChange={e => handleConfigChange('thCount', parseInt(e.target.value) || 0)} />
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <label className="block text-sm font-bold text-yellow-800 mb-2">Vận dụng</label>
              <input type="number" min="0" className="w-full px-3 py-2 border border-yellow-200 rounded-lg bg-white"
                value={config.vdCount} onChange={e => handleConfigChange('vdCount', parseInt(e.target.value) || 0)} />
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <label className="block text-sm font-bold text-red-800 mb-2">VD Cao</label>
              <input type="number" min="0" className="w-full px-3 py-2 border border-red-200 rounded-lg bg-white"
                value={config.vdcCount} onChange={e => handleConfigChange('vdcCount', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={generateAIExam}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition font-bold disabled:opacity-50"
            >
              {loading ? (
                <><span className="animate-spin text-xl">⏳</span> Đang yêu cầu AI tổng hợp...</>
              ) : (
                <><Sparkles size={20} /> AI Tạo Đề Ngay <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: Duyệt đề & Giao bài --- */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
              <CheckCircle className="text-green-500" /> Bản xem trước đề thi
            </h2>
            <button
              onClick={() => navigate('/exams')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Lưu & Thoát
            </button>
          </div>

          {/* Preview câu hỏi */}
          <div className="space-y-8 mb-10">
            {generatedQuestions.map((q, idx) => (
              <div key={q.id || idx} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-colors hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">
                    Câu {idx + 1} <span className="text-sm font-normal text-white bg-indigo-500 px-2 py-0.5 rounded-full ml-2">{q.level}</span>
                  </h3>
                  <span className="text-sm font-medium text-gray-500">{q.score} điểm</span>
                </div>
                <div className="mb-6 text-gray-800 text-lg">
                  <LatexRenderer content={q.content} />
                </div>
                {q.type === 'multiple_choice' && q.options && (
                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt: string, oIdx: number) => {
                      const isCorrect = q.answer === String.fromCharCode(65 + oIdx);
                      return (
                        <div key={oIdx} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                          <LatexRenderer content={opt} />
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.explanation && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <strong className="text-yellow-800">Giải thích:</strong>
                    <div className="mt-2 text-sm text-yellow-900"><LatexRenderer content={q.explanation} /></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Panel Giao bài */}
          {successMsg ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-800 font-bold text-lg">{successMsg}</p>
              <button onClick={() => navigate('/exams')} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                Quản lý đề thi
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-100 p-6">
              <h3 className="font-bold text-indigo-900 text-lg mb-5 flex items-center gap-2">
                <Send size={18} className="text-indigo-600" /> Giao Bài Cho Lớp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Chọn lớp */}
                <div>
                  <label className="block text-sm font-bold text-indigo-800 mb-2">Lớp học nhận đề:</label>
                  <select
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                  >
                    <option value="">-- Chọn lớp --</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-bold text-indigo-800 mb-2 flex items-center gap-1">
                    <Calendar size={14} /> Deadline khóa bài:
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                  <p className="text-xs text-indigo-500 mt-1">Để trống = không giới hạn thời gian</p>
                </div>

                {/* Duration override */}
                <div>
                  <label className="block text-sm font-bold text-indigo-800 mb-2 flex items-center gap-1">
                    <Clock size={14} /> Thời lượng làm bài (phút):
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={String(config.duration)}
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    value={assignDuration}
                    onChange={e => setAssignDuration(parseInt(e.target.value) || '')}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-indigo-200 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 font-bold transition-colors">
                  <ArrowLeft className="inline mr-2" size={18} /> Quay lại
                </button>
                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedCourseId}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-200"
                >
                  {assigning ? <><span className="animate-spin">⏳</span> Đang giao...</> : <><Send size={18} /> Giao bài ngay</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
