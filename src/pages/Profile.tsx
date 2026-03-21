import React, { useState } from 'react';
import { User, Mail, Image, Save, Book } from 'lucide-react';
import { Role } from '../types';
import apiClient from '../lib/apiClient';

export function Profile({ role }: { role: Role }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('canvas_user') || '{}'));
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [className, setClassName] = useState(user.className || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await apiClient.put('/auth/profile', { email: user.email, name, avatar, className: role === 'student' ? className : undefined });
      const data = res.data;
      setMessage('Cập nhật hồ sơ thành công!');
      localStorage.setItem('canvas_user', JSON.stringify(data.user));
      setUser(data.user);
      window.location.reload();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Lỗi kết nối máy chủ');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${role === 'student' ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2">Hồ Sơ Của Tôi</h1>
          <p className="text-lg opacity-90 font-medium">Quản lý và cập nhật thông tin cá nhân của bạn</p>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-sky-100">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-sky-100 bg-sky-50 flex items-center justify-center overflow-hidden mb-4 relative group">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-sky-300" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" /> Họ và Tên
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-sky-500 outline-none transition-colors font-semibold text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-500" /> Email (Không thể đổi)
              </label>
              <input 
                type="email" 
                value={user.email} 
                disabled
                className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
            
            <div className={`space-y-2 ${role === 'teacher' ? 'md:col-span-2' : ''}`}>
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Image className="w-4 h-4 text-sky-500" /> Đường dẫn Ảnh đại diện (URL)
              </label>
              <input 
                type="text" 
                value={avatar} 
                onChange={(e) => setAvatar(e.target.value)} 
                placeholder="https://example.com/avatar.png"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-sky-500 outline-none transition-colors font-semibold text-slate-700"
              />
            </div>

            {role === 'student' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Book className="w-4 h-4 text-sky-500" /> Lớp học
                </label>
                <input 
                  type="text" 
                  value={className} 
                  onChange={(e) => setClassName(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-sky-500 outline-none transition-colors font-semibold text-slate-700"
                />
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl font-bold ${message.includes('thành công') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md shadow-sky-200 flex items-center gap-2 transition-transform transform active:scale-95 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
