import React from 'react';
import { BookOpen } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  color: string;
  teacher: string;
  studentsCount: number;
  progress?: number;
}

interface CourseCardProps {
  course: Course;
  role: 'student' | 'teacher';
  onClick: (courseId: string) => void;
}

export const MemoizedCourseCard = React.memo(function CourseCard({ 
  course, 
  role, 
  onClick 
}: CourseCardProps) {
  return (
    <div 
      onClick={() => onClick(course.id)} 
      className="bg-white rounded-3xl border-2 border-sky-100 shadow-sm overflow-hidden hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group transform hover:-translate-y-1"
    >
      <div className={`h-28 ${course.color} p-5 flex flex-col justify-between relative overflow-hidden`}>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-20 transform rotate-12">
          <BookOpen className="w-32 h-32 text-white" />
        </div>
        <div className="bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
          <span className="text-white font-bold text-sm">{course.studentsCount} Học sinh</span>
        </div>
        <h3 className="text-white font-extrabold text-xl leading-tight z-10">{course.title}</h3>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-sky-700">{course.teacher}</p>
          {role === 'student' && course.progress !== undefined && (
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
              <span className="text-sky-600 font-bold text-sm">{course.progress}%</span>
            </div>
          )}
        </div>
        {role === 'student' && course.progress !== undefined && (
          <div className="w-full bg-sky-100 rounded-full h-2.5 mb-2">
            <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
          </div>
        )}
      </div>
    </div>
  );
});