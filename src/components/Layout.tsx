import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, MessageSquare, Settings, Users, Home, Bell, Search, Menu, Star, Trophy, PenTool } from 'lucide-react';
import { Role } from '../types';

export function Layout({ role, setRole }: { role: Role, setRole: (r: Role) => void }) {
  const location = useLocation();

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
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sky-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 hover:bg-sky-100 rounded-xl text-sky-600">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm bài học..." 
                className="w-full pl-12 pr-4 py-2.5 bg-sky-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition-all outline-none font-medium text-sky-900 placeholder-sky-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Role Switcher */}
            <div className="flex items-center bg-sky-100 p-1 rounded-xl">
              <button 
                onClick={() => setRole('student')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${role === 'student' ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-500 hover:text-sky-700'}`}
              >
                Học sinh
              </button>
              <button 
                onClick={() => setRole('teacher')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${role === 'teacher' ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-500 hover:text-sky-700'}`}
              >
                Giáo viên
              </button>
            </div>

            <button className="p-2.5 hover:bg-sky-100 rounded-full relative text-sky-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l-2 border-sky-100">
              {role === 'student' ? (
                <>
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-bold text-sky-900">Bé An</p>
                    <div className="flex items-center text-amber-500 font-bold text-xs">
                      <Star className="w-3 h-3 fill-current mr-1" /> 120 Sao
                    </div>
                  </div>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-sky-200 bg-sky-100" />
                </>
              ) : (
                <>
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-bold text-sky-900">Cô Lan</p>
                    <p className="text-xs font-semibold text-sky-500">Giáo viên Lớp 3A</p>
                  </div>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffdfbf" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-amber-200 bg-amber-100" />
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
