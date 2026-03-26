import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, X, Edit, Trash2 } from 'lucide-react';
import { Role, Course } from '@/src/types';
import apiClient from '@/src/lib/apiClient';

export function Courses({ role }: { role: Role }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-blue-500');
  const navigate = useNavigate();

  const fetchCourses = () => {
    apiClient.get('/courses')
      .then(res => res.data)
      .then(data => { setCourses(data); setLoading(false); })
      .catch(err => { console.error("Failed to fetch courses", err); setLoading(false); });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setColor('bg-blue-500');
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description || '');
    setColor(course.color);
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setModalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      if (editingCourse) {
        // Update existing course
        await apiClient.put(`/courses/${editingCourse.id}`, {
          title, description, color, icon: 'BookOpen'
        });
      } else {
        // Create new course
        await apiClient.post('/courses', {
          title, description, color, icon: 'BookOpen'
        });
      }
      closeModal();
      fetchCourses();
    } catch (err: any) {
      setModalError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp học "${course.title}"?\n\nToàn bộ dữ liệu liên quan (bài tập, thông báo, học sinh) sẽ bị xóa!`)) {
      return;
    }

    try {
      await apiClient.delete(`/courses/${course.id}`);
      fetchCourses();
    } catch (err: any) {
      alert('Lỗi khi xóa lớp học: ' + (err?.message || 'Vui lòng thử lại'));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-sky-900">{role === 'student' ? 'Môn Học Của Bé' : 'Quản Lý Lớp Học'}</h1>
        {role === 'teacher' && (
          <button 
            onClick={openCreateModal}
            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-sky-200"
          >
            + Tạo lớp mới
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer group flex flex-col h-full">
            <div className={`h-36 ${course.color} p-6 flex flex-col justify-between relative overflow-hidden shrink-0`}>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="w-40 h-40 text-white" />
              </div>
              <div className="bg-white/20 w-fit px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">{course.studentsCount} Học sinh</span>
              </div>
              <h3 className="text-white font-extrabold text-2xl leading-tight z-10">{course.title}</h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                    {course.teacher.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-sky-500 font-semibold uppercase">Giáo viên</p>
                    <p className="font-bold text-sky-900">{course.teacher}</p>
                  </div>
                </div>
              </div>

              {role === 'student' ? (
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-sky-600">Tiến độ học tập</span>
                    <span className="text-lg font-extrabold text-sky-500">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-sky-100 rounded-full h-3">
                    <div className="bg-sky-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={(e) => openEditModal(course, e)}
                    className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-600 text-center font-bold py-2.5 rounded-xl transition-colors border-2 border-sky-100 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={(e) => handleDelete(course, e)}
                    className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl transition-colors border-2 border-rose-100 flex items-center justify-center"
                    title="Xóa lớp học"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold text-sky-900 mb-6">
              {editingCourse ? 'Chỉnh Sửa Lớp Học' : 'Tạo Lớp Học Mới'}
            </h2>
            {modalError && (
              <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                ⚠️ {modalError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên môn học</label>
                <input required value={title} onChange={e=>setTitle(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium" placeholder="VD: Lập trình Cơ bản" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả tóm tắt</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium whitespace-pre-wrap" placeholder="Giới thiệu về môn học..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Màu chủ đạo</label>
                <div className="flex gap-3">
                  {['bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-purple-500'].map(c => (
                    <button type="button" key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-4 ring-offset-2 ring-sky-300' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2.5 font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/30">
                  {editingCourse ? 'Cập Nhật' : 'Tạo Lớp Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
