import React, { useState } from 'react';
import { Brain, TrendingUp, BarChart2, MessageCircle, Filter, Upload, Plus, Settings, Zap } from 'lucide-react';
import { QuizSystem } from '../components/quiz/QuizSystem';
import { QuizFilterModal, QuizFilters } from '../components/quiz/QuizFilterModal';
import { QuizUploadModal } from '../components/quiz/QuizUploadModal';
import { ProgressDashboard } from '../components/stats/ProgressDashboard';
import { ScoringStatistics } from '../components/stats/ScoringStatistics';
import { AiChatSection } from '../sections/AiChatSection';
import { ComparisonSection } from '../sections/ComparisonSection';

interface EvaluationHubProps {
  role: string;
}

type Tab = 'quiz' | 'progress' | 'stats' | 'chat' | 'compare';

const TABS = [
  { id: 'quiz' as Tab, label: 'Làm Quiz', icon: Brain, color: 'text-indigo-600' },
  { id: 'progress' as Tab, label: 'Tiến độ', icon: TrendingUp, color: 'text-sky-600' },
  { id: 'stats' as Tab, label: 'Thống kê', icon: BarChart2, color: 'text-emerald-600' },
  { id: 'chat' as Tab, label: 'Hỏi AI', icon: MessageCircle, color: 'text-amber-600' },
  { id: 'compare' as Tab, label: 'So sánh', icon: Zap, color: 'text-rose-600' },
];

const TOPICS = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Lịch sử', 'Địa lý', 'Đạo đức'];

export function EvaluationHub({ role }: EvaluationHubProps) {
  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');
  
  // Tab state: allow ?tab= from URL
  const urlTab = new URLSearchParams(window.location.search).get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(urlTab || 'quiz');
  
  // Quiz config
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [filters, setFilters] = useState<QuizFilters>({ difficulty: 'all', topic: '', questionType: 'all', numQuestions: 5 });
  
  // Modals
  const [showFilter, setShowFilter] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const topic = customTopic || selectedTopic;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            Trung tâm Đánh giá AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">Làm quiz, theo dõi tiến độ và nhận nhận xét từ AI giáo viên</p>
        </div>
        {/* Teacher-only: create quiz + comparative tools */}
        {role === 'teacher' && (
          <div className="flex gap-2">
            <div className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" /> Chế độ giáo viên
            </div>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-5">
          {/* Quiz config header */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-700">⚙️ Cấu hình bài kiểm tra</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilter(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-600 px-3 py-1.5 rounded-xl hover:bg-sky-50 border border-slate-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />Lọc
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-600 px-3 py-1.5 rounded-xl hover:bg-sky-50 border border-slate-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />Tải lên
                </button>
              </div>
            </div>

            {/* Topic selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Chọn chủ đề</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button
                    key={t}
                    onClick={() => { setSelectedTopic(t); setCustomTopic(''); }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selectedTopic === t && !customTopic
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <button
                  onClick={() => { setSelectedTopic(''); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-600 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />Tự nhập
                </button>
              </div>
            </div>

            {/* Custom topic */}
            {!selectedTopic && (
              <input
                type="text"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                placeholder="Nhập chủ đề tùy chỉnh... (ví dụ: Phép nhân có nhớ)"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-400 outline-none"
              />
            )}

            {/* Filters summary */}
            {filters.difficulty !== 'all' && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-xl px-3 py-2">
                <Filter className="w-3.5 h-3.5" />
                Lọc: <strong>{filters.difficulty}</strong>
                {filters.topic && <> · Môn: <strong>{filters.topic}</strong></>}
                · <strong>{filters.numQuestions} câu</strong>
              </div>
            )}
          </div>

          {/* Quiz Component */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <QuizSystem
              questions={questions.length > 0 ? questions : undefined}
              topic={topic || undefined}
              studentName={currentUser.name}
              onComplete={(result) => {
                console.log('Quiz complete:', result);
              }}
            />
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <ProgressDashboard userId={currentUser.id} role={role} />
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <ScoringStatistics userId={currentUser.id} />
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <AiChatSection studentName={currentUser.name} />
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <ComparisonSection />
        </div>
      )}

      {/* Modals */}
      <QuizFilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        currentFilters={filters}
        onApply={setFilters}
      />
      <QuizUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onQuestionsLoaded={setQuestions}
      />
    </div>
  );
}
