import { Users, GraduationCap, Sparkles } from 'lucide-react';
import { Role } from '@/src/types';

interface MembersTabProps {
  courseTitle: string;
  teacher: string;
  members: any[];
  role: Role;
}

export function MembersTab({ courseTitle, teacher, members }: MembersTabProps) {
  // Sort members so teachers/admins appear first, then students by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'teacher' && b.role !== 'teacher') return -1;
    if (b.role === 'teacher' && a.role !== 'teacher') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" /> Thành Viên Lớp Học
          </h2>
          <p className="text-slate-500 font-medium mt-1">{courseTitle} • {members.length + 1} thành viên</p>
        </div>
      </div>

      {/* Giáo viên */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-sky-800 flex items-center gap-2">
           <GraduationCap className="w-5 h-5 text-sky-500" /> Giáo Viên
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-sky-50 rounded-2xl p-4 flex items-center gap-4 border-2 border-sky-100 shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-indigo-500 text-white rounded-full font-bold flex items-center justify-center text-xl shadow-md border-2 border-white">
              {teacher?.charAt(0) || 'G'}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">{teacher}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="px-2 py-0.5 bg-sky-200 text-sky-800 rounded-md text-xs font-bold uppercase tracking-wide">
                  Chủ nhiệm
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 border-2" />

      {/* Học sinh */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
           <Users className="w-5 h-5 text-slate-400" /> Học Sinh ({members.length})
        </h3>
        
        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 border-2 border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-full font-bold flex items-center justify-center text-lg relative flex-shrink-0">
                  {member.name?.charAt(0) || 'H'}
                  {member.role === 'teacher' && (
                     <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 border-2 border-white">
                        <GraduationCap className="w-3 h-3" />
                     </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{member.name}</p>
                  <p className="text-sm font-medium text-slate-500 truncate">
                     {member.role === 'teacher' ? 'Giáo viên phụ trách' : 'Học sinh'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">Hiện tại chưa có học sinh nào trong lớp.</p>
           </div>
        )}
      </div>
    </div>
  );
}
