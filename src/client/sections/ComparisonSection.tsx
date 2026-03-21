import React from 'react';
import { Check, X, Zap } from 'lucide-react';

interface CompareItem {
  feature: string;
  traditional: boolean | string;
  aiSystem: boolean | string;
}

const COMPARISONS: CompareItem[] = [
  { feature: 'Chấm bài tự động', traditional: false, aiSystem: true },
  { feature: 'Nhận xét cá nhân hóa', traditional: false, aiSystem: true },
  { feature: 'Sinh đề theo chủ đề', traditional: 'Hạn chế', aiSystem: true },
  { feature: 'Thống kê tiến độ thời gian thực', traditional: false, aiSystem: true },
  { feature: 'Phát hiện lỗ hổng kiến thức', traditional: false, aiSystem: true },
  { feature: 'Tạo báo cáo chi tiết', traditional: 'Thủ công', aiSystem: 'Tự động' },
  { feature: 'Phản hồi ngay sau làm bài', traditional: false, aiSystem: true },
];

export function ComparisonSection() {
  const renderVal = (val: boolean | string, isAI: boolean) => {
    if (val === true) return <Check className={`w-5 h-5 ${isAI ? 'text-emerald-500' : 'text-emerald-400'}`} />;
    if (val === false) return <X className="w-5 h-5 text-slate-300" />;
    return <span className={`text-xs font-semibold ${isAI ? 'text-sky-600' : 'text-slate-400'}`}>{val}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="font-extrabold text-slate-800 text-lg">AI vs. Truyền thống</h2>
        <span className="text-xs bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full">So sánh</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100">
          <div className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Tính năng</div>
          <div className="py-3 px-4 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase">📋 Truyền thống</p>
          </div>
          <div className="py-3 px-4 text-center bg-sky-50 border-l border-sky-100">
            <p className="text-xs font-bold text-sky-600 uppercase flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 fill-sky-500" />AI Canvas
            </p>
          </div>
        </div>

        {/* Rows */}
        {COMPARISONS.map((item, i) => (
          <div key={i} className={`grid grid-cols-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i === COMPARISONS.length - 1 ? 'border-b-0' : ''}`}>
            <div className="py-3 px-4 text-sm font-semibold text-slate-700">{item.feature}</div>
            <div className="py-3 px-4 flex justify-center items-center">{renderVal(item.traditional, false)}</div>
            <div className="py-3 px-4 flex justify-center items-center bg-sky-50/50">{renderVal(item.aiSystem, true)}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        🤖 Hệ thống AI Canvas LMS – Đánh giá thông minh, tiết kiệm thời gian cho Thầy/Cô
      </p>
    </div>
  );
}
