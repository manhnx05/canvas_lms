import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, Star, Clock, CheckCircle, Search, Filter, FileText } from 'lucide-react';
import { Role } from '@/src/types';
import { useAssignments } from '../hooks/useAssignments';
import { CreateAssignmentModal } from '../features/assignments/CreateAssignmentModal';

export function Assignments({ role }: { role: Role }) {
  const { assignments, courses, loading, createAssignment } = useAssignments();
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateAssignment = async (data: any) => {
    const success = await createAssignment(data);
    if (success) {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-sky-900">{role === 'student' ? 'Nhiệm Vụ Của Bé' : 'Quản Lý Bài Tập'}</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
            <input 
              type="text" 
              placeholder="Tìm bài tập..." 
              className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-sky-100 rounded-2xl focus:border-sky-300 focus:ring-4 focus:ring-sky-50 transition-all outline-none font-medium text-sky-900 placeholder-sky-400"
            />
          </div>
          <button className="p-2.5 bg-white border-2 border-sky-100 rounded-xl text-sky-500 hover:bg-sky-50 transition-colors">
            <Filter className="w-6 h-6" />
          </button>
          {role === 'teacher' && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-sky-200 whitespace-nowrap"
            >
              + Giao bài mới
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 divide-y-2 divide-sky-50">
          {assignments.map((assignment: any) => (
            <div key={assignment.id} onClick={() => {
              if (assignment.itemType === 'exam') {
                 navigate(role === 'student' ? `/exams/${assignment.id}/take` : `/exams/${assignment.id}`);
              } else {
                 navigate(`/assignments/${assignment.id}`);
              }
            }} className="cursor-pointer p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-sky-50/50 transition-colors group">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                assignment.status === 'pending' ? 'bg-amber-100 text-amber-500' : 
                assignment.mySubmission?.status === 'submitted' ? 'bg-sky-100 text-sky-500' : 'bg-emerald-100 text-emerald-500'
              }`}>
                {assignment.itemType === 'exam' ? <FileText className="w-8 h-8" /> : assignment.status === 'pending' ? <Clock className="w-8 h-8" /> : 
                 assignment.mySubmission?.status === 'submitted' ? <PenTool className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 bg-sky-100 text-sky-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {assignment.courseName}
                  </span>
                  {assignment.itemType === 'exam' && (
                    <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-rose-200">
                      ĐỀ THI
                    </span>
                  )}
                  {role === 'student' && assignment.itemType !== 'exam' && (
                    <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      +{assignment.starsReward} <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-sky-900 truncate group-hover:text-sky-600 transition-colors">
                  {assignment.title}
                </h3>
                <p className="text-sky-500 font-medium mt-1">Hạn chót: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không giới hạn'}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {role === 'student' ? (
                  assignment.status === 'pending' ? (
                    <div className="w-full md:w-auto bg-amber-400 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-amber-200 text-center">
                      Làm bài ngay
                    </div>
                  ) : assignment.mySubmission?.status === 'submitted' ? (
                    <span className="px-6 py-3 bg-sky-100 text-sky-600 rounded-xl font-bold border-2 border-sky-200 text-center">
                      Đang chờ chấm
                    </span>
                  ) : (
                    <span className="px-6 py-3 bg-emerald-100 text-emerald-600 rounded-xl font-bold border-2 border-emerald-200 flex items-center gap-2 justify-center">
                      <CheckCircle className="w-5 h-5" /> Đã hoàn thành
                    </span>
                  )
                ) : (
                  assignment.mySubmission?.status === 'submitted' ? (
                    <div className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-rose-200 text-center">
                      Chấm bài
                    </div>
                  ) : (
                    <div className="w-full md:w-auto bg-sky-50 hover:bg-sky-100 text-sky-600 px-8 py-3 rounded-xl font-bold transition-colors border-2 border-sky-100 text-center">
                      Xem chi tiết
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCreating && (
        <CreateAssignmentModal
          courses={courses}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreateAssignment}
        />
      )}
    </div>
  );
}
