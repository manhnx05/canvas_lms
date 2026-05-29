import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowLeft, DownloadCloud, Send, Calendar, Clock, Edit3, Eye, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LatexRenderer } from '../components/LatexRenderer';
import apiClient from '@/src/lib/apiClient';
// html2canvas and jspdf imports removed
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { saveAs } from 'file-saver';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ExamQuestionEditor, AddQuestionButton } from '../components/optimized/ExamQuestionEditor';
import type { EditableQuestion } from '../components/optimized/ExamQuestionEditor';
import toast from 'react-hot-toast';

export const ExamViewer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewAnswers, setViewAnswers] = useState(false);
  const [statistics, setStatistics] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState<EditableQuestion[]>([]);
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  // Giao bài state
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignDuration, setAssignDuration] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditedQuestions(items => {
        const oldIdx = items.findIndex(q => q.id === active.id);
        const newIdx = items.findIndex(q => q.id === over.id);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  }, []);

  const enterEditMode = () => {
    if (!exam || !exam.questions) return;
    const cloned: EditableQuestion[] = exam.questions.map((q: any, i: number) => {
      // 1. Ensure unique ID for dnd-kit SortableContext
      const safeId = (q.id && String(q.id).trim() !== '') ? `${q.id}_${i}` : `q${i + 1}_${Date.now()}`;
      
      // 2. Ensure options are safe strings to prevent crash in ExamQuestionEditor
      let safeOptions = ['A. ', 'B. ', 'C. ', 'D. '];
      if (Array.isArray(q.options)) {
        safeOptions = q.options.map((opt: any, idx: number) => {
          if (typeof opt === 'string') return opt;
          const letter = String.fromCharCode(65 + idx);
          if (opt && typeof opt === 'object') {
            return `${letter}. ${opt.text || ''}`;
          }
          return `${letter}. `;
        });
      }

      return {
        id: safeId,
        content: q.content || q.question || '',
        level: q.level || 'NB',
        type: q.type || 'multiple_choice',
        options: safeOptions,
        answer: q.answer || q.correctOptionId || 'A',
        explanation: q.explanation || '',
        score: q.score || 0.25,
      };
    });
    setEditedQuestions(cloned);
    setEditMode(true);
  };

  const addManualQuestion = () => {
    const newQ: EditableQuestion = {
      id: `manual_${Date.now()}`,
      content: '',
      level: 'NB',
      type: 'multiple_choice',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      answer: 'A',
      explanation: '',
      score: 0.25,
    };
    setEditedQuestions(prev => [...prev, newQ]);
  };

  const saveEdits = async () => {
    try {
      setIsSavingEdits(true);
      await apiClient.put(`/exams/${id}`, { questions: editedQuestions });
      setExam((prev: any) => ({ ...prev, questions: editedQuestions }));
      setEditMode(false);
      toast.success('Đã lưu chỉnh sửa đề thi!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu chỉnh sửa');
    } finally {
      setIsSavingEdits(false);
    }
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await apiClient.get(`/exams/${id}`);
        setExam(res.data);
        // Pre-select lớp nếu đề đã được giao
        if (res.data.courseId) setSelectedCourseId(res.data.courseId);
        if (res.data.deadline) setDeadline(new Date(res.data.deadline).toISOString().slice(0,16));
      } catch (err: any) {
        console.error('Error fetching exam:', err);
        alert(err.message || 'Không thể tải đề thi. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
    // Lấy danh sách lớp học thật
    apiClient.get('/courses').then(res => setCourses(res.data)).catch(console.error);
    apiClient.get(`/exams/${id}/statistics`).then(res => setStatistics(res.data)).catch(console.error);
  }, [id]);

  const handleAssign = async (assignMaxAttempts: number = 1) => {
    if (!selectedCourseId) { setAssignError('Vui lòng chọn lớp học'); return; }
    try {
      setAssigning(true);
      setAssignError('');
      const res = await apiClient.post(`/exams/${id}/assign`, {
        courseId: selectedCourseId,
        deadline: deadline || null,
        duration: assignDuration || exam?.duration,
        maxAttempts: assignMaxAttempts
      });
      const data = res.data;
      setAssignSuccess(`✅ Đã giao bài cho ${courses.find(c => c.id === selectedCourseId)?.title}! Thông báo đến ${data.notified} học sinh.`);
      setExam((prev: any) => ({ ...prev, courseId: selectedCourseId, courseName: courses.find(c => c.id === selectedCourseId)?.title, status: 'published' }));
    } catch (err: any) {
      setAssignError(err.response?.data?.error || err.message || 'Lỗi khi giao bài');
    } finally {
      setAssigning(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!exam) return;
    const toastId = toast.loading('Đang tạo PDF, vui lòng đợi...');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Tạo một chuỗi HTML độc lập không chứa class TailwindCSS v4.
      // Việc này giải quyết triệt để lỗi crash 'unsupported color function "lab"' của html2canvas.
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
          <h1 style="text-align: center; font-size: 24px; text-transform: uppercase;">${exam.title || 'Đề thi'}</h1>
          <p style="text-align: center; font-size: 16px; color: #333;">
            Môn: ${exam.subject} - Lớp: ${exam.grade} - Thời gian: ${exam.duration} phút
          </p>
          <hr style="margin: 20px 0; border: 1px solid #ccc;" />
          
          ${exam.questions.map((q: any, i: number) => `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
              <div style="font-weight: bold; margin-bottom: 10px;">Câu ${i + 1} (${q.score}đ): ${q.content}</div>
              <div style="margin-left: 20px;">
                ${Array.isArray(q.options) ? q.options.map((opt: string) => `<div style="margin-bottom: 5px;">${opt}</div>`).join('') : ''}
              </div>
              ${viewAnswers ? `
                <div style="margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
                  <p style="margin: 0 0 5px 0;"><strong>Đáp án: ${q.answer}</strong></p>
                  ${q.explanation ? `<p style="margin: 0; font-style: italic;">Giải thích: ${q.explanation}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      const opt = {
        margin:       15,
        filename:     `${exam.title || 'De_thi'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(htmlContent).save();
      
      toast.success('Xuất PDF thành công!', { id: toastId });
    } catch (error) {
      console.error('Lỗi xuất PDF', error);
      toast.error('Không thể xuất PDF. Đã xảy ra lỗi.', { id: toastId });
    }
  };

  const handleDownloadWord = async () => {
    if (!exam) return;
    try {
      const children = [
        new Paragraph({
          children: [
            new TextRun({ text: exam.title, bold: true, size: 32 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Môn: ${exam.subject} - Lớp: ${exam.grade} - Thời gian: ${exam.duration} phút`, italics: true, size: 24 }),
          ],
        }),
      ];

      exam.questions.forEach((q: any, i: number) => {
        children.push(new Paragraph({ text: '' })); // spacer
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Câu ${i + 1} (${q.score}đ): `, bold: true }),
              // Word format không native hỗ trợ Latex string ra công thức trực tiếp mà cần MathML
              // Ở đây export thô string text kèm LaTeX markup
              new TextRun({ text: q.content }), 
            ]
          })
        );
        if (q.options) {
          q.options.forEach((opt: string) => {
             children.push(new Paragraph({ children: [new TextRun({ text: `    ${opt}` })] }));
          });
        }
        
        if (viewAnswers) {
          children.push(new Paragraph({ children: [new TextRun({ text: `Đáp án: ${q.answer}`, bold: true })] }));
          if (q.explanation) {
             children.push(new Paragraph({ children: [new TextRun({ text: `Giải thích: ${q.explanation}`, italics: true })] }));
          }
        }
      });

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${exam.title}.docx`);
    } catch (err) {
      console.error('Lỗi tạo file Word', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải đề thi...</div>;
  if (!exam) return (
    <div className="p-8 text-center">
      <div className="text-red-500 text-xl font-bold mb-4">Không tìm thấy đề thi.</div>
      <button 
        onClick={() => navigate('/exams')} 
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Quay lại danh sách
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 print:p-0 print:max-w-none">
      
      {/* Action Bar (Not visible in print) */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 print:hidden">
        <button onClick={() => navigate('/exams')} className="flex items-center text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={20} className="mr-2" /> Quay lại
        </button>

        <div className="flex items-center gap-4">
          {/* Trạng thái đề */}
          {exam?.status === 'published' && exam?.courseName && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold border border-green-200">
              ✅ Đã giao: {exam.courseName}
            </span>
          )}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewAnswers(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${!viewAnswers ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Xem đề bài
            </button>
            <button
              onClick={() => setViewAnswers(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewAnswers ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kèm đáp án
            </button>
          </div>

          {exam?.status !== 'published' && (
            editMode ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition"
                >
                  <Eye className="w-4 h-4" /> Xem trước
                </button>
                <button
                  onClick={saveEdits}
                  disabled={isSavingEdits}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSavingEdits ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
                </button>
              </div>
            ) : (
              <button
                onClick={enterEditMode}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa đề
              </button>
            )
          )}

          <button onClick={handleDownloadWord} className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <DownloadCloud size={18} /> Word
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">
            <Download size={18} /> PDF
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition">
            <Printer size={18} /> In
          </button>
        </div>
      </div>

      {editMode ? (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 print:hidden">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Chỉnh sửa nội dung đề thi</h2>
          <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={editedQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                {editedQuestions.map((q, idx) => (
                  <ExamQuestionEditor
                    key={q.id}
                    question={q}
                    index={idx}
                    onChange={updated => setEditedQuestions(prev => prev.map(x => x.id === updated.id ? updated : x))}
                    onDelete={() => setEditedQuestions(prev => prev.filter(x => x.id !== q.id))}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <AddQuestionButton onClick={addManualQuestion} />
          </div>
        </div>
      ) : (
        <>
          {/* Panel Giao bài — chỉ hiển thị cho giáo viên, ẩn khi in */}
          {exam?.status !== 'published' && (
            <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-100 p-6 mb-8 print:hidden">
        <h3 className="font-bold text-indigo-900 text-base mb-4 flex items-center gap-2">
          <Send size={16} className="text-indigo-600" /> Giao Bài Cho Lớp
        </h3>
        {assignSuccess ? (
          <p className="text-green-700 font-bold">{assignSuccess}</p>
        ) : (
          <>
            {assignError && <p className="text-red-600 text-sm mb-3 font-medium">{assignError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp nhận đề:</label>
                <select
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                >
                  <option value="">-- Chọn lớp --</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1"><Calendar size={12} /> Deadline khóa bài:</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1"><Clock size={12} /> Thời lượng (phút):</label>
                <input
                  type="number" min="1"
                  placeholder={exam ? String(exam.duration) : '45'}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  value={assignDuration}
                  onChange={e => setAssignDuration(parseInt(e.target.value) || '')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1"><Clock size={12} /> Số lượt được làm:</label>
                <input
                  type="number" min="1"
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  defaultValue={1}
                  id="assignMaxAttempts"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                   const maxVal = parseInt((document.getElementById('assignMaxAttempts') as HTMLInputElement)?.value) || 1;
                   handleAssign(maxVal);
                }}
                disabled={assigning || !selectedCourseId}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200"
              >
                {assigning ? <><span className="animate-spin">⏳</span> Đang giao...</> : <><Send size={16} /> Giao bài ngay</>}
              </button>
            </div>
          </>
        )}
      </div>
      )}

      {/* Thống kê học sinh làm bài */}
      {statistics && statistics.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><div className="w-2 h-7 bg-amber-500 rounded-full"></div> Kết Quả Bài Làm ({statistics.length} lượt nộp)</h2>
          <div className="space-y-5">
            {statistics.map((stat: any) => {
              // Tính số câu đúng của từng học sinh
              const questionsArr = exam?.questions ?? [];
              const statCorrect = stat.status === 'completed'
                ? questionsArr.filter((q: any) => {
                    const chosen = stat.answers?.find((a: any) => a.questionId === q.id)?.optionId;
                    return chosen && chosen === (q.answer || q.correctOptionId);
                  }).length
                : null;
              const totalQ = questionsArr.length;
              const statScore10 = statCorrect !== null && totalQ > 0
                ? Math.round((statCorrect / totalQ) * 100) / 10
                : null;

              return (
              <div key={stat.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm transition hover:border-indigo-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full font-bold flex justify-center items-center text-xl uppercase border-2 border-indigo-200 shadow-sm">
                       {(stat.user?.name || "HS")[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900 text-xl">{stat.user?.name || 'Học sinh Ẩn danh'}</h3>
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        Lượt thi số: <span className="text-indigo-600 font-bold px-2 py-0.5 bg-indigo-100 rounded mr-2">{stat.attemptNumber}</span> 
                        {stat.status === 'completed' ? `Nộp lúc: ${new Date(stat.endTime || stat.startTime).toLocaleString('vi-VN')}` : `Bắt đầu: ${new Date(stat.startTime).toLocaleString('vi-VN')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 flex items-center gap-1 text-sm font-bold rounded-full border shadow-sm ${stat.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {stat.status === 'completed' ? 'Đã Chấm Điểm' : 'Đang Làm...'}
                    </span>
                    {stat.status === 'completed' && statCorrect !== null && (
                      <div className="flex gap-2 items-center">
                        <div className="text-center bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
                          <p className="text-xs text-indigo-500 font-bold">Số Câu Đúng</p>
                          <p className="font-black text-indigo-700 text-lg">{statCorrect}<span className="text-xs font-normal text-indigo-400">/{totalQ}</span></p>
                        </div>
                        <div className="text-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                          <p className="text-xs text-amber-500 font-bold">Thang 10</p>
                          <p className="font-black text-amber-600 text-lg">{statScore10?.toFixed(1)}<span className="text-xs font-normal text-amber-400">/10</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {stat.aiFeedback && (
                  <details className="mt-4 bg-white rounded-xl border border-indigo-100 shadow-sm cursor-pointer group p-4 outline-none">
                     <summary className="text-sm font-bold text-indigo-600 flex items-center justify-between list-none outline-none">
                       <span className="flex items-center gap-2">✨ Nhận Xét Của AI</span>
                       <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-xs group-open:rotate-180 transition-transform">▼ Mở</span>
                     </summary>
                     <div className="mt-4 pt-4 border-t border-indigo-100 prose prose-sm max-w-none text-gray-800 font-medium leading-relaxed prose-p:my-1 prose-ul:my-1 prose-h1:text-lg prose-h2:text-base prose-h1:text-indigo-900 prose-h2:text-indigo-800 prose-strong:text-indigo-900 cursor-text">
                        <ReactMarkdown>{stat.aiFeedback}</ReactMarkdown>
                     </div>
                  </details>
                )}
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Printable Area */}
      {!editMode && (
        <div ref={printRef} className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* Header Đề thi */}
        <div className="text-center mb-10 pb-6 border-b-2 border-gray-800">
          <h1 className="text-3xl font-bold uppercase mb-4 text-gray-900">{exam?.title || 'Đề thi chưa có tên'}</h1>
          <div className="flex justify-center gap-8 text-gray-700 font-medium text-lg">
            <span>Môn: {exam?.subject ? exam.subject.toUpperCase() : 'KHÔNG XÁC ĐỊNH'}</span>
            <span>Lớp: {exam?.grade || 'Chưa phân lớp'}</span>
            <span>Thời gian: {exam?.duration || 0} phút</span>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-8 print:text-sm">
          {(!exam.questions || exam.questions.length === 0) ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">Đề thi chưa có câu hỏi nào.</p>
            </div>
          ) : (
            exam.questions.map((q: any, idx: number) => (
            <div key={idx} className="break-inside-avoid text-gray-900">
              <div className="flex gap-2 font-medium mb-3">
                <span className="whitespace-nowrap font-bold">Câu {idx + 1}:</span>
                <div className="flex-1"><LatexRenderer content={q.content || q.question} /></div>
              </div>

              {q.options && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 pl-12 mt-4 text-gray-800">
                  {q.options.map((opt: any, oIdx: number) => {
                    const isStringOpt = typeof opt === 'string';
                    const optId = isStringOpt ? String.fromCharCode(65 + oIdx) : opt.id;
                    const optText = isStringOpt ? opt : opt.text;
                    const isCorrect = viewAnswers && (q.answer || q.correctOptionId) === optId;
                    
                    return (
                      <div key={oIdx} className={`flex gap-2 ${isCorrect ? 'text-green-700 font-bold bg-green-50 px-2 py-1 rounded' : ''}`}>
                         <LatexRenderer content={`${optId}. ${optText}`} />
                      </div>
                    );
                  })}
                </div>
              )}

              {viewAnswers && q.explanation && (
                <div className="mt-4 pl-12 text-gray-600 italic border-l-2 border-indigo-200 ml-2 py-1">
                  <strong>HD:</strong> <LatexRenderer content={q.explanation} />
                </div>
              )}
            </div>
          ))
          )}
        </div>

      </div>
      )}
      </>
      )}
    </div>
  );
};
