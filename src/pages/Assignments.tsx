import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, Star, Clock, CheckCircle, AlertCircle, Search, Filter, X } from 'lucide-react';
import { Role, Assignment, Course } from '../types';
import apiClient from '../lib/apiClient';

export function Assignments({ role }: { role: Role }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [starsReward, setStarsReward] = useState('5');
  const [type, setType] = useState('quiz');

  const fetchData = async () => {
    try {
      const [assnRes, coursesRes] = await Promise.all([
        apiClient.get('/assignments'),
        apiClient.get('/courses')
      ]);
      const assnData = assnRes.data;
      const coursesData = coursesRes.data;
      setAssignments(assnData);
      setCourses(coursesData);
      if (coursesData.length > 0) setCourseId(coursesData[0].id);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    try {
      const res = await apiClient.post('/assignments', {
        title, description, courseId, courseName: course.title, dueDate, starsReward, type
      });
      if (res.data) {
        setIsCreating(false);
        setTitle(''); setDescription(''); setDueDate(''); setStarsReward('5'); setType('quiz');
        fetchData();
      }
    } catch (err) {
      console.error(err);
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
          {assignments.map(assignment => (
            <div key={assignment.id} onClick={() => navigate(`/assignments/${assignment.id}`)} className="cursor-pointer p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-sky-50/50 transition-colors group">
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
                    <div className="w-full md:w-auto bg-amber-400 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-amber-200 text-center">
                      Làm bài ngay
                    </div>
                  ) : assignment.status === 'submitted' ? (
                    <span className="px-6 py-3 bg-sky-100 text-sky-600 rounded-xl font-bold border-2 border-sky-200 text-center">
                      Đang chờ chấm
                    </span>
                  ) : (
                    <span className="px-6 py-3 bg-emerald-100 text-emerald-600 rounded-xl font-bold border-2 border-emerald-200 flex items-center gap-2 justify-center">
                      <CheckCircle className="w-5 h-5" /> Đã hoàn thành
                    </span>
                  )
                ) : (
                  assignment.status === 'submitted' ? (
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold text-sky-900 mb-6">Giao Bài Tập Mới</h2>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Môn học</label>
                <select required value={courseId} onChange={e=>setCourseId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề bài tập</label>
                <input required value={title} onChange={e=>setTitle(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium" placeholder="VD: Luyện viết chữ đẹp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hạn nộp</label>
                  <input required value={dueDate} onChange={e=>setDueDate(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium" placeholder="Ngày mai" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phần thưởng (Sao)</label>
                  <input required value={starsReward} onChange={e=>setStarsReward(e.target.value)} type="number" min="0" className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-amber-500 font-medium" placeholder="5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Dạng bài</label>
                <select required value={type} onChange={e=>setType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium">
                  <option value="quiz">Trắc nghiệm nhanh</option>
                  <option value="writing">Viết / Luận</option>
                  <option value="reading">Đọc to / Phát âm</option>
                  <option value="drawing">Vẽ / Sáng tạo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả bài tập</label>
                <textarea required value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium whitespace-pre-wrap" placeholder="Yêu cầu học sinh làm gì..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2.5 font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/30">Lưu Bài Tập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
