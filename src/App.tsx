import React, { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LazyRoute } from './components/LazyRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Role } from '@/src/types';
import { AuthProvider, useAuthContext } from './context/AuthContext';

// Lazy load components
const Dashboard = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const Courses = lazy(() => import('./views/Courses').then(m => ({ default: m.Courses })));
const Assignments = lazy(() => import('./views/Assignments').then(m => ({ default: m.Assignments })));
const Inbox = lazy(() => import('./views/Inbox').then(m => ({ default: m.Inbox })));
const CourseDetail = lazy(() => import('./views/CourseDetail').then(m => ({ default: m.CourseDetail })));
const AssignmentDetail = lazy(() => import('./views/AssignmentDetail').then(m => ({ default: m.AssignmentDetail })));
const Rewards = lazy(() => import('./views/Rewards').then(m => ({ default: m.Rewards })));
const Login = lazy(() => import('./views/Login').then(m => ({ default: m.Login })));
const Profile = lazy(() => import('./views/Profile').then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import('./views/Notifications').then(m => ({ default: m.Notifications })));
const Students = lazy(() => import('./views/Students').then(m => ({ default: m.Students })));
const EvaluationHub = lazy(() => import('./views/EvaluationHub').then(m => ({ default: m.EvaluationHub })));
const AiChat = lazy(() => import('./views/AiChat').then(m => ({ default: m.AiChat })));
const ExamList = lazy(() => import('./views/ExamList').then(m => ({ default: m.ExamList })));
const ExamGenerator = lazy(() => import('./views/ExamGenerator').then(m => ({ default: m.ExamGenerator })));
const ExamViewer = lazy(() => import('./views/ExamViewer').then(m => ({ default: m.ExamViewer })));
const ExamTaking = lazy(() => import('./views/ExamTaking').then(m => ({ default: m.ExamTaking })));
const AIGrading = lazy(() => import('./views/AiGrading').then(m => ({ default: m.AIGrading })));
const Plickers = lazy(() => import('./views/Plickers').then(m => ({ default: m.Plickers })));
const PlickersSession = lazy(() => import('./views/PlickersSession').then(m => ({ default: m.PlickersSession })));
const PlickersManualScan = lazy(() => import('./views/PlickersManualScan').then(m => ({ default: m.PlickersManualScan })));
const PlickersLiveView = lazy(() => import('./views/PlickersLiveView').then(m => ({ default: m.PlickersLiveView })));

const AppContent = React.memo(function AppContent() {
  const { currentUser, isLoading, login, logout } = useAuthContext();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Đang khởi tạo ứng dụng..." />
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <LazyRoute>
          <Login onLogin={login} />
        </LazyRoute>
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
              <Route path="/" element={<LazyRoute><Dashboard role={role} /></LazyRoute>} />
              <Route path="/courses" element={<LazyRoute><Courses role={role} /></LazyRoute>} />
              <Route path="/courses/:id" element={<LazyRoute><CourseDetail role={role} /></LazyRoute>} />
              <Route path="/assignments" element={<LazyRoute><Assignments role={role} /></LazyRoute>} />
              <Route path="/plickers" element={<LazyRoute><Plickers role={role} /></LazyRoute>} />
              <Route path="/plickers/:id" element={<LazyRoute><PlickersSession /></LazyRoute>} />
              <Route path="/plickers/:id/scan" element={<LazyRoute><PlickersManualScan /></LazyRoute>} />
              <Route path="/plickers/:id/live" element={<LazyRoute><PlickersLiveView /></LazyRoute>} />
              <Route path="/ai-grading" element={<LazyRoute><AIGrading /></LazyRoute>} />
              <Route path="/assignments/:id" element={<LazyRoute><AssignmentDetail role={role} /></LazyRoute>} />
              <Route path="/inbox" element={<LazyRoute><Inbox /></LazyRoute>} />
              <Route path="/ai-chat" element={<LazyRoute><AiChat /></LazyRoute>} />
              <Route path="/rewards" element={<LazyRoute><Rewards /></LazyRoute>} />
              <Route path="/profile" element={<LazyRoute><Profile role={role} /></LazyRoute>} />
              <Route path="/notifications" element={<LazyRoute><Notifications /></LazyRoute>} />
              <Route path="/students" element={<LazyRoute><Students role={role} /></LazyRoute>} />
              <Route path="/evaluation" element={<LazyRoute><EvaluationHub role={role} /></LazyRoute>} />
              <Route path="/exams" element={<LazyRoute><ExamList role={role} /></LazyRoute>} />
              <Route path="/exams/new" element={<LazyRoute><ExamGenerator /></LazyRoute>} />
              <Route path="/exams/:id" element={<LazyRoute><ExamViewer /></LazyRoute>} />
              <Route path="/exams/:id/take" element={<LazyRoute><ExamTaking /></LazyRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
