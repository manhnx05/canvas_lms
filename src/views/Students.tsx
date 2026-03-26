import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit, Trash2, Search, Mail, BookOpen, X, ShieldAlert, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { Role } from '@/src/types';
import apiClient from '@/src/lib/apiClient';

// Danh sách lớp học từ 1A đến 5B
const CLASS_OPTIONS = [
  'Lớp 1A', 'Lớp 1B',
  'Lớp 2A', 'Lớp 2B',
  'Lớp 3A', 'Lớp 3B',
  'Lớp 4A', 'Lớp 4B',
  'Lớp 5A', 'Lớp 5B',
];

export function Students({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(''); // Filter by class
  const [exporting, setExporting] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('Lớp 1A');
  const [avatar, setAvatar] = useState('');
  const [formError, setFormError] = useState('');

  const fetchStudents = () => {
    setLoading(true);
    apiClient.get('/users?role=student')
      .then(res => res.data)
      .then(data => {
        setStudents(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const resetForm = () => {
    setName(''); setEmail(''); setClassName('Lớp 1A'); setAvatar(''); setEditId(null); setShowForm(false); setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editId) {
        await apiClient.put(`/users/${editId}`, { name, email, className, avatar });
      } else {
        await apiClient.post('/users', { name, email, className, avatar, role: 'student' });
      }
      resetForm();
      fetchStudents();
    } catch (err: any) {
      setFormError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleEditClick = (student: any) => {
    setEditId(student.id);
    setName(student.name);
    setEmail(student.email);
    setClassName(student.className || 'Lớp 1A');
    setAvatar(student.avatar || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này không?\nToàn bộ dữ liệu liên quan sẽ bị xóa!')) return;
    await apiClient.delete(`/users/${id}`);
    fetchStudents();
  };

  const exportToExcel = () => {
    setExporting(true);
    
    try {
      // Prepare data for export
      const exportData = filteredStudents.map((student, index) => ({
        'STT': index + 1,
        'Họ và Tên': student.name,
        'Email': student.email,
        'Lớp': student.className || 'Chưa xếp lớp',
        'Ngày tạo': student.createdAt ? new Date(student.createdAt).toLocaleDateString('vi-VN') : 'N/A'
      }));

      // Create CSV content
      const headers = ['STT', 'Họ và Tên', 'Email', 'Lớp', 'Ngày tạo'];
      const csvContent = [
        '\uFEFF' + headers.join(','), // Add BOM for UTF-8
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Danh_sach_hoc_sinh_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => setExporting(false), 500);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi khi export file. Vui lòng thử lại.');
      setExporting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.className && s.className.toLowerCase().includes(search.toLowerCase()));
    
    const matchesClass = !classFilter || s.className === classFilter;
    
    return matchesSearch && matchesClass;
  });

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 mx-auto border-4 border-sky-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-sky-500" /> {role === 'teacher' ? 'Quản Lý Học Sinh' : 'Thành Viên Lớp Học'}
          </h1>
          <p className="text-sky-600 mt-2 font-medium">
            Danh sách các bạn học sinh trong hệ thống ({filteredStudents.length} học sinh)
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-white border-2 border-sky-100 rounded-2xl focus:border-sky-300 outline-none transition-colors shadow-sm"
            />
          </div>
          
          {/* Class Filter Dropdown */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-sky-100 rounded-2xl focus:border-sky-300 outline-none transition-colors shadow-sm font-medium text-slate-700 cursor-pointer"
          >
            <option value="">Tất cả lớp</option>
            {CLASS_OPTIONS.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          
          {role === 'teacher' && (
            <>
              <button 
                onClick={exportToExcel}
                disabled={exporting || filteredStudents.length === 0}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-sm shadow-emerald-200 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Export danh sách ra Excel"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5" /> Export Excel
                  </>
                )}
              </button>
              <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-sm shadow-sky-200 flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" /> Thêm
              </button>
            </>
          )}
        </div>
      </div>

      {role === 'teacher' ? (
        <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-sky-50 border-b-2 border-sky-100">
                <tr>
                  <th className="px-6 py-4 text-sky-900 font-extrabold text-sm uppercase">STT</th>
                  <th className="px-6 py-4 text-sky-900 font-extrabold text-sm uppercase">Học Sinh</th>
                  <th className="px-6 py-4 text-sky-900 font-extrabold text-sm uppercase">Tài khoản Email</th>
                  <th className="px-6 py-4 text-sky-900 font-extrabold text-sm uppercase">Lớp học</th>
                  <th className="px-6 py-4 text-sky-900 font-extrabold text-sm uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-sky-50">
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Không tìm thấy học sinh nào.</td></tr>
                )}
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-sky-50/50 transition-colors group">
                    <td className="px-6 py-4 text-slate-600 font-semibold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                          {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-sky-600">{student.name.charAt(0)}</span>}
                        </div>
                        <span className="font-bold text-slate-800 text-base">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-sky-400" /> {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-500">
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                        <BookOpen className="w-4 h-4" /> {student.className || 'Chưa xếp lớp'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/inbox?compose=1&to=${student.id}&name=${encodeURIComponent(student.name)}`)}
                          className="p-2 bg-white hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-200 transition-colors shadow-sm"
                          title="Nhắn tin"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="p-2 bg-white hover:bg-sky-100 text-sky-600 rounded-xl border border-sky-200 transition-colors shadow-sm"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-2 bg-white hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-200 transition-colors shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STUDENT VIEW - GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white rounded-3xl p-6 border-2 border-sky-100 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-md hover:border-sky-300 transition-all group">
              <div className="w-20 h-20 rounded-full bg-sky-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform">
                {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-xl text-sky-600">{student.name.charAt(0)}</span>}
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{student.name}</h3>
              <p className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">{student.className || 'Học sinh'}</p>
            </div>
          ))}
          {filteredStudents.length === 0 && <div className="col-span-full py-12 text-center text-slate-500">Chưa có thành viên nào.</div>}
        </div>
      )}

      {/* MODAL GIAO DIỆN THÊM/SỬA */}
      {showForm && (
        <div className="fixed inset-0 bg-sky-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border-2 border-sky-100">
            <div className="bg-sky-500 p-6 relative">
              <button 
                onClick={resetForm}
                className="absolute top-4 right-4 text-white hover:bg-sky-600 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-extrabold text-white">{editId ? 'Sửa Thông Tin' : 'Thêm Học Sinh Mới'}</h2>
              <p className="text-sky-100 font-medium text-sm mt-1">{editId ? 'Cập nhật lại thông tin của tài khoản này' : 'Tạo nhanh một tài khoản học sinh mới'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editId && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 items-start text-amber-700 text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Mật khẩu mặc định cho các tài khoản tạo mới sẽ là <strong>123456</strong>.</p>
                </div>
              )}
              {formError && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                  ⚠️ {formError}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Họ và Tên</label>
                <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none" placeholder="VD: Nguyễn Văn A" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tài khoản Email</label>
                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={!!editId} className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed" placeholder="VD: hs1@school.edu.vn" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Lớp học</label>
                  <select 
                    required 
                    value={className} 
                    onChange={e=>setClassName(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none cursor-pointer"
                  >
                    {CLASS_OPTIONS.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link Ảnh Đại Diện</label>
                  <input type="text" value={avatar} onChange={e=>setAvatar(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 outline-none" placeholder="https://..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-50 mt-6">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 font-bold rounded-xl transition-colors">Hủy Bỏ</button>
                <button type="submit" className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md shadow-sky-200 transition-colors">
                  {editId ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
