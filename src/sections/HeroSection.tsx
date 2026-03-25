import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, TrendingUp, Star, ArrowRight, Play } from 'lucide-react';

interface HeroSectionProps {
  role: string;
  userName?: string;
}

export function HeroSection({ role, userName }: HeroSectionProps) {
  const navigate = useNavigate();
  const isStudent = role === 'student';

  const studentFeatures = [
    { icon: Brain, text: 'Làm quiz AI', path: '/evaluation' },
    { icon: TrendingUp, text: 'Xem tiến độ', path: '/evaluation?tab=progress' },
    { icon: Star, text: 'Nhận huy hiệu', path: '/rewards' },
  ];
  const teacherFeatures = [
    { icon: Brain, text: 'Tạo quiz AI', path: '/evaluation?tab=quiz' },
    { icon: TrendingUp, text: 'Thống kê lớp', path: '/students' },
    { icon: BookOpen, text: 'Quản lý lớp', path: '/courses' },
  ];
  const features = isStudent ? studentFeatures : teacherFeatures;

  return (
    <div className={`rounded-3xl overflow-hidden relative ${isStudent
      ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600'
      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
    } shadow-xl`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="flex-1">
          <div className="bg-white/20 w-fit px-3 py-1 rounded-full text-white text-xs font-bold mb-4 backdrop-blur-sm">
            {isStudent ? '🎒 Học sinh tiểu học' : '👩‍🏫 Giáo viên'}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
            {isStudent
              ? <>Xin chào, <span className="text-yellow-200">{userName || 'bạn nhỏ'}</span>! 🌟</>
              : <>Chào mừng trở lại, <span className="text-yellow-100">{userName || 'Thầy/Cô'}</span>! 👋</>
            }
          </h1>
          <p className="text-white/85 text-base md:text-lg leading-relaxed mb-6">
            {isStudent
              ? 'Hôm nay bé có sẵn sàng khám phá kiến thức mới và chinh phục thử thách chưa? 🚀'
              : 'Hệ thống AI sẵn sàng giúp bạn tạo quiz, chấm bài tự động và theo dõi tiến độ học sinh.'
            }
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/evaluation')}
              className="flex items-center gap-2 bg-white text-sky-600 font-extrabold px-5 py-2.5 rounded-2xl hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              <Play className="w-4 h-4 fill-sky-600" />
              {isStudent ? 'Bắt đầu học' : 'Vào hệ thống đánh giá'}
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-5 py-2.5 rounded-2xl border border-white/30 transition-all"
            >
              {isStudent ? 'Xem môn học' : 'Xem lớp học'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex md:flex-col gap-3 w-full md:w-auto">
          {features.map(({ icon: Icon, text, path }) => (
            <button
              key={text}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white font-semibold px-4 py-3 rounded-2xl transition-all hover:-translate-y-0.5 min-w-[140px]"
            >
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm">{text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
