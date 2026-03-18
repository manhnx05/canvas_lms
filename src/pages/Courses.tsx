import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Star } from 'lucide-react';
import { Role, Course } from '../types';

export function Courses({ role }: { role: Role }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch courses", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-sky-900">{role === 'student' ? 'Môn Học Của Bé' : 'Quản Lý Lớp Học'}</h1>
        {role === 'teacher' && (
          <button className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-sky-200">
            + Tạo lớp mới
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer group flex flex-col h-full">
            <div className={`h-36 ${course.color} p-6 flex flex-col justify-between relative overflow-hidden shrink-0`}>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="w-40 h-40 text-white" />
              </div>
              <div className="bg-white/20 w-fit px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">{course.studentsCount} Học sinh</span>
              </div>
              <h3 className="text-white font-extrabold text-2xl leading-tight z-10">{course.title}</h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                    {course.teacher.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-sky-500 font-semibold uppercase">Giáo viên</p>
                    <p className="font-bold text-sky-900">{course.teacher}</p>
                  </div>
                </div>
              </div>

              {role === 'student' ? (
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-sky-600">Tiến độ học tập</span>
                    <span className="text-lg font-extrabold text-sky-500">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-sky-100 rounded-full h-3">
                    <div className="bg-sky-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto flex gap-3">
                  <button className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold py-2.5 rounded-xl transition-colors border-2 border-sky-100">
                    Sửa
                  </button>
                  <button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm shadow-sky-200">
                    Vào lớp
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
