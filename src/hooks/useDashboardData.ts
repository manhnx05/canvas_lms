import { useState, useEffect } from 'react';
import apiClient from '@/src/lib/apiClient';
import { Course, Assignment, Role } from '@/src/types';

export function useDashboardData(role: Role) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/courses').then(res => res.data),
      apiClient.get('/assignments').then(res => res.data),
      role === 'teacher' ? apiClient.get('/teacher/stats').then(res => res.data) : Promise.resolve(null)
    ]).then(([coursesData, assignmentsData, statsData]) => {
      setCourses(coursesData);
      setAssignments(assignmentsData);
      setStats(statsData);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch dashboard data", err);
      setLoading(false);
    });
  }, [role]);

  return { courses, assignments, stats, loading };
}
