import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { Role, Notification } from '@/src/types';

export function Notifications({ role }: { role: Role }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-sky-500" /> Thông Báo
          </h1>
          <p className="text-sky-600 mt-2 font-medium">Cập nhật tin tức và hoạt động mới nhất</p>
        </div>
        <div className="bg-sky-100 px-4 py-2 rounded-xl text-sky-700 font-bold">
          {notifications.filter(n => !n.isRead).length} Chưa đọc
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-sky-100">
        {notifications.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-500">Bạn không có thông báo nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-5 rounded-2xl flex gap-4 transition-colors ${notif.isRead ? 'bg-slate-50 border border-slate-100' : 'bg-sky-50 border border-sky-200'}`}
              >
                <div className="shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${notif.isRead ? 'bg-slate-200 text-slate-500' : 'bg-sky-500 text-white shadow-sm shadow-sky-200'}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`font-bold text-lg mb-1 ${notif.isRead ? 'text-slate-700' : 'text-sky-900'}`}>{notif.title}</h3>
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="shrink-0 bg-white border border-sky-200 hover:bg-sky-100 text-sky-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Đã đọc
                      </button>
                    )}
                  </div>
                  <p className={`whitespace-pre-wrap ${notif.isRead ? 'text-slate-500' : 'text-sky-700 font-medium'}`}>{notif.content}</p>
                  <p className="text-xs flex items-center gap-1 mt-3 font-semibold text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {notif.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
