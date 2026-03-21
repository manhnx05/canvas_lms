import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../shared/lib/apiClient';

export function useCourseDetail(id: string | undefined) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/courses/${id}`);
      setCourse(res.data);
    } catch (error) {
      console.error("Failed to fetch course details", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return { course, loading, fetchCourse };
}
