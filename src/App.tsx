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
import { Role } from '@/src/types';
import { AuthProvider, useAuthContext } from './context/AuthContext';

function AppContent() {
  const { currentUser, isLoading, login, logout } = useAuthContext();


  // Show loading screen while checking authentication
  if (isLoading) {
    return <PageLoading text="Đang khởi tạo ứng dụng..." />;
  }

  // Show login if not authenticated
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <Login onLogin={login} />
      </ErrorBoundary>
    );
  }

  const role = currentUser.role as Role;

  return (
    <ErrorBoundary>
      <Router>
        <Layout role={role} onLogout={logout}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard role={role} />} />
              <Route path="/courses" element={<Courses role={role} />} />
              <Route path="/courses/:id" element={<CourseDetail role={role} />} />
              <Route path="/assignments" element={<Assignments role={role} />} />
              <Route path="/assignments/:id" element={<AssignmentDetail role={role} />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/profile" element={<Profile role={role} />} />
              <Route path="/notifications" element={<Notifications />} />
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
