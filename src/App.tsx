/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { Assignments } from './pages/Assignments';
import { Rewards } from './pages/Rewards';
import { Role } from './types';

export default function App() {
  const [role, setRole] = useState<Role>('student');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout role={role} setRole={setRole} />}>
          <Route index element={<Dashboard role={role} />} />
          <Route path="courses" element={<Courses role={role} />} />
          <Route path="assignments" element={<Assignments role={role} />} />
          <Route path="rewards" element={<Rewards role={role} />} />
          <Route path="inbox" element={<div className="p-6 text-xl">Tin nhắn (Đang phát triển)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
