import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor: string;
  iconColor: string;
  onClick?: () => void;
}

export const MemoizedStatsCard = React.memo(function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  bgColor,
  iconColor,
  onClick
}: StatsCardProps) {
  return (
    <div 
      className={`bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center gap-5 hover:border-sky-300 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`w-14 h-14 ${bgColor} ${iconColor} rounded-2xl flex items-center justify-center rotate-3`}>
        <Icon className="w-8 h-8 fill-current" />
      </div>
      <div>
        <p className="text-sm font-bold text-sky-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-sky-900">
          {value} {subtitle && <span className="text-lg text-sky-400 font-semibold">{subtitle}</span>}
        </p>
      </div>
    </div>
  );
});