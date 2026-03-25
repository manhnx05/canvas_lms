import { Trophy } from 'lucide-react';

interface Props {
  assignments: any[];
}

export function GradesTab({ assignments }: Props) {
  const graded = assignments?.filter((a: any) => a.status === 'graded').length ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-sky-900">Bảng Điểm Lớp</h2>
      <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-8 text-center">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Theo Dõi Kết Quả Học Tập</h3>
        <p className="text-slate-500 mt-2">
          Tổng số bài tập đã chấm:{' '}
          <strong className="text-sky-600 border border-sky-100 bg-white px-2 py-0.5 rounded-md">{graded}</strong>
        </p>
        <div className="mt-8">
          <table className="w-full text-left bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-slate-100">
            <thead className="bg-sky-50 text-sky-900 border-b-2 border-slate-100">
              <tr>
                <th className="px-5 py-4 font-bold uppercase text-xs tracking-wider">Bài Tập</th>
                <th className="px-5 py-4 font-bold uppercase text-xs tracking-wider">Trạng Thái</th>
                <th className="px-5 py-4 font-bold uppercase text-xs tracking-wider text-right">Điểm Sáng</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {assignments?.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-800">{a.title}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                      a.status === 'graded' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : a.status === 'submitted' ? 'bg-sky-100 text-sky-700 border border-sky-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {a.status === 'graded' ? 'Đã chấm' : a.status === 'submitted' ? 'Đã Nộp' : 'Chưa Nộp'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-extrabold text-amber-500 text-right text-lg">
                    {a.status === 'graded' ? `+${a.starsReward}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
