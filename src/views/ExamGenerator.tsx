import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, Settings, CheckCircle, FileText, Settings2, Sparkles, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { LatexRenderer } from '../components/LatexRenderer';
import apiClient from '@/src/lib/apiClient';

interface ExamConfig {
  title: string;
  subject: string;
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
}

export const ExamGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [courses, setCourses] = useState<any[]>([]);
  const [textbook, setTextbook] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  React.useEffect(() => {
    apiClient.get('/courses').then(res => setCourses(res.data)).catch(console.error);
    fetch('/textbooks/tu-nhien-xa-hoi-3.json')
      .then(res => res.json())
      .then(data => setTextbook(data))
      .catch(console.error);
  }, []);

  const [config, setConfig] = useState<ExamConfig>({
    title: 'Đề kiểm tra trắc nghiệm',
    subject: 'math',
    grade: '1',
    duration: 45,
    totalScore: 10,
    difficulty: 'medium',
    nbCount: 6,
    thCount: 4,
    vdCount: 2,
    vdcCount: 1,
    textbookMode: false,
    textbookScope: 'full',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ id: string, name: string }[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfigChange = (key: keyof ExamConfig, value: string | number | boolean) => {
    // Handle number inputs - prevent NaN
    if (typeof value === 'number' && isNaN(value)) {
      return; // Don't update if value is NaN
    }
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await apiClient.post('/exams/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      setUploadedFiles(prev => [...prev, { id: data.id, name: data.name }]);
    } catch (err: any) {
      setError('Lỗi tải lên file: ' + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (id: string) => {
    try {
      await apiClient.delete(`/exams/files/${id}`);
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const generateAIExam = async () => {
    try {
      setLoading(true);
      setError('');
      
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
      setStep(3);
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
    
    try {
      setLoading(true);
      setError('');
      const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);
      
      await apiClient.post('/assignments', {
        title: config.title,
        description: `Bài tập trắc nghiệm ${config.subject}`,
        courseId: selectedCourseId,
        courseName: selectedCourse?.title || 'Lớp học',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        starsReward: config.totalScore,
        type: 'quiz',
        questions: generatedQuestions
      });
      
      alert('Đã giao bài thành công!');
      navigate('/assignments');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi giao bài');
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center mb-12 relative px-8">
        <div className="absolute left-1/4 right-3/4 h-1 bg-gray-200 top-5 -z-10" />
        <div className={`absolute top-5 left-12 right-12 h-1 -z-10 transition-all ${step > 1 ? 'bg-indigo-500' : 'bg-gray-200'} ${step === 3 ? 'w-full right-0 left-0' : step === 2 ? 'w-1/2' : 'w-0'}`} />
        {renderStepIcon(1, <Settings2 size={20} />, 'Thiết lập')}
        {renderStepIcon(2, <Upload size={20} />, 'Tài liệu')}
        {renderStepIcon(3, <CheckCircle size={20} />, 'Xem & Lưu')}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={config.subject} onChange={e => handleConfigChange('subject', e.target.value)}>
                <option value="math">Toán học</option>
                <option value="physics">Vật lý</option>
                <option value="chemistry">Hóa học</option>
                <option value="biology">Sinh học</option>
                <option value="literature">Ngữ văn</option>
                <option value="history">Lịch sử</option>
                <option value="geography">Địa lý</option>
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
              <div className="mt-4 pt-4 border-t border-indigo-100">
                <label className="block text-sm font-medium text-indigo-800 mb-2">Phạm vi kiến thức ra đề:</label>
                <select className="w-full px-4 py-2 border border-indigo-200 rounded-lg bg-white"
                  value={config.textbookScope} onChange={e => handleConfigChange('textbookScope', e.target.value)}>
                  <option value="full">Cả năm</option>
                  <option value="term1">Học kì 1 (Bài 1 - 15)</option>
                  <option value="term2">Học kì 2 (Bài 16 - 27)</option>
                </select>
                <p className="text-sm mt-2 text-indigo-600">AI sẽ tự động đọc dữ liệu SGK {textbook.book_info?.title} và chỉ ra câu hỏi nằm trong phạm vi kiến thức này.</p>
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
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Tiếp tục <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2 --- */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Tài liệu tham khảo (Tùy chọn)
          </h2>
          <p className="text-gray-600 mb-6">
            Tải lên sách giáo khoa hoặc tài liệu (PDF, DOCX, TXT) để AI tạo câu hỏi sát với nội dung bài học.
          </p>

          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 font-medium">Nhấn để chọn file hoặc kéo thả vào đây</p>
            <p className="text-xs text-gray-400 mt-2">Hỗ trợ PDF, DOCX, TXT (Tối đa 10MB)</p>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium text-gray-700">Đã tải lên:</h3>
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-indigo-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <button onClick={() => handleRemoveFile(file.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-between items-center bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <div>
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="text-yellow-500" /> Sẵn sàng tạo đề!
              </h3>
              <p className="text-sm text-indigo-700 mt-1">
                AI sẽ tổng hợp công thức, ra {config.nbCount + config.thCount + config.vdCount + config.vdcCount} câu theo yêu cầu.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Quay lại
              </button>
              <button
                onClick={generateAIExam}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
              >
                {loading ? (
                  <><span className="animate-spin text-xl">⏳</span> Đang tạo...</>
                ) : (
                  <><Sparkles size={18} /> Bắt đầu tạo</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3 --- */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
              <CheckCircle className="text-green-500" /> Bản xem trước
            </h2>
            <button
              onClick={() => navigate('/exams')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Lưu & Thoát
            </button>
          </div>

          <div className="space-y-8">
            {generatedQuestions.map((q, idx) => (
              <div key={q.id || idx} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-colors hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">
                    Câu {idx + 1} <span className="text-sm font-normal text-white bg-indigo-500 px-2 py-0.5 rounded-full ml-2">{q.level}</span>
                  </h3>
                  <span className="text-sm font-medium text-gray-500">{q.score} điểm</span>
                </div>
                
                {/* Câu hỏi có chứa LaTeX */}
                <div className="mb-6 text-gray-800 text-lg">
                  <LatexRenderer content={q.content} />
                </div>

                {/* Đáp án */}
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

                {/* Giải thích */}
                {q.explanation && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <strong className="text-yellow-800">Giải thích:</strong>
                    <div className="mt-2 text-sm text-yellow-900">
                      <LatexRenderer content={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-between bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <div className="flex-1 w-full md:w-auto mb-4 md:mb-0 md:mr-6">
              <label className="block text-sm font-bold text-indigo-900 mb-2">Giao bài cho lớp:</label>
              <select 
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                <option value="">-- Chọn lớp học --</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-indigo-200 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 font-bold transition-colors">
                <ArrowLeft className="inline mr-2" size={18} /> Quay lại
              </button>
              <button 
                onClick={handleAssign} 
                disabled={loading || !selectedCourseId}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors disabled:opacity-50 flex items-center shadow-md shadow-indigo-200"
              >
                Giao bài ngay <ArrowRight className="inline ml-2" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
