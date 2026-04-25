import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isSidebarCollapsed: boolean;
}

export const MemoizedNavItem = React.memo(function NavItem({ 
  icon: Icon, 
  label, 
  path, 
  isSidebarCollapsed 
}: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 font-semibold group ${
        isActive 
          ? 'bg-sky-500 text-white shadow-md shadow-sky-200 lg:translate-y-[-2px]' 
          : 'text-sky-700 hover:bg-sky-100'
      }`}
      title={isSidebarCollapsed ? label : undefined}
    >
      <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'text-sky-500'}`} />
      {!isSidebarCollapsed && <span className="ml-3 hidden lg:block text-[15px] truncate">{label}</span>}
    </Link>
  );
});