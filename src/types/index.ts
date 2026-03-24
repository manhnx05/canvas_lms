export type Role = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  stars?: number;
  className?: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
  // Relations
  assignments?: Assignment[];
  modules?: CourseModule[];
  announcements?: Announcement[];
  people?: User[];
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
  items?: ModuleItem[];
}

export interface ModuleItem {
  id: string;
  title: string;
  type: 'file' | 'link' | 'page' | 'elearning';
  url?: string;
  content?: string;
  order: number;
  moduleId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  starsReward: number;
  status: 'pending' | 'published' | 'closed';
  type: 'quiz' | 'drawing' | 'reading' | 'writing';
  description?: string;
  questions?: any[];
  createdAt?: string;
  updatedAt?: string;
  // Relations
  submissions?: Submission[];
  mySubmission?: Submission;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  answers?: Record<string, any>;
  status: 'submitted' | 'graded';
  score?: number;
  aiFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
  // Relations
  user?: User;
  assignment?: Assignment;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  dateEarned: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole?: Role;
  senderAvatar?: string;
  content: string;
  attachments?: any[];
  isRead: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  conversationId: string;
  createdAt?: string;
  updatedAt?: string;
  // Relations
  sender?: User;
}

export interface Conversation {
  id: string;
  subject?: string;
  courseId?: string;
  courseName?: string;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
  // Relations
  participants?: User[];
  messages?: Message[];
  lastMessage?: Message | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt?: string;
  // Relations
  user?: User;
}

export interface Exam {
  id: string;
  title: string;
  subject: 'math' | 'physics' | 'chemistry' | 'biology' | 'literature' | 'history' | 'geography';
  grade: '1' | '2' | '3' | '4' | '5';
  duration: number;
  totalScore: number;
  standard: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: ExamQuestion[];
  courseId?: string;
  createdBy: string;
  status: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
  // Relations
  attempts?: ExamAttempt[];
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: ExamOption[];
  correctOptionId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export interface ExamOption {
  id: string;
  text: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  score?: number;
  status: 'in_progress' | 'completed';
  // Relations
  answers?: ExamAnswer[];
}

export interface ExamAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  optionId?: string;
  isCorrect?: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface CreateCourseForm {
  title: string;
  description?: string;
  color: string;
  icon: string;
  teacher?: string;
}

export interface CreateAssignmentForm {
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  starsReward: number;
  type: Assignment['type'];
  questions?: any[];
}

// Dashboard stats
export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  pendingGrading: number;
  completedAssignments?: number;
  totalStars?: number;
  completionRate?: number;
}
