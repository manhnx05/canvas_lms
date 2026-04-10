import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import apiClient from '@/src/lib/apiClient';
import { Course } from '@/src/types';

export function useCourses() {
  const queryClient = useQueryClient();

  // 1. Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await apiClient.get('/courses');
      return res.data;
    },
  });

  // 2. Create course
  const createMutation = useMutation({
    mutationFn: async (newCourse: Partial<Course>) => {
      const res = await apiClient.post('/courses', newCourse);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Đã tạo lớp học thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Lỗi khi tạo lớp học');
    },
  });

  // 3. Update course
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Course> & { id: string }) => {
      const res = await apiClient.put(`/courses/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Đã cập nhật thông tin lớp học!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Lỗi khi cập nhật lớp học');
    },
  });

  // 4. Delete course
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/courses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Đã xóa lớp học thành công!');
    },
    onError: (error: any) => {
      // Ignore 404 since it means already deleted
      if (error?.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else {
        toast.error(error?.response?.data?.message || error.message || 'Lỗi khi xóa lớp học');
      }
    },
  });

  return {
    courses,
    isLoading,
    createCourse: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCourse: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCourse: deleteMutation.mutateAsync,
    isDeletingId: deleteMutation.isPending ? deleteMutation.variables : null,
  };
}
