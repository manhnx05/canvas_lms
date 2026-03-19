import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Book, Megaphone, CheckSquare, BarChart, Users, Clock, CheckCircle, Plus, FileText, Send, X, Trophy, Edit, Trash2, GripVertical, File, Link as LinkIcon, MonitorPlay, Sparkles } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Role } from '../types';

// DND Sortable Item Component
const SortableModuleItem = ({ item, onDelete, role }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const Icon = item.type === 'file' ? File : (item.type === 'elearning' ? MonitorPlay : LinkIcon);
  
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border-2 border-slate-100 mb-2 rounded-xl group hover:border-sky-300 transition-colors shadow-sm">
      {role === 'teacher' && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-sky-500 p-1">
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'file' ? 'bg-rose-50 text-rose-500' : (item.type === 'elearning' ? 'bg-amber-50 text-amber-500' : 'bg-sky-50 text-sky-500')}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <a href={item.url || '#'} target="_blank" rel="noreferrer" className="font-bold text-slate-800 hover:text-sky-600 truncate block">
          {item.title}
        </a>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.type}</span>
      </div>
      {role === 'teacher' && (
        <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 p-2 rounded-lg transition-all shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export function CourseDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [showAssnForm, setShowAssnForm] = useState(false);
  const [showModForm, setShowModForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState<string | null>(null);

  // Forms data
  const [aTitle, setATitle] = useState(''); const [aContent, setAContent] = useState('');
  const [assTitle, setAssTitle] = useState(''); const [assDue, setAssDue] = useState('');
  const [assStars, setAssStars] = useState('10'); const [assType, setAssType] = useState('quiz');
  const [assDesc, setAssDesc] = useState('');
  const [modTitle, setModTitle] = useState('');
  
  // Item Form data
  const [iTitle, setITitle] = useState('');
  const [iType, setIType] = useState('elearning');
  const [iUrl, setIUrl] = useState('');

  // Edit states
  const [editAnnId, setEditAnnId] = useState<string|null>(null);
  const [editATitle, setEditATitle] = useState('');
  const [editAContent, setEditAContent] = useState('');

  // AI Quiz
  const [isGenerating, setIsGenerating] = useState(false);
  const [assTopic, setAssTopic] = useState('');
  const [assQuestions, setAssQuestions] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchCourse = () => {
    fetch(`/api/courses/${id}`)
      .then(res => res.json())
      .then(data => { 
        setCourse(data); 
        setModules(data.modules || []);
        setLoading(false); 
      });
  };

  useEffect(() => { fetchCourse(); }, [id]);

  // MODULES CRUD
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/courses/${id}/modules`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: modTitle })
    });
    setModTitle(''); setShowModForm(false); fetchCourse();
  };

  const handleDeleteModule = async (modId: string) => {
    if(!confirm('Xóa tuần học này sẽ xóa toàn bộ nội dung bên trong!')) return;
    await fetch(`/api/courses/modules/${modId}`, { method: 'DELETE' });
    fetchCourse();
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showItemForm) return;
    await fetch(`/api/courses/modules/${showItemForm}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: iTitle, type: iType, url: iUrl })
    });
    setITitle(''); setIType('elearning'); setIUrl(''); setShowItemForm(null); fetchCourse();
  };

  const handleDeleteItem = async (itemId: string) => {
    if(!confirm('Xóa bài giảng/file này?')) return;
    await fetch(`/api/courses/modules/items/${itemId}`, { method: 'DELETE' });
    fetchCourse();
  };

  const handleDragEnd = (moduleId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModules((prev) => {
        const newModules = [...prev];
        const modIndex = newModules.findIndex(m => m.id === moduleId);
        if (modIndex === -1) return prev;
        
        const mod = newModules[modIndex];
        const oldIndex = mod.items.findIndex((i:any) => i.id === active.id);
        const newIndex = mod.items.findIndex((i:any) => i.id === over.id);
        
        const newItems = arrayMove(mod.items, oldIndex, newIndex);
        const updatedItems = newItems.map((item: any, idx) => ({ ...item, order: idx }));
        mod.items = updatedItems;
        
        // Background sync
        fetch('/api/courses/modules/reorder', {
           method: 'PUT', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ items: updatedItems.map(i => ({id: i.id, order: i.order})) })
        });
        
        return newModules;
      });
    }
  };

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

  // ASSIGNMENT
  const handleAIGenerate = async () => {
    if (!assTopic) return alert("Vui lòng nhập chủ đề bài kiểm tra!");
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ topic: assTopic })
      });
      const data = await res.json();
      if (data.questions) setAssQuestions(data.questions);
      else alert("Lỗi khi sinh đề: " + data.error);
    } catch (e) { alert("Lái gọi AI thất bại."); }
    setIsGenerating(false);
  };

  const handlePostAssn = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/assignments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: assTitle, courseId: course.id, courseName: course.title, 
        dueDate: assDue, starsReward: assStars, type: assType, description: assDesc,
        questions: assQuestions.length > 0 ? assQuestions : null
      })
    });
    setAssTitle(''); setAssDue(''); setAssStars('10'); setAssDesc(''); 
    setAssTopic(''); setAssQuestions([]); setShowAssnForm(false); 
    fetchCourse();
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
      <Link to="/courses" className="inline-flex items-center gap-2 text-sky-500 font-bold hover:text-sky-700 hover:-translate-x-1 transition-transform">
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
          <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-sky-100 flex flex-col gap-2 relative">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    isActive ? 'bg-sky-500 text-white shadow-md shadow-sky-200 translate-x-2' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
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
          
          {/* TAB: BÀI GIẢNG / MODULES */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-sky-900 tracking-tight">Chương Trình Học</h2>
                {role === 'teacher' && (
                  <button onClick={() => setShowModForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm shadow-emerald-200">
                    <Plus className="w-5 h-5" /> Tạo Tuần Học
                  </button>
                )}
              </div>
              
              {showModForm && (
                <form onSubmit={handleCreateModule} className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 mb-6 shadow-sm">
                  <h3 className="font-bold text-emerald-800 mb-3">Thêm Nhóm / Tuần Mới</h3>
                  <input autoFocus required value={modTitle} onChange={e=>setModTitle(e.target.value)} type="text" placeholder="VD: Tuần 07 - Tự nhiên xã hội" className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 outline-none focus:border-emerald-500 mb-4 font-bold text-emerald-900" />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={()=>setShowModForm(false)} className="px-5 py-2.5 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold transition-colors">Hủy</button>
                    <button type="submit" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors">Tạo Mới</button>
                  </div>
                </form>
              )}

              <div className="space-y-6">
                {modules.length === 0 && <p className="text-slate-400 italic text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">Chưa có bài giảng nào được phân bố.</p>}
                
                {modules.map(mod => (
                  <div key={mod.id} className="border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm group/module">
                    <div className="bg-slate-50 p-5 border-b-2 border-slate-100 flex justify-between items-center group-hover/module:bg-sky-50 transition-colors">
                      <h3 className="font-extrabold text-lg text-slate-800">{mod.title}</h3>
                      {role === 'teacher' && (
                        <div className="flex gap-2">
                          <button onClick={() => setShowItemForm(mod.id)} className="text-sky-600 hover:bg-sky-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
                            <Plus className="w-4 h-4" /> Thêm Nội Dung
                          </button>
                          <button onClick={() => handleDeleteModule(mod.id)} className="text-rose-400 hover:bg-rose-100 hover:text-rose-600 p-1.5 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-white min-h-[60px]">
                      {showItemForm === mod.id && (
                        <form onSubmit={handleCreateItem} className="bg-sky-50 p-4 border-2 border-sky-100 rounded-xl mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <input required value={iTitle} onChange={e=>setITitle(e.target.value)} type="text" placeholder="Tên bài học/Tài liệu" className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none" />
                            <select value={iType} onChange={e=>setIType(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none bg-white">
                              <option value="elearning">Module E-Learning (SCORM/Link)</option>
                              <option value="file">Tài liệu đính kèm (PDF/Word)</option>
                              <option value="link">Trang Web / Link ngoài</option>
                            </select>
                          </div>
                          <input required value={iUrl} onChange={e=>setIUrl(e.target.value)} type="text" placeholder="Link (URL) của file hoặc Bài giảng..." className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none mb-4" />
                          <div className="flex justify-end gap-2">
                             <button type="button" onClick={()=>setShowItemForm(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Hủy</button>
                             <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-bold rounded-lg shadow-sm">Thêm Mới</button>
                          </div>
                        </form>
                      )}

                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(mod.id, e)}>
                        <SortableContext items={mod.items.map((i:any) => i.id)} strategy={verticalListSortingStrategy}>
                           {mod.items.map((item:any) => <SortableModuleItem key={item.id} item={item} onDelete={handleDeleteItem} role={role} />)}
                        </SortableContext>
                      </DndContext>
                      
                      {mod.items.length === 0 && !showItemForm && (
                        <div className="text-sm text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                           Kéo thả các bài giảng hoặc thêm nội dung mới vào danh sách này.
                        </div>
                      )}
                    </div>
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
                         <button onClick={() => { setEditAnnId(ann.id); setEditATitle(ann.title); setEditAContent(ann.content); }} className="p-1.5 text-slate-400 hover:text-sky-500 bg-white rounded-lg shadow-sm"><Edit className="w-4 h-4" /></button>
                         <button onClick={() => handleDeleteAnn(ann.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
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
                        <p className="text-xs text-sky-500 mb-3 font-semibold w-fit px-2 py-1 bg-white rounded-md border border-sky-100">{ann.date}</p>
                        <p className="text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">{ann.content}</p>
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
                  
                  <div className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input value={assTopic} onChange={e=>setAssTopic(e.target.value)} type="text" placeholder="Nhập chủ đề để AI ra đề trắc nghiệm..." className="flex-1 px-4 py-2 rounded-lg border focus:border-amber-500 outline-none" />
                      <button type="button" onClick={handleAIGenerate} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                        <Sparkles className="w-4 h-4" /> {isGenerating ? "AI Đang Soạn..." : "AI Tự Ra Đề"}
                      </button>
                    </div>
                    {assQuestions.length > 0 && (
                      <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium border border-amber-100 flex items-center justify-between">
                        <span>Đã sinh thành công {assQuestions.length} câu hỏi trắc nghiệm!</span>
                        <button type="button" onClick={() => setAssQuestions([])} className="text-amber-500 hover:text-amber-700">Xóa</button>
                      </div>
                    )}
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
              <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-8 text-center">
                <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Theo Dõi Kết Quả Học Tập</h3>
                <p className="text-slate-500 mt-2">Tổng số bài tập đã chấm: <strong className="text-sky-600 border border-sky-100 bg-white px-2 py-0.5 rounded-md">{course.assignments?.filter((a:any) => a.status === 'graded').length}</strong></p>
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
                      {course.assignments?.map((a: any) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800">{a.title}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${a.status==='graded'?'bg-emerald-100 text-emerald-700 border border-emerald-200': (a.status==='submitted'?'bg-sky-100 text-sky-700 border border-sky-200':'bg-amber-100 text-amber-700 border border-amber-200')}`}>
                              {a.status === 'graded' ? 'Đã chấm' : (a.status === 'submitted' ? 'Đã Nộp' : 'Chưa Nộp')}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-extrabold text-amber-500 text-right text-lg">{a.status==='graded' ? `+${a.starsReward}` : '-'}</td>
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
