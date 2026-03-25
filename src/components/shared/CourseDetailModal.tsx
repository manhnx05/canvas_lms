import { X, BookOpen, Users, TrendingUp, Clock, Star } from 'lucide-react';

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any | null;
  role: string;
  onNavigate?: (courseId: string) => void;
}

export function CourseDetailModal({ isOpen, onClose, course, role, onNavigate }: CourseDetailModalProps) {
  if (!isOpen || !course) return null;

  const colorMap: Record<string, string> = {
    'bg-sky-400': '#38bdf8',
    'bg-emerald-400': '#34d399',
    'bg-amber-400': '#fbbf24',
    'bg-rose-400': '#f87171',
    'bg-indigo-400': '#818cf8',
    'bg-purple-400': '#c084fc',
  };
  const accent = colorMap[course.color] || '#38bdf8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="h-32 relative flex items-end p-5" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
          <div className="absolute inset-0 overflow-hidden">
            <BookOpen className="absolute right-[-15px] bottom-[-15px] w-36 h-36 text-white opacity-10" />
          </div>
          <div className="relative z-10">
            <div className="bg-white/20 w-fit px-3 py-1 rounded-lg mb-2">
              <span className="text-white text-xs font-bold">{course.studentsCount || 0} Học sinh</span>
            </div>
            <h2 className="text-white font-extrabold text-2xl">{course.title}</h2>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/30 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4 text-sky-500" />
            <span className="text-sm font-semibold">Giáo viên: <span className="text-slate-800">{course.teacher}</span></span>
          </div>

          {course.description && (
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4">{course.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-50 rounded-2xl p-3 text-center">
              <TrendingUp className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <p className="text-xs text-sky-600 font-semibold">Tiến độ</p>
              <p className="text-lg font-extrabold text-sky-800">{course.progress || 0}%</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-amber-600 font-semibold">Module</p>
              <p className="text-lg font-extrabold text-amber-800">{course.modules?.length || 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-emerald-600 font-semibold">Bài tập</p>
              <p className="text-lg font-extrabold text-emerald-800">{course.assignments?.length || 0}</p>
            </div>
          </div>

          {role === 'student' && course.progress !== undefined && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Tiến độ hoàn thành</span>
                <span>{course.progress}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${course.progress}%`, background: accent }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors">
              Đóng
            </button>
            {onNavigate && (
              <button
                onClick={() => { onNavigate(course.id); onClose(); }}
                className="flex-1 py-2.5 text-white font-bold rounded-2xl transition-colors shadow-sm"
                style={{ background: accent }}
              >
                Vào lớp học →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
