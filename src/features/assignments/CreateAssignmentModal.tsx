import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Course } from '@/src/types';

interface CreateAssignmentModalProps {
  courses: Course[];
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function CreateAssignmentModal({ courses, onSubmit, onClose }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [starsReward, setStarsReward] = useState('5');
  const [type, setType] = useState('quiz');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    onSubmit({ title, description, courseId, courseName: course.title, dueDate, starsReward, type });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-extrabold text-sky-900 mb-6">Giao Bài Tập Mới</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <input required value={dueDate} onChange={e=>setDueDate(e.target.value)} type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 font-medium" />
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
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
            <button type="submit" className="flex-1 px-4 py-2.5 font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/30">Lưu Bài Tập</button>
          </div>
        </form>
      </div>
    </div>
  );
}
