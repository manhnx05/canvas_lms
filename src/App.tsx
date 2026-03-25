import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoading } from './components/Loading';
import { Dashboard } from './views/Dashboard';
import { Courses } from './views/Courses';
import { Assignments } from './views/Assignments';
import { Inbox } from './views/Inbox';
import { CourseDetail } from './views/CourseDetail';
import { AssignmentDetail } from './views/AssignmentDetail';
import { Rewards } from './views/Rewards';
import { Login } from './views/Login';
import { Profile } from './views/Profile';
import { Notifications } from './views/Notifications';
import { Students } from './views/Students';
import { EvaluationHub } from './views/EvaluationHub';
import { ExamList } from './views/ExamList';
import { ExamGenerator } from './views/ExamGenerator';
import { ExamViewer } from './views/ExamViewer';
import { ExamTaking } from './views/ExamTaking';
import { Role, User } from '@/src/types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user on app start
    try {
      const saved = localStorage.getItem('canvas_user');
      const token = localStorage.getItem('canvas_token');
      
      if (saved && token) {
        const user = JSON.parse(saved);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      // Clear corrupted data
      localStorage.removeItem('canvas_user');
      localStorage.removeItem('canvas_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('canvas_user', JSON.stringify(user));
    localStorage.setItem('canvas_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('canvas_user');
    localStorage.removeItem('canvas_token');
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <PageLoading text="Đang khởi tạo ứng dụng..." />;
  }

  // Show login if not authenticated
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  const role = currentUser.role as Role;

  return (
    <ErrorBoundary>
      <Router>
        <Layout role={role} user={currentUser} onLogout={handleLogout}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard role={role} />} />
              <Route path="/courses" element={<Courses role={role} />} />
              <Route path="/courses/:id" element={<CourseDetail role={role} />} />
              <Route path="/assignments" element={<Assignments role={role} />} />
              <Route path="/assignments/:id" element={<AssignmentDetail role={role} />} />
              <Route path="/inbox" element={<Inbox role={role} />} />
              <Route path="/rewards" element={<Rewards role={role} />} />
              <Route path="/profile" element={<Profile role={role} user={currentUser} />} />
              <Route path="/notifications" element={<Notifications role={role} />} />
              <Route path="/students" element={<Students role={role} />} />
              <Route path="/evaluation" element={<EvaluationHub role={role} />} />
              <Route path="/exams" element={<ExamList role={role} />} />
              <Route path="/exams/new" element={<ExamGenerator />} />
              <Route path="/exams/:id" element={<ExamViewer />} />
              <Route path="/exams/:id/take" element={<ExamTaking />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
