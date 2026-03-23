import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Book, Megaphone, CheckSquare, BarChart, Users } from 'lucide-react';
import { Role } from '@/src/types';
import { CourseModulesTab } from '../features/course/CourseModulesTab';
import { AnnouncementsTab } from '../features/course/AnnouncementsTab';
import { AssignmentsTab } from '../features/course/AssignmentsTab';
import { GradesTab } from '../features/course/GradesTab';

import { useCourseDetail } from '../hooks/useCourseDetail';

export function CourseDetail({ role }: { role: Role }) {
  const { id } = useParams();
  const { course, loading, fetchCourse } = useCourseDetail(id);
  const [activeTab, setActiveTab] = useState('home');

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
          {activeTab === 'home' && (
            <CourseModulesTab courseId={course.id} modules={course.modules || []} role={role} onRefresh={fetchCourse} />
          )}
          {activeTab === 'announcements' && (
            <AnnouncementsTab courseId={course.id} announcements={course.announcements || []} role={role} onRefresh={fetchCourse} />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab courseId={course.id} courseTitle={course.title} assignments={course.assignments || []} role={role} onRefresh={fetchCourse} />
          )}
          {activeTab === 'grades' && (
            <GradesTab assignments={course.assignments || []} />
          )}
        </div>
      </div>
    </div>
  );
}
