import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Eye, Download, Play } from 'lucide-react';
import apiClient from '@/src/lib/apiClient';

interface ExamListProps {
  role: 'student' | 'teacher';
}

export const ExamList: React.FC<ExamListProps> = ({ role }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await apiClient.get('/exams');
      const data = res.data;
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) return;
    try {
      await apiClient.delete(`/exams/${id}`);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải danh sách đề thi...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-indigo-600" size={32} /> {role === 'teacher' ? 'Quản Lý Đề Thi' : 'Danh Sách Đề Thi'}
          </h1>
          <p className="text-gray-500 mt-2">{role === 'teacher' ? 'Danh sách các đề thi tự động tạo bởi AI và tải lên.' : 'Các bài thi sẵn có dành cho bạn.'}</p>
        </div>
        {role === 'teacher' && (
          <button
            onClick={() => navigate('/exams/new')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={20} /> Tạo đề thi mới
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Tên đề thi</th>
              <th className="p-4 font-semibold">Môn học</th>
              <th className="p-4 font-semibold">Lớp</th>
              <th className="p-4 font-semibold">Thời gian</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Chưa có đề thi nào.</td>
              </tr>
            ) : (
              exams.map(exam => (
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{exam.title}</td>
                  <td className="p-4 text-gray-600 uppercase text-xs font-bold tracking-wide">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">{exam.subject}</span>
                  </td>
                  <td className="p-4 text-gray-600">Lớp {exam.grade}</td>
                  <td className="p-4 text-gray-600">{exam.duration} Phút</td>
                  <td className="p-4 flex justify-center gap-3">
                    {role === 'student' ? (
                       <button onClick={() => navigate(`/exams/${exam.id}/take`)} className="flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 font-medium px-3 py-1 rounded-md transition" title="Làm bài">
                         <Play size={16} /> Làm bài
                       </button>
                    ) : (
                      <>
                        <button onClick={() => navigate(`/exams/${exam.id}`)} className="text-blue-500 hover:text-blue-700 focus:outline-none p-1 rounded hover:bg-blue-50" title="Xem & In">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => deleteExam(exam.id)} className="text-red-500 hover:text-red-700 focus:outline-none p-1 rounded hover:bg-red-50" title="Xóa">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
