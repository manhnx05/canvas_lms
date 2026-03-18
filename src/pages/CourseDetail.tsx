import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { Role, Course, Assignment } from '../types';

export function CourseDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const [course, setCourse] = useState<Course & { assignments: Assignment[] } | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then(res => res.json())
      .then(data => setCourse(data));
  }, [id]);

  if (!course) return <div className="p-12 text-center animate-pulse">Đang tải...</div>;

  return (
    <div className="space-y-8">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sky-500 font-bold hover:text-sky-700">
        <ArrowLeft className="w-5 h-5" /> Quay lại lớp học
      </Link>

      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${course.color}`}>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="bg-white/20 w-fit px-3 py-1 mb-3 rounded-lg backdrop-blur-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">{course.studentsCount} Học sinh</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2">{course.title}</h1>
            <p className="text-lg opacity-90 font-medium">Giáo viên: {course.teacher}</p>
          </div>
          {role === 'student' && course.progress !== undefined && (
            <div className="bg-white/20 px-6 py-4 rounded-2xl backdrop-blur-sm text-center">
              <p className="text-sm font-bold uppercase mb-1">Tiến độ</p>
              <p className="text-4xl font-extrabold">{course.progress}%</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 justify-between rounded-3xl border-2 border-sky-100 shadow-sm">
            <h2 className="text-2xl font-extrabold text-sky-900 mb-4">Giới thiệu môn học</h2>
            <p className="text-slate-600 text-lg leading-relaxed">{course.description || "Chưa có mô tả."}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-sm">
            <h2 className="text-2xl font-extrabold text-sky-900 mb-6">Bài tập trong khóa</h2>
            <div className="space-y-4">
              {course.assignments.map(a => (
                <Link key={a.id} to={`/assignments/${a.id}`} className="block">
                  <div className="p-4 border-2 border-sky-50 hover:border-sky-200 rounded-2xl flex items-center gap-4 transition-colors group">
                    <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sky-900 text-lg">{a.title}</h3>
                      <p className="text-sm text-sky-500 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" /> Hạn: {a.dueDate}
                      </p>
                    </div>
                    <div>
                      {a.status === 'graded' ? <CheckCircle className="text-emerald-500" /> : <div className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-sm font-bold">{a.starsReward} Khế</div>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-sm">
            <h2 className="text-xl font-extrabold text-sky-900 mb-4">Thông tin thêm</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex gap-2"><strong className="text-sky-700">Lịch học:</strong> Thứ 2, Thứ 4</li>
              <li className="flex gap-2"><strong className="text-sky-700">Phòng học:</strong> P.201</li>
            </ul>
            {role === 'teacher' && (
              <button className="w-full mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors">
                Chỉnh sửa khóa học
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
