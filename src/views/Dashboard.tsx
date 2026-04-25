import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Star, Trophy, Users, FileText, TrendingUp } from 'lucide-react';
import { Role } from '@/src/types';
import { useDashboardData } from '../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MemoizedStatsCard } from '../components/optimized/MemoizedStatsCard';
import { MemoizedCourseCard } from '../components/optimized/MemoizedCourseCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981', '#f43f5e'];

export const Dashboard = React.memo(function Dashboard({ role }: { role: Role }) {
  const { courses, assignments, stats, loading } = useDashboardData(role);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  const handleCourseClick = React.useCallback((courseId: string) => {
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${role === 'student' ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            {role === 'student' ? 'Chào bé An! 🌟' : 'Chào cô Nguyễn Thị Ngọc Điệp! 👩‍🏫'}
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
          <MemoizedStatsCard
            icon={Star}
            title="Điểm Thưởng"
            value={user.stars || 0}
            subtitle="Sao"
            bgColor="bg-amber-100"
            iconColor="text-amber-500"
          />
          <MemoizedStatsCard
            icon={Trophy}
            title="Huy Hiệu"
            value={5}
            subtitle="Cái"
            bgColor="bg-rose-100"
            iconColor="text-rose-500"
          />
          <MemoizedStatsCard
            icon={CheckCircle}
            title="Hoàn Thành"
            value={assignments.length > 0 ? Math.round((assignments.filter(a => a.mySubmission?.status === 'graded').length / assignments.length) * 100) : 0}
            subtitle="%"
            bgColor="bg-emerald-100"
            iconColor="text-emerald-500"
          />
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

      {/* Professional Stats Chart - Teacher Only */}
      {role === 'teacher' && stats?.activityTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-indigo-50 shadow-sm flex flex-col h-[350px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Hiệu Suất Học Tập Sự Trong Tuần</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Số lượt tương tác hoàn thành bài tập</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                <TrendingUp className="w-5 h-5" /> +{stats.completionRate}%
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activityTrend.map((v: number, i: number) => ({ name: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i], value: v }))}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-50 shadow-sm flex flex-col h-[350px]">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Phân Bổ Học Sinh Theo Lớp</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Tỷ lệ học sinh trên toàn hệ thống ({stats.totalStudents} em)</p>
            </div>
            <div className="flex-1 w-full min-h-0 flex items-center justify-center -mt-4">
              {stats.studentsByClass && stats.studentsByClass.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.studentsByClass} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {stats.studentsByClass.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 font-medium">Chưa có dữ liệu học sinh</div>
              )}
            </div>
            {stats.studentsByClass && (
              <div className="flex justify-center gap-4 flex-wrap mt-2">
                {stats.studentsByClass.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            )}
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
              <MemoizedCourseCard
                key={course.id}
                course={course}
                role={role}
                onClick={handleCourseClick}
              />
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
});
