import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Upload, CheckCircle } from 'lucide-react';
import { Role, Assignment } from '../types';

export function AssignmentDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [gradeStars, setGradeStars] = useState("");

  const loadData = () => {
    fetch(`/api/assignments/${id}`)
      .then(res => res.json())
      .then(data => {
        setAssignment(data);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`/api/assignments/${id}/submit`, { method: 'POST' });
    setLoading(false);
    loadData();
  };

  const handleGrade = async () => {
    setLoading(true);
    await fetch(`/api/assignments/${id}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars: gradeStars })
    });
    setLoading(false);
    loadData();
  };

  if (!assignment) return <div className="p-12 text-center animate-pulse">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/assignments" className="inline-flex items-center gap-2 text-sky-500 font-bold hover:text-sky-700">
        <ArrowLeft className="w-5 h-5" /> Quay lại danh sách bài tập
      </Link>

      <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-8 border-b-2 border-sky-100">
          <div className="flex gap-2 items-center mb-4">
            <span className="px-3 py-1 bg-sky-200 text-sky-800 rounded-lg text-xs font-bold uppercase tracking-wider">{assignment.courseName}</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center gap-1">
              {assignment.status === 'graded' ? `${assignment.starsReward} Khế (Đã chấm)` : `+${assignment.starsReward} Khế`} <Star className="w-3 h-3 fill-current" />
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-sky-900 mb-2">{assignment.title}</h1>
          <p className="text-sky-600 flex items-center gap-2 font-medium">
            <Clock className="w-5 h-5" /> Hạn hoàn thành: {assignment.dueDate}
          </p>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-sky-800 mb-3">Yêu cầu bài tập:</h2>
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 text-slate-700 text-lg leading-relaxed">
              {assignment.description || "Hãy hoàn thành bài tập theo yêu cầu của giáo viên."}
            </div>
          </div>

          {role === 'student' ? (
            <div className="border-t-2 border-sky-50 pt-8">
              <h2 className="text-xl font-bold text-sky-800 mb-4">Nộp bài của bé:</h2>
              {assignment.status === 'pending' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-sky-300 bg-sky-50 rounded-2xl p-12 text-center cursor-pointer hover:bg-sky-100 transition-colors">
                    <Upload className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                    <p className="font-bold text-sky-900">Tải tệp lên hoặc kéo thả vào đây</p>
                    <p className="text-sm text-sky-500 mt-1">Hỗ trợ ảnh, PDF, MP4</p>
                  </div>
                  <button onClick={handleSubmit} disabled={loading} className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white py-4 rounded-2xl font-extrabold text-lg transition-colors shadow-sm shadow-amber-200">
                    {loading ? "Đang nộp..." : "Nộp Bài Ngay!"}
                  </button>
                </div>
              )}
              {assignment.status === 'submitted' && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-2xl flex items-center gap-4">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                  <div>
                    <h3 className="text-emerald-800 font-bold text-lg">Tuyệt vời! Bé đã nộp bài thành công.</h3>
                    <p className="text-emerald-600 mt-1">Cô giáo sẽ sớm chấm điểm nhé.</p>
                  </div>
                </div>
              )}
              {assignment.status === 'graded' && (
                <div className="bg-sky-50 border-2 border-sky-200 p-6 rounded-2xl flex items-center gap-4">
                  <Star className="w-12 h-12 text-amber-500 fill-current" />
                  <div>
                     <h3 className="text-sky-900 font-bold text-lg">Bài đã được chấm!</h3>
                     <p className="text-sky-700 font-medium">Bé nhận được {assignment.starsReward} Khế thưởng.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="border-t-2 border-sky-50 pt-8">
               <h2 className="text-xl font-bold text-sky-800 mb-4">Bài làm của học sinh:</h2>
               {assignment.status === 'submitted' ? (
                 <div className="space-y-4">
                   <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl">
                     <p className="font-medium text-slate-700 mb-4">Có 1 học sinh đã nộp bài. Vui lòng kiểm tra và nhập điểm Khế thưởng (Ví dụ: 10, 15):</p>
                     <div className="flex gap-4">
                       <input 
                         type="number" 
                         className="border-2 border-sky-200 rounded-xl px-4 py-2 outline-none focus:border-sky-400"
                         placeholder="Nhập Khế thưởng..."
                         value={gradeStars}
                         onChange={e => setGradeStars(e.target.value)}
                       />
                       <button onClick={handleGrade} disabled={loading} className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold">
                         {loading ? "Đang chấm..." : "Khóa điểm & Chấm bài"}
                       </button>
                     </div>
                   </div>
                 </div>
               ) : assignment.status === 'graded' ? (
                 <div className="p-4 text-emerald-600 font-bold flex gap-2 items-center bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                   <CheckCircle className="w-6 h-6" /> Đã chấm xong (Thưởng {assignment.starsReward} Khế).
                 </div>
               ) : (
                 <div className="p-4 text-slate-500 text-center bg-slate-50 rounded-2xl">
                   Chưa có bài nộp nào cần chấm.
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
