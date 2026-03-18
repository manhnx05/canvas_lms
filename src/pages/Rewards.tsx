import React, { useEffect, useState } from 'react';
import { Trophy, Star, Award, Gift, ChevronRight } from 'lucide-react';
import { Role, Reward } from '../types';

export function Rewards({ role }: { role: Role }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rewards')
      .then(res => res.json())
      .then(data => {
        setRewards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch rewards", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-sky-900">{role === 'student' ? 'Góc Khen Thưởng' : 'Quản Lý Thưởng'}</h1>
        
        {role === 'student' && (
          <div className="flex items-center gap-4 bg-amber-100 px-6 py-3 rounded-2xl border-2 border-amber-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Star className="w-8 h-8 text-amber-500 fill-current" />
              <span className="text-2xl font-extrabold text-amber-600">120</span>
            </div>
            <div className="w-px h-8 bg-amber-300"></div>
            <button className="text-amber-600 font-bold hover:text-amber-700 flex items-center gap-1">
              Đổi quà <Gift className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {role === 'student' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Badges Section */}
          <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-sky-900 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" /> Huy Hiệu Của Bé
              </h2>
              <span className="text-sky-500 font-bold">{rewards.length} Huy hiệu</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {rewards.map(reward => (
                <div key={reward.id} className="flex flex-col items-center text-center group cursor-pointer">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-md ${reward.color}`}>
                    {reward.icon === 'Star' ? <Star className="w-12 h-12 fill-current" /> : 
                     reward.icon === 'Palette' ? <Award className="w-12 h-12" /> : <Trophy className="w-12 h-12" />}
                  </div>
                  <h3 className="font-extrabold text-sky-900 mb-1">{reward.title}</h3>
                  <p className="text-xs font-medium text-sky-500 line-clamp-2">{reward.description}</p>
                </div>
              ))}
              
              {/* Locked Badge Placeholder */}
              <div className="flex flex-col items-center text-center opacity-50 grayscale">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-200 border-dashed flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                </div>
                <h3 className="font-extrabold text-slate-500 mb-1">Bí ẩn</h3>
                <p className="text-xs font-medium text-slate-400">Chưa mở khóa</p>
              </div>
            </div>
          </div>

          {/* Leaderboard / Recent Activity */}
          <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm p-8">
            <h2 className="text-2xl font-extrabold text-sky-900 mb-8 flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-500 fill-current" /> Lịch Sử Nhận Sao
            </h2>
            
            <div className="space-y-6">
              {[
                { task: 'Hoàn thành bài tập Toán', stars: 5, date: 'Hôm nay' },
                { task: 'Đọc to rõ ràng bài Tiếng Việt', stars: 10, date: 'Hôm qua' },
                { task: 'Vẽ tranh đẹp', stars: 15, date: '15/03/2026' },
                { task: 'Giúp đỡ bạn bè', stars: 5, date: '14/03/2026' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                  <div>
                    <p className="font-bold text-sky-900">{item.task}</p>
                    <p className="text-sm font-medium text-sky-500 mt-1">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border-2 border-amber-100 shadow-sm">
                    <span className="font-extrabold text-amber-500 text-lg">+{item.stars}</span>
                    <Star className="w-5 h-5 text-amber-500 fill-current" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm p-8 text-center">
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h2 className="text-2xl font-extrabold text-sky-900 mb-4">Quản Lý Điểm Thưởng & Huy Hiệu</h2>
          <p className="text-sky-600 font-medium max-w-md mx-auto mb-8">
            Tại đây cô có thể tạo các huy hiệu mới, tặng sao cho học sinh có thành tích xuất sắc, và quản lý cửa hàng đổi quà.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-amber-400 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-amber-200">
              Tặng Sao Nhanh
            </button>
            <button className="bg-sky-50 hover:bg-sky-100 text-sky-600 px-8 py-3 rounded-xl font-bold transition-colors border-2 border-sky-100">
              Tạo Huy Hiệu Mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
