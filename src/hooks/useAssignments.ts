import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/lib/apiClient';
import { Assignment, Course } from '@/src/types';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultCourseId, setDefaultCourseId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assnRes, examsRes, coursesRes] = await Promise.all([
        apiClient.get('/assignments'),
        apiClient.get('/exams'),
        apiClient.get('/courses')
      ]);
      const assnData = assnRes.data.map((a: any) => ({ ...a, itemType: 'assignment' }));
      const examsData = examsRes.data.map((e: any) => ({ 
        ...e, 
        itemType: 'exam',
        // Map exam fields to look like assignments for unified list
        dueDate: e.deadline || e.createdAt, 
        courseName: e.courseName || e.subject,
        starsReward: e.totalScore, // Exam total Score is equivalent to stars logic in unified UI
        status: e.myAttempt?.status === 'completed' ? 'graded' : 'pending',
        // Map myAttempt to mySubmission shape so UI doesn't have to change too much
        mySubmission: e.myAttempt ? { status: e.myAttempt.status === 'completed' ? 'submitted' : 'pending' } : null
      }));

      // Combine and sort by due date ascending
      const combined = [...assnData, ...examsData].sort((a: any, b: any) => {
        const dateA = new Date(a.dueDate || a.createdAt).getTime();
        const dateB = new Date(b.dueDate || b.createdAt).getTime();
        return dateA - dateB;
      });

      setAssignments(combined);
      setCourses(coursesRes.data);
      if (coursesRes.data.length > 0) setDefaultCourseId(coursesRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createAssignment = async (data: any) => {
    try {
      const res = await apiClient.post('/assignments', data);
      if (res.data) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return { assignments, courses, loading, defaultCourseId, createAssignment };
}
