import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Trophy, Calendar, Star } from 'lucide-react';

interface ScoreEntry {
  id: string;
  title: string;
  courseName: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  status: string;
}

interface ScoringStatisticsProps {
  userId: string;
}

export function ScoringStatistics({ userId }: ScoringStatisticsProps) {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'graded' | 'submitted'>('all');

  useEffect(() => {
    fetch(`/api/assignments?userId=${userId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: ScoreEntry[] = data
          .filter(a => a.mySubmission || a.status === 'graded')
          .map(a => ({
            id: a.id,
            title: a.title,
            courseName: a.courseName || '—',
            score: a.mySubmission?.score ?? a.starsReward ?? 0,
            maxScore: a.starsReward || 10,
            percentage: a.starsReward ? Math.round(((a.mySubmission?.score ?? a.starsReward) / a.starsReward) * 100) : 0,
            date: a.dueDate || '—',
            status: a.status
          }));
        setEntries(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );

  const filtered = entries.filter(e => filter === 'all' ? true : e.status === filter);
  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, e) => s + e.percentage, 0) / filtered.length)
    : 0;
  const best = filtered.reduce((max, e) => e.percentage > max ? e.percentage : max, 0);
  const perfect = filtered.filter(e => e.percentage >= 90).length;

  // Bar chart data (last 7 entries)
  const chartData = [...filtered].slice(-7);
  const maxPct = Math.max(...chartData.map(e => e.percentage), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-sky-500" />
          <h2 className="font-extrabold text-slate-800 text-lg">Thống kê điểm số</h2>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'graded', 'submitted'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'graded' ? 'Đã chấm' : 'Đã nộp'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 text-center">
          <TrendingUp className="w-5 h-5 text-sky-500 mx-auto mb-1.5" />
          <p className="text-2xl font-extrabold text-sky-800">{avgScore}%</p>
          <p className="text-xs font-semibold text-sky-500 mt-0.5">Điểm TB</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
          <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
          <p className="text-2xl font-extrabold text-amber-800">{best}%</p>
          <p className="text-xs font-semibold text-amber-500 mt-0.5">Điểm cao nhất</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
          <Star className="w-5 h-5 text-emerald-500 mx-auto mb-1.5 fill-emerald-400" />
          <p className="text-2xl font-extrabold text-emerald-800">{perfect}</p>
          <p className="text-xs font-semibold text-emerald-500 mt-0.5">Xuất sắc (≥90%)</p>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-700 text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />Biểu đồ điểm (7 bài gần nhất)
          </h3>
          <div className="flex items-end gap-2 h-32">
            {chartData.map((e, i) => {
              const pct = e.percentage;
              const barColor = pct >= 90 ? '#10b981' : pct >= 70 ? '#0ea5e9' : pct >= 50 ? '#f59e0b' : '#f43f5e';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: barColor }}>{pct}%</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 relative group cursor-pointer"
                    style={{ height: `${(pct / maxPct) * 100}%`, minHeight: '4px', backgroundColor: barColor + '33', borderBottom: `3px solid ${barColor}` }}
                  >
                    <div
                      className="absolute inset-0 rounded-t-lg opacity-80"
                      style={{ backgroundColor: barColor, opacity: 0.7 }}
                    />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-24 bg-slate-800 text-white text-[10px] rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center pointer-events-none">
                      {e.title}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate w-full text-center">{e.title.slice(0, 8)}</p>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-semibold">
            {[['#10b981', '≥90% Xuất sắc'], ['#0ea5e9', '≥70% Tốt'], ['#f59e0b', '≥50% Khá'], ['#f43f5e', '<50% Yếu']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          <h3 className="font-extrabold text-slate-700 text-sm">Lịch sử làm bài</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                  e.percentage >= 90 ? 'bg-emerald-100 text-emerald-600' :
                  e.percentage >= 70 ? 'bg-sky-100 text-sky-600' :
                  e.percentage >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {e.percentage}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm truncate">{e.title}</p>
                  <p className="text-xs text-slate-400">{e.courseName} · {e.date}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-amber-600">{e.score}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                  e.status === 'graded' ? 'bg-emerald-100 text-emerald-600' :
                  e.status === 'submitted' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {e.status === 'graded' ? 'Đã chấm' : e.status === 'submitted' ? 'Đã nộp' : 'Chưa làm'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
