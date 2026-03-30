import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Upload, CheckCircle, Sparkles, BrainCircuit, Users } from 'lucide-react';
import { Role } from '@/src/types';
import ReactMarkdown from 'react-markdown';
import apiClient from '@/src/lib/apiClient';
import { LatexRenderer } from '../components/LatexRenderer';

export function AssignmentDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Student quiz state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Teacher grading state
  const [evaluatingSubId, setEvaluatingSubId] = useState<string|null>(null);
  
  // File submission state
  const [file, setFile] = useState<File|null>(null);

  const loadData = () => {
    apiClient.get(`/assignments/${id}`)
      .then(res => res.data)
      .then(data => setAssignment(data));
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSubmitQuiz = async () => {
    if (assignment.questions && Object.keys(answers).length < assignment.questions.length) {
       return alert("Con vui lòng làm hết tất cả các câu hỏi rồi hãy nộp nhé!");
    }
    setLoading(true);
    await apiClient.post(`/assignments/${id}/submit`, { answers });
    setLoading(false);
    loadData();
  };

  const handleManualSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('answers', JSON.stringify({})); // placeholder wrapper
    
    await apiClient.post(`/assignments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setLoading(false);
    loadData();
  };

  const handleAIGrade = async (sub: any) => {
    setEvaluatingSubId(sub.id);
    
    try {
      // 1. Hỏi AI chấm và sinh nhận xét
      const aiRes = await apiClient.post('/ai/evaluate-submission', { 
        questions: assignment.questions, 
        answers: sub.answers, 
        studentName: sub.user?.name || "Học sinh",
        assignmentTitle: assignment.title,
        assignmentContext: assignment.description || "Bài tập trắc nghiệm trên lớp học."
      });
      const aiData = aiRes.data;
      if (aiData.error) { alert("Lỗi gọi AI: " + aiData.error); setEvaluatingSubId(null); return; }
      
      // 2. Tính điểm tự động dựa trên số câu đúng
      let correctCount = 0;
      let totalQs = assignment.questions?.length || 1;
      assignment.questions?.forEach((q: any) => {
         const correctOpt = q.answer || q.correctOptionId;
         if (sub.answers && sub.answers[q.id] === correctOpt) correctCount++;
      });
      const maxReward = assignment.starsReward || 10;
      const finalScore = Math.floor((correctCount / totalQs) * maxReward);
  
      // 3. Ghi vào Database
      await apiClient.post(`/assignments/${id}/grade`, { stars: finalScore, submissionId: sub.id, feedback: aiData.feedback });
    } catch (e) {
      alert("Đã xảy ra lỗi hệ thống chấm điểm!");
    }
    setEvaluatingSubId(null);
    loadData();
  };

  if (!assignment) return <div className="p-12 text-center animate-pulse">Đang tải...</div>;

  const isQuiz = assignment.questions && assignment.questions.length > 0;
  const mySub = assignment.mySubmission;
  // Kiểm tra deadline đã qua chưa
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isClosed = dueDate && dueDate < new Date();
  const dueDateLabel = dueDate
    ? dueDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'full', timeStyle: 'short' })
    : assignment.dueDate;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sky-500 font-bold hover:text-sky-700">
        <ArrowLeft className="w-5 h-5" /> Trở rề trang Lớp Học
      </Link>

      <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-8 border-b-2 border-sky-100">
          <div className="flex gap-2 items-center mb-4">
            <span className="px-3 py-1 bg-sky-200 text-sky-800 rounded-lg text-xs font-bold uppercase tracking-wider">{assignment.courseName}</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center gap-1">
              Phần thưởng Tối đa: {assignment.starsReward} Khế <Star className="w-3 h-3 fill-current" />
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-sky-900 mb-2">{assignment.title}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sky-600 flex items-center gap-2 font-medium">
              <Clock className="w-5 h-5" /> Hạn hoàn thành: {dueDateLabel}
            </p>
            {isClosed && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                🔒 Đã đóng nộp bài
              </span>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-sky-800 mb-3">Yêu cầu bài tập:</h2>
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
              {assignment.description || "Hãy hoàn thành bài tập theo bài giảng trên lớp."}
            </div>
          </div>

          {role === 'student' ? (
            <div className="border-t-2 border-sky-50 pt-8 mt-8">
              {/* Bài đã đóng */}
              {isClosed && !mySub ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center">
                  <p className="text-red-700 font-bold text-xl">🔒 Bài tập đã đóng nộp bài</p>
                  <p className="text-red-500 mt-2">Thời hạn nộp bài đã kết thúc vào {dueDateLabel}.</p>
                </div>
              ) : !mySub || mySub.status === 'pending' ? (
                // LÀM BÀI / NỘP BÀI
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-sky-900 mb-4">Bài Làm Của Bé</h2>
                  
                  {isQuiz ? (
                    <div className="space-y-6">
                      {assignment.questions.map((q: any, i: number) => {
                        const questionText = q.question || q.content;
                        
                        return (
                          <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                            <div className="flex gap-2 font-bold text-lg text-slate-800 mb-4">
                              <span className="text-sky-600 whitespace-nowrap">Câu {i + 1}:</span>
                              <div className="flex-1 font-medium"><LatexRenderer content={questionText} /></div>
                            </div>
                            <div className="space-y-3">
                              {Array.isArray(q.options) && q.options.map((opt: any, oIdx: number) => {
                                // AI can generate either array of strings or array of {id, text}
                                const isStringOpt = typeof opt === 'string';
                                const optId = isStringOpt ? String.fromCharCode(65 + oIdx) : opt.id;
                                const optText = isStringOpt ? opt : opt.text;
                                const isSelected = answers[q.id] === optId;
                                
                                return (
                                  <label key={optId} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: optId }))} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${isSelected ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-200'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-sky-500' : 'border-slate-300'}`}>
                                       {isSelected && <div className="w-2.5 h-2.5 bg-sky-500 rounded-full" />}
                                    </div>
                                    <div className="font-medium text-slate-700 flex-1">
                                      <span className="font-bold mr-2">{optId}.</span>
                                      <LatexRenderer content={optText} />
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={handleSubmitQuiz} disabled={loading} className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white py-4 rounded-2xl font-extrabold text-xl transition-colors shadow-sm shadow-amber-200">
                        {loading ? "Đang Khóa Đáp Án..." : "Nộp Bài Ngay!"}
                      </button>
                    </div>
                  ) : (
                    // CŨ: Tải File
                    <div className="space-y-4">
                      <label htmlFor="upload-assignment" className="block border-2 border-dashed border-sky-300 bg-sky-50 rounded-2xl p-12 text-center cursor-pointer hover:bg-sky-100 transition-colors">
                        <input id="upload-assignment" type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                        {file ? (
                          <>
                            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <p className="font-bold text-emerald-800">{file.name}</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                            <p className="font-bold text-sky-900">Tải tệp lên đính kèm bài làm của Bé</p>
                          </>
                        )}
                      </label>
                      <button onClick={handleManualSubmit} disabled={loading || !file} className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white py-4 rounded-2xl font-extrabold text-lg transition-colors">
                        {loading ? "Đang nộp..." : "Xác Nhận Nộp Bài"}
                      </button>
                    </div>
                  )}
                </div>
              ) : mySub.status === 'submitted' ? (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-8 rounded-3xl text-center">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-emerald-800 font-extrabold text-2xl">Tuyệt vời! Bé đã nộp bài thành công.</h3>
                  <p className="text-emerald-600 mt-2 font-medium text-lg">Hệ thống đang chờ Cô giáo chấm điểm nhé.</p>
                  {mySub.answers?.fileUrl && (
                    <a href={mySub.answers.fileUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 bg-white px-4 py-2 rounded-xl text-emerald-700 font-bold border-2 border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
                      Xem lại tệp đã nộp
                    </a>
                  )}
                </div>
              ) : mySub.status === 'graded' ? (
                <div className="space-y-6">
                  <div className="bg-sky-50 border-2 border-sky-200 p-6 rounded-3xl flex items-center justify-between gap-4">
                     <div>
                       <h3 className="text-sky-900 font-extrabold text-2xl">Kết Quả Bài Tập!</h3>
                       <p className="text-sky-700 font-medium text-lg mt-1">Bé đã siêu xuất sắc nhận được Khế Thưởng.</p>
                     </div>
                     <div className="flex flex-col items-center bg-white py-3 px-6 rounded-2xl border-2 border-amber-200 shadow-sm shadow-amber-100">
                        <Star className="w-10 h-10 text-amber-500 fill-current mb-1" />
                        <span className="text-amber-600 font-black text-2xl">+{mySub.score} Khế</span>
                     </div>
                  </div>
                  
                  {mySub.aiFeedback && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-indigo-200 text-indigo-800 px-4 py-1 rounded-bl-2xl font-bold flex items-center gap-1 text-sm shadow-sm">
                        <Sparkles className="w-4 h-4" /> Báo Cáo Từ Thầy Cô AI
                      </div>
                      <div className="prose prose-indigo prose-lg font-medium text-indigo-900 mt-4 leading-relaxed max-w-none prose-strong:text-indigo-950 prose-p:my-2">
                         <ReactMarkdown>{mySub.aiFeedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
             // ========= TEACHER MODE =========
             <div className="border-t-2 border-sky-50 pt-8 mt-8">
               <h2 className="text-2xl font-bold text-sky-900 mb-6 flex items-center gap-2">
                 <Users className="w-6 h-6 text-sky-500" /> Chọn Lọc Bài Nộp:
               </h2>
               
               {assignment.submissions && assignment.submissions.length > 0 ? (
                 <div className="space-y-4">
                   {assignment.submissions.map((sub: any) => (
                     <div key={sub.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-200 text-sky-800 rounded-full font-bold flex justify-center items-center text-lg uppercase">
                               {(sub.user?.name || "HS")[0]}
                            </div>
                            <div>
                               <p className="font-bold text-lg text-slate-800">{sub.user?.name || "Học sinh Ẩn Danh"}</p>
                               <p className="text-sm font-medium text-slate-500">Nộp lúc: {new Date(sub.timestamp).toLocaleString("vi-VN")}</p>
                            </div>
                          </div>
                          
                          {sub.status === 'graded' ? (
                            <div className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1 border border-emerald-200">
                               <CheckCircle className="w-4 h-4" /> Đã Chấm ({sub.score} Khế)
                            </div>
                          ) : (
                            <div className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full font-bold text-sm border border-amber-200">
                               Đang chờ chấm
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                           {isQuiz ? (
                             <div className="text-slate-600 font-medium text-sm">
                               Đã chọn {Object.keys(sub.answers || {}).length} đáp án trắc nghiệm.
                             </div>
                           ) : (
                             <div className="text-slate-600 font-medium text-sm text-center">
                               Bài luận (Tự luận / Tệp đính kèm)
                               {sub.answers?.fileUrl && (
                                 <a href={sub.answers.fileUrl} target="_blank" rel="noreferrer" className="block mt-2 font-bold text-sky-500 hover:underline">
                                   Tải xuống tệp bài làm
                                 </a>
                               )}
                             </div>
                           )}
                           
                           {/* Grading Block */}
                           <div className="mt-4 flex gap-4 border-t border-slate-200 pt-4">
                             {sub.status === 'submitted' && isQuiz && (
                               <button onClick={() => handleAIGrade(sub)} disabled={evaluatingSubId === sub.id} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-sm flex justify-center items-center gap-2 transition-all">
                                 <BrainCircuit className="w-5 h-5" /> 
                                 {evaluatingSubId === sub.id ? "AI Đang Tổng Hợp..." : "Nhờ AI Chấm Tự Động & Đánh Giá"}
                               </button>
                             )}
                           </div>
                           
                           {sub.aiFeedback && (
                              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 prose prose-sm max-w-none">
                                <ReactMarkdown>{sub.aiFeedback}</ReactMarkdown>
                              </div>
                           )}
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-12 text-center text-slate-500 font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                   Hiện tại chưa có học sinh nào nộp bài.
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
