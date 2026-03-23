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
      const [assnRes, coursesRes] = await Promise.all([
        apiClient.get('/assignments'),
        apiClient.get('/courses')
      ]);
      const assnData = assnRes.data;
      const coursesData = coursesRes.data;
      setAssignments(assnData);
      setCourses(coursesData);
      if (coursesData.length > 0) setDefaultCourseId(coursesData[0].id);
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
