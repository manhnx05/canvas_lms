import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, MessageSquare, Users, Home, Bell, Search, Menu, Trophy, PenTool, LogOut } from 'lucide-react';
import { Role } from '../types';

export function Layout({ role, onLogout, children }: { role: Role, onLogout: () => void, children?: React.ReactNode }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  const studentNav = [
    { icon: Home, label: 'Bảng điều khiển', path: '/' },
    { icon: BookOpen, label: 'Môn học', path: '/courses' },
    { icon: PenTool, label: 'Bài tập', path: '/assignments' },
    { icon: Trophy, label: 'Góc khen thưởng', path: '/rewards' },
  ];

  const teacherNav = [
    { icon: Home, label: 'Tổng quan', path: '/' },
    { icon: Users, label: 'Lớp học', path: '/courses' },
    { icon: PenTool, label: 'Chấm bài', path: '/assignments' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/inbox' },
  ];

  const navItems = role === 'student' ? studentNav : teacherNav;

  return (
    <div className="flex h-screen bg-sky-50 font-sans">
      <aside className="w-20 lg:w-64 bg-white border-r border-sky-100 flex flex-col transition-all duration-300 shadow-sm z-10">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-sky-100">
          <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center rotate-3 shadow-sm">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="ml-3 text-2xl font-extrabold text-sky-900 hidden lg:block tracking-tight">LớpHọc<span className="text-amber-500">Vui</span></span>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-3 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 font-semibold ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-200 translate-y-[-2px]' 
                    : 'text-sky-700 hover:bg-sky-100'
                }`}
              >
                <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'text-sky-500'}`} />
                <span className="ml-3 hidden lg:block text-[15px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sky-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 hover:bg-sky-100 rounded-xl text-sky-600">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-full pl-12 pr-4 py-2.5 bg-sky-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition-all outline-none font-medium text-sky-900 placeholder-sky-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-2.5 hover:bg-sky-100 rounded-full relative text-sky-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l-2 border-sky-100">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-bold text-sky-900">{user.name}</p>
                <p className="text-xs font-semibold text-sky-500">{user.email}</p>
              </div>
              <img src={role === 'student' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffdfbf'} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-sky-200 bg-sky-100" />
              
              <button 
                onClick={onLogout} 
                className="ml-2 p-2 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors flex items-center justify-center" 
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
}
