export type Role = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
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
  description?: string;
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
  description?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  dateEarned: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
}
