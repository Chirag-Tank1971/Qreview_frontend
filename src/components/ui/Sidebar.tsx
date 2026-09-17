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
  LogOut,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';
import { cn } from '../../utils/cn';

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
  const { user, logout } = useAuth();
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
        { id: 'ai_performance', label: 'AI Talent & Review', icon: Sparkles },
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
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-150 z-30 select-none',
          isCollapsed ? 'w-14' : 'w-56',
          className
        )}
      >
        {/* Collapse / Expand Toggle */}
        <div
          className={cn(
            'h-12 flex items-center px-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!isCollapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-[4px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              isViewPermitted(item.id, role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-0.5">
                {!isCollapsed && (
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  const button = (
                    <button
                      key={item.id}
                      onClick={() => onSelectView(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2 py-1.5 text-xs transition-colors cursor-pointer relative',
                        isCollapsed
                          ? 'justify-center rounded-[6px]'
                          : 'rounded-[4px]',
                        isActive
                          ? 'border-l-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500'
                        )}
                      />
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-left">
                          {item.label}
                        </span>
                      )}
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            'inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-medium rounded-[4px] bg-blue-600 text-white shrink-0 tabular-nums',
                            isCollapsed && 'absolute top-1 right-1'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">
                          <span>{item.label}</span>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </div>
            );
          })}
        </div>

        {/* User Footer Summary & Logout */}
        {user && (
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0 space-y-2">
            <div
              className={cn(
                'flex items-center gap-2',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="truncate flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {user.role}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer',
                isCollapsed && 'justify-center'
              )}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
};
