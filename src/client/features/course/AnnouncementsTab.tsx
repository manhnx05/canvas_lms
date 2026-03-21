import React, { useState } from 'react';
import { Send, Edit, Trash2 } from 'lucide-react';
import { Role } from '../../../shared/types';
import apiClient from '../../../shared/lib/apiClient';

interface Props {
  courseId: string;
  announcements: any[];
  role: Role;
  onRefresh: () => void;
}

export function AnnouncementsTab({ courseId, announcements, role, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post(`/courses/${courseId}/announcements`, { title, content });
    setTitle(''); setContent(''); setShowForm(false); onRefresh();
  };

  const handleUpdate = async (annId: string) => {
    await apiClient.put(`/courses/${courseId}/announcements/${annId}`, { title: editTitle, content: editContent });
    setEditId(null); onRefresh();
  };

  const handleDelete = async (annId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    await apiClient.delete(`/courses/${courseId}/announcements/${annId}`);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-sky-900">Bảng Tin Lớp Học</h2>
        {role === 'teacher' && (
          <button onClick={() => setShowForm(true)} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Send className="w-4 h-4" /> Đăng tin
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="bg-rose-50 p-6 rounded-2xl border-2 border-rose-100 space-y-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Chủ đề thông báo" className="w-full px-4 py-2 rounded-xl border-2 border-rose-200 outline-none focus:border-rose-500" />
          <textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập nội dung thông báo tới toàn lớp..." rows={3} className="w-full px-4 py-2 rounded-xl border-2 border-rose-200 outline-none focus:border-rose-500" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 font-bold">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl shadow-sm">Gửi Thông Báo</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {announcements?.length === 0 && <p className="text-slate-400 italic">Lớp chưa có thông báo nào.</p>}
        {announcements?.map((ann: any) => (
          <div key={ann.id} className="p-5 bg-sky-50 border border-sky-100 rounded-2xl relative group">
            {role === 'teacher' && editId !== ann.id && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditId(ann.id); setEditTitle(ann.title); setEditContent(ann.content); }} className="p-1.5 text-slate-400 hover:text-sky-500 bg-white rounded-lg shadow-sm"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(ann.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
            {editId === ann.id ? (
              <div className="space-y-3">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-bold text-sky-900" />
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-slate-700" rows={3} />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(ann.id)} className="bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">Lưu</button>
                  <button onClick={() => setEditId(null)} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold">Hủy</button>
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
  );
}
