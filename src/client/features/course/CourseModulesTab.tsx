import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, File, Link as LinkIcon, MonitorPlay } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Role } from '../../../shared/types';
import apiClient from '../../../shared/lib/apiClient';

interface Props {
  courseId: string;
  modules: any[];
  role: Role;
  onRefresh: () => void;
}

const SortableModuleItem = ({ item, onDelete, role }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = item.type === 'file' ? File : item.type === 'elearning' ? MonitorPlay : LinkIcon;
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border-2 border-slate-100 mb-2 rounded-xl group hover:border-sky-300 transition-colors shadow-sm">
      {role === 'teacher' && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-sky-500 p-1">
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'file' ? 'bg-rose-50 text-rose-500' : item.type === 'elearning' ? 'bg-amber-50 text-amber-500' : 'bg-sky-50 text-sky-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <a href={item.url || '#'} target="_blank" rel="noreferrer" className="font-bold text-slate-800 hover:text-sky-600 truncate block">{item.title}</a>
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

export function CourseModulesTab({ courseId, modules: initialModules, role, onRefresh }: Props) {
  const [modules, setModules] = useState(initialModules);
  const [showModForm, setShowModForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState<string | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [iTitle, setITitle] = useState('');
  const [iType, setIType] = useState('elearning');
  const [iUrl, setIUrl] = useState('');
  const [iFile, setIFile] = useState<File | null>(null);

  // Sync when parent refreshes
  React.useEffect(() => { setModules(initialModules); }, [initialModules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post(`/courses/${courseId}/modules`, { title: modTitle });
    setModTitle(''); setShowModForm(false); onRefresh();
  };

  const handleDeleteModule = async (modId: string) => {
    if (!confirm('Xóa tuần học này sẽ xóa toàn bộ nội dung bên trong!')) return;
    await apiClient.delete(`/courses/modules/${modId}`);
    onRefresh();
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showItemForm) return;

    if (iType === 'file' || iType === 'elearning') {
      const formData = new FormData();
      formData.append('title', iTitle);
      formData.append('type', iType);
      if (iFile) formData.append('file', iFile);
      
      await apiClient.post(`/courses/modules/${showItemForm}/items`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      await apiClient.post(`/courses/modules/${showItemForm}/items`, { title: iTitle, type: iType, url: iUrl });
    }
    
    setITitle(''); setIType('elearning'); setIUrl(''); setIFile(null); setShowItemForm(null); onRefresh();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Xóa bài giảng/file này?')) return;
    await apiClient.delete(`/courses/modules/items/${itemId}`);
    onRefresh();
  };

  const handleDragEnd = (moduleId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModules(prev => {
        const newMods = [...prev];
        const modIdx = newMods.findIndex(m => m.id === moduleId);
        if (modIdx === -1) return prev;
        const mod = { ...newMods[modIdx] };
        const oldIdx = mod.items.findIndex((i: any) => i.id === active.id);
        const newIdx = mod.items.findIndex((i: any) => i.id === over.id);
        const newItems = arrayMove(mod.items, oldIdx, newIdx).map((item: any, idx: number) => ({ ...item, order: idx }));
        mod.items = newItems;
        newMods[modIdx] = mod;
        apiClient.put('/courses/modules/reorder', { items: newItems.map((i: any) => ({ id: i.id, order: i.order })) });
        return newMods;
      });
    }
  };

  return (
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
          <input autoFocus required value={modTitle} onChange={e => setModTitle(e.target.value)} type="text" placeholder="VD: Tuần 07 - Tự nhiên xã hội" className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 outline-none focus:border-emerald-500 mb-4 font-bold text-emerald-900" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModForm(false)} className="px-5 py-2.5 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold transition-colors">Hủy</button>
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
                    <input required value={iTitle} onChange={e => setITitle(e.target.value)} type="text" placeholder="Tên bài học/Tài liệu" className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none" />
                    <select value={iType} onChange={e => setIType(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none bg-white">
                      <option value="elearning">Module E-Learning (SCORM/Link)</option>
                      <option value="file">Tài liệu đính kèm (PDF/Word)</option>
                      <option value="link">Trang Web / Link ngoài</option>
                    </select>
                  </div>
                  {iType !== 'link' ? (
                    <input type="file" onChange={e => setIFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none mb-4 bg-white" />
                  ) : (
                    <input required value={iUrl} onChange={e => setIUrl(e.target.value)} type="text" placeholder="Link (URL) của bài giảng..." className="w-full px-4 py-2 rounded-lg border focus:border-sky-500 outline-none mb-4" />
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowItemForm(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-bold rounded-lg shadow-sm">Thêm Mới</button>
                  </div>
                </form>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(mod.id, e)}>
                <SortableContext items={mod.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                  {mod.items.map((item: any) => <SortableModuleItem key={item.id} item={item} onDelete={handleDeleteItem} role={role} />)}
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
  );
}
