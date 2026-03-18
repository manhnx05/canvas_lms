/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Assignments } from './pages/Assignments';
import { AssignmentDetail } from './pages/AssignmentDetail';
import { Rewards } from './pages/Rewards';
import { Inbox } from './pages/Inbox';
import { Role } from './types';

export default function App() {
  const [role, setRole] = useState<Role>('student');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout role={role} setRole={setRole} />}>
          <Route index element={<Dashboard role={role} />} />
          <Route path="courses" element={<Courses role={role} />} />
          <Route path="courses/:id" element={<CourseDetail role={role} />} />
          <Route path="assignments" element={<Assignments role={role} />} />
          <Route path="assignments/:id" element={<AssignmentDetail role={role} />} />
          <Route path="rewards" element={<Rewards role={role} />} />
          <Route path="inbox" element={<Inbox role={role} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
