import { useEffect, useState } from 'react';
import { Star, Trophy, Target, Award, CheckCircle } from 'lucide-react';
import apiClient from '@/src/lib/apiClient';

export function Rewards() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  useEffect(() => {
    apiClient.get('/rewards')
      .then(res => res.data)
      .then(data => { setRewards(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Góc Khen Thưởng 🏆</h1>
            <p className="text-lg opacity-90 font-medium">Bé đã siêu cố gắng! Xem các thành tích đạt được nào!</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4 shrink-0 border border-white/30">
            <div className="w-14 h-14 bg-amber-200 rounded-xl flex items-center justify-center rotate-3 shadow-inner">
              <Star className="w-8 h-8 text-amber-600 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-100 uppercase tracking-wider">Tổng Sao</p>
              <p className="text-3xl font-extrabold drop-shadow-md">{user.stars || 0}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-sky-900 mb-6 flex items-center gap-2">
          <Award className="text-sky-500" /> Huy Hiệu Đã Đạt Được
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map(reward => (
            <div key={reward.id} className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-50 p-1 rounded-full">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${reward.color || 'text-amber-500 bg-amber-100'} group-hover:scale-110 transition-transform`}>
                <Trophy className="w-10 h-10" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-800 mb-2">{reward.title}</h3>
              <p className="text-slate-500 font-medium text-sm mb-4">{reward.description}</p>
              <div className="mt-auto bg-slate-50 w-full py-2 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                Đạt được: {reward.dateEarned || 'Vừa xong'}
              </div>
            </div>
          ))}

          {/* Locked Badge Demo */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 border-dashed p-6 flex flex-col items-center text-center relative opacity-70">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 bg-slate-200 text-slate-400">
              <Target className="w-10 h-10" />
            </div>
            <h3 className="font-extrabold text-xl text-slate-500 mb-2">Thần Đồng Ngôn Ngữ</h3>
            <p className="text-slate-400 font-medium text-sm mb-4">Hoàn thành 10 bài tập Tiếng Anh với điểm tuyệt đối.</p>
            <div className="mt-auto bg-slate-200/50 w-full py-2 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              Chưa mở khóa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
