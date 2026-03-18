import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Upload, CheckCircle } from 'lucide-react';
import { Role, Assignment } from '../types';

export function AssignmentDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/assignments/${id}`)
      .then(res => res.json())
      .then(data => {
        setAssignment(data);
        if (data.status === 'submitted' || data.status === 'graded') setSubmitted(true);
      });
  }, [id]);

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
              +{assignment.starsReward} <Star className="w-3 h-3 fill-current" />
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
              {!submitted ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-sky-300 bg-sky-50 rounded-2xl p-12 text-center cursor-pointer hover:bg-sky-100 transition-colors">
                    <Upload className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                    <p className="font-bold text-sky-900">Tải tệp lên hoặc kéo thả vào đây</p>
                    <p className="text-sm text-sky-500 mt-1">Hỗ trợ ảnh, PDF, MP4</p>
                  </div>
                  <button onClick={() => setSubmitted(true)} className="w-full bg-amber-400 hover:bg-amber-500 text-white py-4 rounded-2xl font-extrabold text-lg transition-colors shadow-sm shadow-amber-200">
                    Nộp Bài Ngay!
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-2xl flex items-center gap-4">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                  <div>
                    <h3 className="text-emerald-800 font-bold text-lg">Tuyệt vời! Bé đã nộp bài thành công.</h3>
                    <p className="text-emerald-600 mt-1">Cô giáo sẽ sớm chấm điểm nhé.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="border-t-2 border-sky-50 pt-8">
               <h2 className="text-xl font-bold text-sky-800 mb-4">Bài làm của học sinh:</h2>
               {assignment.status === 'submitted' ? (
                 <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl flex justify-between items-center">
                   <p className="font-medium text-slate-700">1 bài nộp chờ chấm</p>
                   <button className="bg-sky-500 text-white px-6 py-2 rounded-xl font-bold">Bắt đầu chấm</button>
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
