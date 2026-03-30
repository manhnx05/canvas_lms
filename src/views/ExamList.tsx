import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Eye, Play, CheckCircle2, Clock } from 'lucide-react';
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
      setExams(res.data);
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

      {role === 'student' ? (
        /* === STUDENT CARD VIEW === */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">Chưa có đề thi nào được giao.</div>
          )}
          {exams.map(exam => {
            const myAttempt = exam.myAttempt;
            const isDone = myAttempt?.status === 'completed';
            const totalQ = exam.questions?.length ?? 0;
            // score from DB is already on totalScore scale; convert to /10
            const rawScore = myAttempt?.score ?? null;
            const scoreOn10 = rawScore !== null && exam.totalScore > 0
              ? Math.round((rawScore / exam.totalScore) * 100) / 10
              : null;

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl border-2 shadow-sm flex flex-col transition-all hover:shadow-md ${isDone ? 'border-emerald-200' : 'border-indigo-100 hover:border-indigo-300'}`}
              >
                {/* Card Header */}
                <div className={`rounded-t-xl p-5 ${isDone ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest">{exam.subject}</span>
                    {isDone ? (
                      <span className="flex items-center gap-1 bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Đã hoàn thành
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        <Clock size={12} /> Chưa làm
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-extrabold text-lg mt-2 leading-tight">{exam.title}</h3>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex gap-3 text-sm text-gray-500 font-medium">
                    <span>📚 Lớp {exam.grade}</span>
                    <span>⏱ {exam.duration} phút</span>
                    <span>📝 {totalQ} câu</span>
                  </div>

                  {isDone && scoreOn10 !== null && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-around text-center">
                      <div>
                        <p className="text-xs text-emerald-500 font-bold">Điểm</p>
                        <p className="text-2xl font-black text-emerald-700">{scoreOn10.toFixed(1)}<span className="text-xs font-normal text-emerald-400">/10</span></p>
                      </div>
                      <div className="w-px bg-emerald-200" />
                      <div>
                        <p className="text-xs text-emerald-500 font-bold">Nộp lúc</p>
                        <p className="text-xs font-bold text-emerald-700">{myAttempt?.endTime ? new Date(myAttempt.endTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }) : '--'}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/exams/${exam.id}/take`)}
                    className={`mt-auto w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                    }`}
                  >
                    {isDone ? <><CheckCircle2 size={18} /> Xem Lại Bài Làm</> : <><Play size={18} /> Làm Bài Ngay</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* === TEACHER TABLE VIEW === */
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
                      <button onClick={() => navigate(`/exams/${exam.id}`)} className="text-blue-500 hover:text-blue-700 focus:outline-none p-1 rounded hover:bg-blue-50" title="Xem & In">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => deleteExam(exam.id)} className="text-red-500 hover:text-red-700 focus:outline-none p-1 rounded hover:bg-red-50" title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
