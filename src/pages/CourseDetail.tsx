import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Book, Megaphone, CheckSquare, BarChart, Users, Clock, CheckCircle, Plus, FileText, Send, X, Trophy, Edit, Trash2 } from 'lucide-react';
import { Role } from '../types';

export function CourseDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [showLecForm, setShowLecForm] = useState(false);
  const [showAssnForm, setShowAssnForm] = useState(false);

  // Forms data
  const [aTitle, setATitle] = useState(''); const [aContent, setAContent] = useState('');
  const [lTitle, setLTitle] = useState(''); const [lContent, setLContent] = useState('');
  const [assTitle, setAssTitle] = useState(''); const [assDue, setAssDue] = useState('');
  const [assStars, setAssStars] = useState('10'); const [assType, setAssType] = useState('quiz');
  const [assDesc, setAssDesc] = useState('');

  // Edit states
  const [editAnnId, setEditAnnId] = useState<string|null>(null);
  const [editATitle, setEditATitle] = useState('');
  const [editAContent, setEditAContent] = useState('');

  const [editLecId, setEditLecId] = useState<string|null>(null);
  const [editLTitle, setEditLTitle] = useState('');
  const [editLContent, setEditLContent] = useState('');

  const fetchCourse = () => {
    fetch(`/api/courses/${id}`)
      .then(res => res.json())
      .then(data => { setCourse(data); setLoading(false); });
  };

  useEffect(() => { fetchCourse(); }, [id]);

  // ANNOUNCEMENT CRUD
  const handlePostAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/courses/${id}/announcements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: aTitle, content: aContent })
    });
    setATitle(''); setAContent(''); setShowAnnForm(false); fetchCourse();
  };
  const handleUpdateAnn = async (annId: string) => {
    await fetch(`/api/courses/${id}/announcements/${annId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editATitle, content: editAContent })
    });
    setEditAnnId(null); fetchCourse();
  };
  const handleDeleteAnn = async (annId: string) => {
    if(!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    await fetch(`/api/courses/${id}/announcements/${annId}`, { method: 'DELETE' });
    fetchCourse();
  };

  // LECTURE CRUD
  const handlePostLec = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/courses/${id}/lectures`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: lTitle, content: lContent })
    });
    setLTitle(''); setLContent(''); setShowLecForm(false); fetchCourse();
  };
  const handleUpdateLec = async (lecId: string) => {
    await fetch(`/api/courses/${id}/lectures/${lecId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editLTitle, content: editLContent })
    });
    setEditLecId(null); fetchCourse();
  };
  const handleDeleteLec = async (lecId: string) => {
    if(!confirm('Bạn có chắc muốn xóa bài giảng này?')) return;
    await fetch(`/api/courses/${id}/lectures/${lecId}`, { method: 'DELETE' });
    fetchCourse();
  };

  // ASSIGNMENT
  const handlePostAssn = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/assignments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: assTitle, courseId: course.id, courseName: course.title, 
        dueDate: assDue, starsReward: assStars, type: assType, description: assDesc 
      })
    });
    setAssTitle(''); setAssDue(''); setAssStars('10'); setAssDesc(''); setShowAssnForm(false); fetchCourse();
  };

  const tabs = [
    { id: 'home', icon: Book, label: 'Bài Giảng' },
    { id: 'announcements', icon: Megaphone, label: 'Thông Báo' },
    { id: 'assignments', icon: CheckSquare, label: 'Bài Tập' },
    { id: 'grades', icon: BarChart, label: 'Điểm Số' },
  ];

  if (loading || !course) return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;

  return (
    <div className="space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sky-500 font-bold hover:text-sky-700">
        <ArrowLeft className="w-5 h-5" /> Quay lại lớp học
      </Link>

      {/* Course Header */}
      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${course.color || 'bg-sky-500'}`}>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="bg-white/20 w-fit px-3 py-1 mb-3 rounded-lg flex items-center gap-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">{course.people?.length || course.studentsCount} Thành viên</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2">{course.title}</h1>
            <p className="text-lg opacity-90 font-medium">Giáo viên: {course.teacher}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-sky-100 flex flex-col gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    isActive ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                  }`}
                >
                  <Icon className="w-5 h-5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 border-sky-100 min-h-[500px]">
          
          {/* TAB: BÀI GIẢNG */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-sky-900">Bài Giảng & Học Liệu</h2>
                {role === 'teacher' && (
                  <button onClick={() => setShowLecForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    <Plus className="w-5 h-5" /> Thêm Bài
                  </button>
                )}
              </div>
              
              {showLecForm && (
                <form onSubmit={handlePostLec} className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-100 space-y-4">
                  <input required value={lTitle} onChange={e=>setLTitle(e.target.value)} type="text" placeholder="Tiêu đề bài giảng" className="w-full px-4 py-2 rounded-xl border-2 border-emerald-200 outline-none focus:border-emerald-500" />
                  <textarea required value={lContent} onChange={e=>setLContent(e.target.value)} placeholder="Nội dung, link video, bài viết..." rows={3} className="w-full px-4 py-2 rounded-xl border-2 border-emerald-200 outline-none focus:border-emerald-500" />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={()=>setShowLecForm(false)} className="px-4 py-2 text-slate-500 font-bold">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl shadow-sm">Đăng Bài</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {course.lectures?.length === 0 && <p className="text-slate-400 italic">Chưa có bài giảng nào được đăng.</p>}
                {course.lectures?.map((lec: any) => (
                  <div key={lec.id} className="p-5 border-2 border-slate-100 rounded-2xl hover:border-sky-300 transition-colors relative group">
                    {role === 'teacher' && editLecId !== lec.id && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditLecId(lec.id); setEditLTitle(lec.title); setEditLContent(lec.content); }} className="p-1.5 text-slate-400 hover:text-sky-500 bg-sky-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteLec(lec.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                    
                    {editLecId === lec.id ? (
                      <div className="space-y-3">
                        <input value={editLTitle} onChange={e=>setEditLTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-bold text-sky-900" />
                        <textarea value={editLContent} onChange={e=>setEditLContent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-slate-600" rows={3}/>
                        <div className="flex gap-2">
                          <button onClick={()=>handleUpdateLec(lec.id)} className="bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">Lưu</button>
                          <button onClick={()=>setEditLecId(null)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-sky-100 text-sky-500 rounded-lg flex justify-center items-center"><Book className="w-5 h-5"/></div>
                          <h3 className="font-bold text-lg text-sky-900 pr-16">{lec.title}</h3>
                        </div>
                        <p className="text-slate-600 whitespace-pre-wrap">{lec.content}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: THÔNG BÁO */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-sky-900">Bảng Tin Lớp Học</h2>
                {role === 'teacher' && (
                  <button onClick={() => setShowAnnForm(true)} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    <Send className="w-4 h-4" /> Đăng tin
                  </button>
                )}
              </div>
              
              {showAnnForm && (
                <form onSubmit={handlePostAnn} className="bg-rose-50 p-6 rounded-2xl border-2 border-rose-100 space-y-4">
                  <input required value={aTitle} onChange={e=>setATitle(e.target.value)} type="text" placeholder="Chủ đề thông báo" className="w-full px-4 py-2 rounded-xl border-2 border-rose-200 outline-none focus:border-rose-500" />
                  <textarea required value={aContent} onChange={e=>setAContent(e.target.value)} placeholder="Nhập nội dung thông báo tới toàn lớp..." rows={3} className="w-full px-4 py-2 rounded-xl border-2 border-rose-200 outline-none focus:border-rose-500" />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={()=>setShowAnnForm(false)} className="px-4 py-2 text-slate-500 font-bold">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl shadow-sm">Gửi Thông Báo</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {course.announcements?.length === 0 && <p className="text-slate-400 italic">Lớp chưa có thông báo nào.</p>}
                {course.announcements?.map((ann: any) => (
                  <div key={ann.id} className="p-5 bg-sky-50 border border-sky-100 rounded-2xl relative group">
                    {role === 'teacher' && editAnnId !== ann.id && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditAnnId(ann.id); setEditATitle(ann.title); setEditAContent(ann.content); }} className="p-1.5 text-slate-400 hover:text-sky-500 bg-white rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteAnn(ann.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}

                    {editAnnId === ann.id ? (
                      <div className="space-y-3">
                        <input value={editATitle} onChange={e=>setEditATitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-bold text-sky-900" />
                        <textarea value={editAContent} onChange={e=>setEditAContent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-slate-700" rows={3}/>
                        <div className="flex gap-2">
                          <button onClick={()=>handleUpdateAnn(ann.id)} className="bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">Lưu</button>
                          <button onClick={()=>setEditAnnId(null)} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-lg text-sky-900 mb-1 pr-16">{ann.title}</h3>
                        <p className="text-xs text-sky-500 mb-3 font-semibold">{ann.date}</p>
                        <p className="text-slate-700 whitespace-pre-wrap font-medium">{ann.content}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: BÀI TẬP */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-sky-900">Nhiệm Vụ / Bài Tập</h2>
                {role === 'teacher' && (
                  <button onClick={() => setShowAssnForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Plus className="w-5 h-5" /> Giao Bài
                  </button>
                )}
              </div>

              {showAssnForm && (
                <form onSubmit={handlePostAssn} className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-100 space-y-4">
                  <input required value={assTitle} onChange={e=>setAssTitle(e.target.value)} type="text" placeholder="Tiêu đề bài tập" className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required value={assDue} onChange={e=>setAssDue(e.target.value)} type="text" placeholder="Hạn nộp (VD: Ngày mai)" className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
                    <input required value={assStars} onChange={e=>setAssStars(e.target.value)} type="number" placeholder="Điểm thưởng (Sao)" className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium" />
                  </div>
                  <textarea required value={assDesc} onChange={e=>setAssDesc(e.target.value)} placeholder="Mô tả bài tập..." rows={3} className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-500 font-medium whitespace-pre-wrap" />
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={()=>setShowAssnForm(false)} className="px-4 py-2 text-slate-500 font-bold">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-sm">Lưu Bài Tập</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {course.assignments?.length === 0 && <p className="text-slate-400 italic">Chưa có bài tập nào.</p>}
                {course.assignments?.map((a: any) => (
                  <Link key={a.id} to={`/assignments/${a.id}`} className="block">
                    <div className="p-4 bg-white border-2 border-slate-100 hover:border-sky-300 rounded-2xl flex items-center gap-4 transition-colors group">
                      <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sky-900 text-lg">{a.title}</h3>
                        <p className="text-sm text-sky-500 flex items-center gap-1 mt-1 font-medium">
                          <Clock className="w-4 h-4" /> Hạn: {a.dueDate}
                        </p>
                      </div>
                      <div>
                        {a.status === 'graded' ? <CheckCircle className="text-emerald-500 w-8 h-8" /> : 
                         <div className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">+{a.starsReward} Sao</div>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ĐIỂM SỐ */}
          {activeTab === 'grades' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-sky-900">Bảng Điểm Lớp</h2>
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-100 p-6 text-center">
                <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">Theo Dõi Kết Quả</h3>
                <p className="text-slate-500 mt-2">Tổng số bài tập đã chấm: <strong className="text-sky-600">{course.assignments?.filter((a:any) => a.status === 'graded').length}</strong></p>
                <div className="mt-6">
                  {/* Mock grades view */}
                  <table className="w-full text-left bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                    <thead className="bg-sky-50 text-sky-900">
                      <tr>
                        <th className="px-4 py-3 font-bold">Bài Tập</th>
                        <th className="px-4 py-3 font-bold">Trạng Thái</th>
                        <th className="px-4 py-3 font-bold">Điểm Nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {course.assignments?.map((a: any) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800">{a.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${a.status==='graded'?'bg-emerald-100 text-emerald-600': (a.status==='submitted'?'bg-sky-100 text-sky-600':'bg-amber-100 text-amber-600')}`}>
                              {a.status === 'graded' ? 'Đã chấm' : (a.status === 'submitted' ? 'Đã Nộp' : 'Chưa Nộp')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-extrabold text-amber-500">{a.status==='graded' ? `+${a.starsReward}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
