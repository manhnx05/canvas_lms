export type Role = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  stars?: number;
  className?: string;
}

export interface Course {
  id: string;
  title: string;
  color: string;
  icon: string;
  teacher: string;
  studentsCount: number;
  progress?: number;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  starsReward: number;
  status: 'pending' | 'submitted' | 'graded';
  type: 'quiz' | 'drawing' | 'reading' | 'writing';
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  dateEarned: string;
}
