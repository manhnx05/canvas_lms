import { Trophy } from 'lucide-react';

import { Role } from '@/src/types';

interface Props {
  assignments: any[];
  role: Role;
}

export function GradesTab({ assignments, role }: Props) {
  // If teacher, show how many assignments are graded overall. If student, show how many of their submissions are graded.
  const graded = role === 'teacher' 
    ? (assignments?.filter((a: any) => a.status === 'graded').length ?? 0)
    : (assignments?.filter((a: any) => a.mySubmission?.status === 'graded').length ?? 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-sky-900">{role === 'teacher' ? 'Bảng Điểm Lớp' : 'Thống Kê Điểm Số'}</h2>
      <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-8 text-center">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">{role === 'teacher' ? 'Tiến Độ Chấm Bài' : 'Theo Dõi Kết Quả Học Tập'}</h3>
        <p className="text-slate-500 mt-2">
          {role === 'teacher' ? 'Tổng số bài tập đã hoàn tất chấm:' : 'Tổng số bài tập con đã làm:'}
          <strong className="text-sky-600 border border-sky-100 bg-white px-2 py-0.5 rounded-md ml-2">{graded}</strong>
        </p>
        <div className="mt-8">
          <table className="w-full text-left bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-slate-100">
            <thead className="bg-sky-50 text-sky-900 border-b-2 border-slate-100">
              <tr>
                <th className="px-5 py-4 font-bold uppercase text-xs tracking-wider">Bài Tập</th>
                <th className="px-5 py-4 font-bold uppercase text-xs tracking-wider">Trạng Thái</th>
                <th className="px-5 py-4 font-bold uppercase text-xs tracking-wider text-right">Điểm Số Cá Nhân</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {assignments?.map((a: any) => {
                 const status = role === 'teacher' ? a.status : (a.mySubmission?.status || 'pending');
                 const score = role === 'teacher' ? a.starsReward : a.mySubmission?.score;
                 
                 return (
                   <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-5 py-4 font-bold text-slate-800">{a.title}</td>
                     <td className="px-5 py-4">
                       <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                         status === 'graded' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                         : status === 'submitted' ? 'bg-sky-100 text-sky-700 border border-sky-200'
                         : 'bg-amber-100 text-amber-700 border border-amber-200'
                       }`}>
                         {status === 'graded' ? 'Đã chấm' : status === 'submitted' ? 'Đã Nộp' : 'Chưa Nộp'}
                       </span>
                     </td>
                     <td className="px-5 py-4 font-extrabold text-amber-500 text-right text-lg">
                       {status === 'graded' ? `+${score ?? a.starsReward} Khế` : '-'}
                     </td>
                   </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
