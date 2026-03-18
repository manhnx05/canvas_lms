import React, { useEffect, useState } from 'react';
import { PenTool, Star, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { Role, Assignment } from '../types';

export function Assignments({ role }: { role: Role }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assignments')
      .then(res => res.json())
      .then(data => {
        setAssignments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch assignments", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
  }

  return (
    <div className="space-y-8">
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
            <button className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-sky-200 whitespace-nowrap">
              + Giao bài mới
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 divide-y-2 divide-sky-50">
          {assignments.map(assignment => (
            <div key={assignment.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-sky-50/50 transition-colors group">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                assignment.status === 'pending' ? 'bg-amber-100 text-amber-500' : 
                assignment.status === 'submitted' ? 'bg-sky-100 text-sky-500' : 'bg-emerald-100 text-emerald-500'
              }`}>
                {assignment.status === 'pending' ? <Clock className="w-8 h-8" /> : 
                 assignment.status === 'submitted' ? <PenTool className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 bg-sky-100 text-sky-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {assignment.courseName}
                  </span>
                  {role === 'student' && (
                    <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      +{assignment.starsReward} <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-sky-900 truncate group-hover:text-sky-600 transition-colors">
                  {assignment.title}
                </h3>
                <p className="text-sky-500 font-medium mt-1">Hạn chót: {assignment.dueDate}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {role === 'student' ? (
                  assignment.status === 'pending' ? (
                    <button className="w-full md:w-auto bg-amber-400 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-amber-200">
                      Làm bài ngay
                    </button>
                  ) : assignment.status === 'submitted' ? (
                    <span className="px-6 py-3 bg-sky-100 text-sky-600 rounded-xl font-bold border-2 border-sky-200">
                      Đang chờ chấm
                    </span>
                  ) : (
                    <span className="px-6 py-3 bg-emerald-100 text-emerald-600 rounded-xl font-bold border-2 border-emerald-200 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Đã hoàn thành
                    </span>
                  )
                ) : (
                  assignment.status === 'submitted' ? (
                    <button className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-rose-200">
                      Chấm bài
                    </button>
                  ) : (
                    <button className="w-full md:w-auto bg-sky-50 hover:bg-sky-100 text-sky-600 px-8 py-3 rounded-xl font-bold transition-colors border-2 border-sky-100">
                      Xem chi tiết
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
