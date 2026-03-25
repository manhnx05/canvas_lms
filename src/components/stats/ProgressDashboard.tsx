import { useEffect, useState } from 'react';
import { TrendingUp, BookOpen, Target, Clock, Award, CheckCircle, AlertCircle } from 'lucide-react';

interface CourseProgress {
  courseId: string;
  courseName: string;
  color: string;
  completed: number;
  total: number;
  lastActivity?: string;
}

interface ProgressDashboardProps {
  userId: string;
  role: string;
}

export function ProgressDashboard({ userId, role }: ProgressDashboardProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/assignments?userId=${userId}`).then(r => r.json()),
      fetch(`/api/courses?userId=${userId}`).then(r => r.json())
    ]).then(([aData, cData]) => {
      setAssignments(Array.isArray(aData) ? aData : []);
      setCourses(Array.isArray(cData) ? cData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );

  const total = assignments.length;
  const graded = assignments.filter(a => a.status === 'graded').length;
  const submitted = assignments.filter(a => a.status === 'submitted').length;
  const pending = assignments.filter(a => a.status === 'pending').length;
  const overallPct = total ? Math.round((graded / total) * 100) : 0;

  // Group by course
  const byCourse: Record<string, { name: string; color: string; graded: number; total: number }> = {};
  assignments.forEach(a => {
    if (!byCourse[a.courseId]) {
      const course = courses.find((c: any) => c.id === a.courseId);
      byCourse[a.courseId] = { name: a.courseName || course?.title || '?', color: course?.color || 'bg-sky-400', graded: 0, total: 0 };
    }
    byCourse[a.courseId].total++;
    if (a.status === 'graded') byCourse[a.courseId].graded++;
  });

  const statCards = [
    { icon: Target, label: 'Tổng bài tập', value: total, color: 'bg-indigo-50 text-indigo-500' },
    { icon: CheckCircle, label: 'Đã hoàn thành', value: graded, color: 'bg-emerald-50 text-emerald-500' },
    { icon: Clock, label: 'Chờ chấm', value: submitted, color: 'bg-amber-50 text-amber-500' },
    { icon: AlertCircle, label: 'Chưa làm', value: pending, color: 'bg-rose-50 text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-sky-500" />
        <h2 className="font-extrabold text-slate-800 text-lg">Tiến độ học tập</h2>
      </div>

      {/* Overall ring */}
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-3xl p-6 border border-sky-100 flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0f2fe" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeDasharray={`${overallPct} ${100 - overallPct}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-extrabold text-sky-800">{overallPct}%</p>
            <p className="text-xs text-sky-500 font-semibold">hoàn thành</p>
          </div>
        </div>
        <div>
          <p className="font-extrabold text-slate-800 text-xl">Tổng quan tiến độ</p>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'student' ? 'Bé đã hoàn thành' : 'Học sinh đã hoàn thành'}{' '}
            <strong className="text-sky-700">{graded}/{total}</strong> bài tập
          </p>
          {overallPct >= 80 && <p className="text-emerald-600 font-semibold text-sm mt-1">🌟 Xuất sắc! Tiếp tục cố gắng nhé!</p>}
          {overallPct < 50 && overallPct > 0 && <p className="text-amber-600 font-semibold text-sm mt-1">💪 Cố gắng thêm một chút nhé!</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-course progress bars */}
      {Object.keys(byCourse).length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-sky-500" />
            <h3 className="font-extrabold text-slate-700">Tiến độ theo môn học</h3>
          </div>
          {Object.values(byCourse).map((c, i) => {
            const pct = c.total ? Math.round((c.graded / c.total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full inline-block ${c.color}`} />
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-500">{c.graded}/{c.total} · {pct}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Award if perfect */}
      {overallPct === 100 && total > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 text-white flex items-center gap-4 shadow-lg shadow-amber-200">
          <Award className="w-10 h-10" />
          <div>
            <p className="font-extrabold text-lg">🎉 Hoàn thành 100%!</p>
            <p className="text-amber-100 text-sm">Bé thật xuất sắc! Cô rất tự hào về bé!</p>
          </div>
        </div>
      )}
    </div>
  );
}
