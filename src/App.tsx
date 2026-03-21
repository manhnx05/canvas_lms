import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { Assignments } from './pages/Assignments';
import { Inbox } from './pages/Inbox';
import { CourseDetail } from './pages/CourseDetail';
import { AssignmentDetail } from './pages/AssignmentDetail';
import { Rewards } from './pages/Rewards';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { Students } from './pages/Students';
import { EvaluationHub } from './pages/EvaluationHub';
import { ExamList } from './pages/ExamList';
import { ExamGenerator } from './pages/ExamGenerator';
import { ExamViewer } from './pages/ExamViewer';
import { ExamTaking } from './pages/ExamTaking';
import { Role } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('canvas_user');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('canvas_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('canvas_user');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const role = currentUser.role as Role;

  return (
    <Router>
      <Layout role={role} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard role={role} />} />
          <Route path="/courses" element={<Courses role={role} />} />
          <Route path="/courses/:id" element={<CourseDetail role={role} />} />
          <Route path="/assignments" element={<Assignments role={role} />} />
          <Route path="/assignments/:id" element={<AssignmentDetail role={role} />} />
          <Route path="/inbox" element={<Inbox role={role} />} />
          <Route path="/rewards" element={<Rewards role={role} />} />
          <Route path="/profile" element={<Profile role={role} />} />
          <Route path="/notifications" element={<Notifications role={role} />} />
          <Route path="/students" element={<Students role={role} />} />
          <Route path="/evaluation" element={<EvaluationHub role={role} />} />
          <Route path="/exams" element={<ExamList role={role} />} />
          <Route path="/exams/new" element={<ExamGenerator />} />
          <Route path="/exams/:id" element={<ExamViewer />} />
          <Route path="/exams/:id/take" element={<ExamTaking />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
