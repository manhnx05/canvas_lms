import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, AlertCircle, Star, Trophy, Users, FileText, TrendingUp } from 'lucide-react';
import { Role } from '@/src/types';
import { useDashboardData } from '../hooks/useDashboardData';

export function Dashboard({ role }: { role: Role }) {
  const { courses, assignments, stats, loading } = useDashboardData(role);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${role === 'student' ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            {role === 'student' ? 'Chào bé An! 🌟' : 'Chào Cô Lan! 👩‍🏫'}
          </h1>
          <p className="text-lg opacity-90 font-medium">
            {role === 'student' 
              ? 'Hôm nay bé có 2 nhiệm vụ mới cần hoàn thành nhé. Cố lên nào!' 
              : 'Hôm nay cô có 12 bài tập cần chấm và 3 lớp học sắp diễn ra.'}
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
      </div>

      {/* Stats Overview */}
      {role === 'student' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center gap-5 hover:border-sky-300 transition-colors cursor-pointer">
            <div className="w-14 h-14 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center rotate-3">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-500 uppercase tracking-wider">Điểm Thưởng</p>
              <p className="text-3xl font-extrabold text-sky-900">{user.stars || 0} <span className="text-lg text-sky-400 font-semibold">Sao</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center gap-5 hover:border-sky-300 transition-colors cursor-pointer">
            <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center -rotate-3">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-500 uppercase tracking-wider">Huy Hiệu</p>
              <p className="text-3xl font-extrabold text-sky-900">5 <span className="text-lg text-sky-400 font-semibold">Cái</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center gap-5 hover:border-sky-300 transition-colors cursor-pointer">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center rotate-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-500 uppercase tracking-wider">Hoàn Thành</p>
              <p className="text-3xl font-extrabold text-sky-900">
                {assignments.length > 0 ? Math.round((assignments.filter(a => a.mySubmission?.status === 'graded').length / assignments.length) * 100) : 0}
                <span className="text-lg text-sky-400 font-semibold">%</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Tổng Học Sinh</p>
              <p className="text-2xl font-extrabold text-slate-800">{stats?.totalStudents || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Bài Cần Chấm</p>
              <p className="text-2xl font-extrabold text-slate-800">{stats?.pendingGrading || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Chuyên Cần</p>
              <p className="text-2xl font-extrabold text-slate-800">{stats?.averageAttendance || 0}%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Tiết Học Tới</p>
              <p className="text-2xl font-extrabold text-slate-800">{stats?.upcomingClasses || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-sky-900">{role === 'student' ? 'Môn Học Của Bé' : 'Lớp Học Đang Dạy'}</h2>
            <button onClick={() => navigate('/courses')} className="text-sky-600 font-bold hover:text-sky-800">Xem tất cả</button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {courses.slice(0, 4).map(course => (
              <div key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group transform hover:-translate-y-1">
                <div className={`h-28 ${course.color} p-5 flex flex-col justify-between relative overflow-hidden`}>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-20 transform rotate-12">
                    <BookOpen className="w-32 h-32 text-white" />
                  </div>
                  <div className="bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                    <span className="text-white font-bold text-sm">{course.studentsCount} Học sinh</span>
                  </div>
                  <h3 className="text-white font-extrabold text-xl leading-tight z-10">{course.title}</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-sky-700">{course.teacher}</p>
                    {role === 'student' && (
                      <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                        <span className="text-sky-600 font-bold text-sm">{course.progress}%</span>
                      </div>
                    )}
                  </div>
                  {role === 'student' && (
                    <div className="w-full bg-sky-100 rounded-full h-2.5 mb-2">
                      <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-sky-900">{role === 'student' ? 'Nhiệm Vụ Cần Làm' : 'Cần Chấm Điểm'}</h2>
          <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm p-2">
            {assignments.filter(a => role === 'student' ? a.status === 'published' : a.mySubmission?.status === 'submitted').map((task) => (
              <div key={task.id} onClick={() => navigate(`/assignments/${task.id}`)} className="flex gap-4 items-center p-4 hover:bg-sky-50 rounded-2xl transition-colors cursor-pointer group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  task.dueDate.includes('Hôm nay') ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'
                }`}>
                  {task.dueDate.includes('Hôm nay') ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sky-900 text-base truncate group-hover:text-sky-600 transition-colors">{task.title}</p>
                  <p className="text-sm font-medium text-sky-500 mt-0.5">{task.courseName}</p>
                </div>
                {role === 'student' && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <span className="font-bold text-amber-600">+{task.starsReward}</span>
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                  </div>
                )}
              </div>
            ))}
            {assignments.filter(a => role === 'student' ? a.status === 'published' : a.mySubmission?.status === 'submitted').length === 0 && (
              <div className="p-8 text-center text-sky-500 font-medium">
                Tuyệt vời! Không có nhiệm vụ nào tồn đọng.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
