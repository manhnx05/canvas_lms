import { useState, useEffect, useCallback } from 'react';
import { ScanLine, Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EnrollmentInfo {
  id: string;
  plickerCardId: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    className: string | null;
    avatar: string | null;
  }
}

export function PlickersCardTab({ courseId }: { courseId: string }) {
  const [enrollments, setEnrollments] = useState<EnrollmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`);
      const json = await res.json();
      if (json.data) {
        setEnrollments(json.data.filter((e: EnrollmentInfo) => e.user.email !== 'teacher@example.com')); // filter out teacher if mixed
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
      toast.error('Lỗi khi tải danh sách học sinh');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const autoAssignCards = async () => {
    if (!confirm('Bạn có muốn tự động gán mã thẻ (1-40) theo thứ tự Alphabet cho toàn bộ lớp không? Dữ liệu cũ sẽ bị đè.')) return;
    
    // Sort alphabet naturally
    const sorted = [...enrollments].sort((a, b) => a.user.name.localeCompare(b.user.name));
    
    let successCount = 0;
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const cardId = i + 1; // 1-indexed

      try {
        await fetch(`/api/courses/${courseId}/enrollments`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollmentId: e.id, plickerCardId: cardId })
        });
        successCount++;
        // Update local state without full reload
        setEnrollments(prev => prev.map(p => p.id === e.id ? { ...p, plickerCardId: cardId } : p));
      } catch (error) {
        console.error('Error updating card:', error);
      }
    }
    toast.success(`Đã tự động gán thẻ cho ${successCount} học sinh`);
  };

  const updateCard = async (enrollmentId: string, cardIdStr: string) => {
    const cardId = cardIdStr ? parseInt(cardIdStr) : null;
    setSavingId(enrollmentId);
    
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, plickerCardId: cardId })
      });
      if (res.ok) {
        setEnrollments(prev => prev.map(p => p.id === enrollmentId ? { ...p, plickerCardId: cardId } : p));
        toast.success('Đã lưu mã thẻ');
      } else {
        toast.error('Lỗi khi lưu mã thẻ');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="py-20 flex justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ScanLine className="w-5 h-5 text-indigo-500" />
            Quản lý thẻ Plickers
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gán số thẻ in trên bộ Plickers (1-40) cho từng học sinh trong lớp.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadEnrollments} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={autoAssignCards} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm border-2 border-indigo-200">
            Tự động gán (A-Z)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden line-clamp-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-sm text-slate-500 font-bold">
              <th className="px-6 py-4">Học Sinh</th>
              <th className="px-6 py-4">Thẻ Plickers (1-40)</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrollments.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Chưa có học sinh trong lớp</td></tr>
            ) : (
              enrollments.map((env) => (
                <tr key={env.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={env.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="avt" className="w-10 h-10 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-800">{env.user.name}</p>
                        <p className="text-xs text-slate-500">{env.user.email} {env.user.className ? `• Lớp ${env.user.className}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      min="1" max="40"
                      className="w-24 text-center px-3 py-2 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-400 font-bold text-indigo-700 bg-slate-50 focus:bg-white transition-all"
                      placeholder="Trống"
                      defaultValue={env.plickerCardId || ''}
                      onBlur={(e) => updateCard(env.id, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {savingId === env.id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Lưu...</span>
                    ) : env.plickerCardId ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 font-bold rounded-lg"><Save className="w-3.5 h-3.5" /> Đã lưu thẻ {env.plickerCardId}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-500 bg-rose-50 px-3 py-1.5 font-bold rounded-lg border border-rose-200">Chưa xếp thẻ</span>
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
}
