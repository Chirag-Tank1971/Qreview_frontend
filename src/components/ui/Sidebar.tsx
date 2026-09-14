import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppView, isViewPermitted } from '../../hooks/useUrlHashView';
import {
  Layers,
  BarChart3,
  FileCheck,
  Award,
  Download,
  Users,
  Target,
  Sparkles,
  Upload,
  Shield,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  className?: string;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  className = '',
}) => {
  const { user, employeeProfile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('appraisal_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('appraisal_sidebar_collapsed', String(next));
      } catch {
        // quiet fallback
      }
      return next;
    });
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Work',
      items: [
        { id: 'portal', label: 'My Workspace', icon: Layers },
        { id: 'management', label: 'Executive Analytics', icon: BarChart3 },
        { id: 'reviews', label: 'Quarterly Reviews', icon: FileCheck },
        { id: 'appraisals', label: 'Appraisal Cycles', icon: Award },
        { id: 'reports', label: 'Reports Center', icon: Download },
      ],
    },
    {
      title: 'People',
      items: [
        { id: 'employees', label: 'Employee Directory', icon: Users },
        { id: 'hierarchy', label: 'Department & Hierarchy', icon: Layers },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { id: 'kras', label: 'KRA Templates', icon: Target },
        { id: 'ai_performance', label: 'AI Copilot & 360', icon: Sparkles },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'bulk', label: 'Bulk Data Tools', icon: Upload },
        { id: 'audit', label: 'Compliance & Audit', icon: Shield },
      ],
    },
  ];

  const role = user?.role;

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 z-30 ${
        isCollapsed ? 'w-18' : 'w-60'
      } ${className}`}
    >
      {/* Sidebar Controls Header */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} px-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            isViewPermitted(item.id, role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}
                    {item.badge !== undefined && (
                      <span
                        className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white shrink-0 ${
                          isCollapsed ? 'absolute top-1 right-1' : ''
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer Summary */}
      {user && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div
            className={`flex items-center gap-2.5 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  {user.role}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
