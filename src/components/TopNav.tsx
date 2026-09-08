import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Award, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Users, 
  Shield, 
  Upload, 
  Sparkles,
  Settings,
  ChevronDown,
  Check,
  Grid,
} from 'lucide-react';

interface SidebarNavProps {
  currentView: string;
  onSelectView: (view: any) => void;
  userRole?: string;
  onOpenMobileMenu?: () => void;
}

export const TopNav: React.FC<SidebarNavProps> = ({ currentView, onSelectView, userRole, onOpenMobileMenu }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close admin dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAdminOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Primary Workspaces
  const primaryNavItems = [
    { 
      id: 'portal', 
      label: 'My Space', 
      icon: User, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'] 
    },
    { 
      id: 'reviews', 
      label: userRole === 'EMPLOYEE' ? 'My Reviews' : 'Team Reviews', 
      icon: Award, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'] 
    },
    { 
      id: 'appraisals', 
      label: 'Appraisals', 
      icon: TrendingUp, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'MANAGEMENT'] 
    },
    { 
      id: 'ai_performance', 
      label: 'AI & 360', 
      icon: Sparkles, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'], 
      isAiBadge: true 
    },
    { 
      id: 'reports', 
      label: 'Analytics', 
      icon: BarChart3, 
      roles: ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'] 
    },
  ];

  // Admin & System Settings items
  const adminNavItems = [
    { 
      id: 'employees', 
      label: 'Employee Directory', 
      subtitle: 'Organization hierarchy & profiles',
      icon: Users, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGEMENT'] 
    },
    { 
      id: 'kras', 
      label: 'Goal Templates (KRAs)', 
      subtitle: 'Standard metrics & evaluation criteria',
      icon: Target, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD'] 
    },
    { 
      id: 'bulk', 
      label: 'Bulk Data Manager', 
      subtitle: 'Import or export Excel/CSV files',
      icon: Upload, 
      roles: ['SUPER_ADMIN', 'HR'] 
    },
    { 
      id: 'audit', 
      label: 'Compliance & Audit Trail', 
      subtitle: 'Security logs & change history',
      icon: Shield, 
      roles: ['SUPER_ADMIN', 'HR', 'MANAGEMENT'] 
    },
  ];

  const visiblePrimary = primaryNavItems.filter((item) => !userRole || item.roles.includes(userRole));
  const visibleAdmin = adminNavItems.filter((item) => !userRole || item.roles.includes(userRole));

  const isCurrentViewAdmin = visibleAdmin.some((item) => item.id === currentView);
  const activeAdminItem = visibleAdmin.find((item) => item.id === currentView);

  return (
    <>
      {/* 1. Desktop Top Navigation Bar (Hidden on Mobile screens < md) */}
      <div className="hidden md:block bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 w-full shrink-0 sticky top-16 z-30 py-2.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-2 p-1 bg-slate-100/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            {/* Primary Navigation Workspaces */}
            <div className="flex items-center gap-1.5 overflow-x-auto top-nav-scrollbar-hide overscroll-x-contain py-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style dangerouslySetInnerHTML={{__html: `.top-nav-scrollbar-hide::-webkit-scrollbar { display: none; }`}} />
              {visiblePrimary.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsAdminOpen(false);
                      onSelectView(item.id);
                    }}
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-indigo-950 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors ${
                      isActive 
                        ? (item.isAiBadge ? 'text-violet-600 dark:text-violet-400' : 'text-indigo-600 dark:text-indigo-400') 
                        : (item.isAiBadge ? 'text-violet-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200')
                    }`} />
                    <span>{item.label}</span>
                    {item.isAiBadge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        isActive ? 'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300' : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                      }`}>
                        Gemini
                      </span>
                    )}
                    {isActive && !item.isAiBadge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Admin & Setup Dropdown */}
            {visibleAdmin.length > 0 && (
              <div className="relative shrink-0" ref={adminDropdownRef}>
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isCurrentViewAdmin
                      ? 'bg-white dark:bg-slate-800 text-indigo-950 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                  title="System administration and configuration tools"
                >
                  <Settings className={`w-3.5 h-3.5 transition-colors ${
                    isCurrentViewAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`} />
                  <span>Admin & Setup</span>
                  {isCurrentViewAdmin && activeAdminItem && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      {activeAdminItem.label.split(' ')[0]}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                    isAdminOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {isAdminOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        System Administration
                      </span>
                    </div>
                    <div className="space-y-1">
                      {visibleAdmin.map((item) => {
                        const Icon = item.icon;
                        const isSelected = currentView === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setIsAdminOpen(false);
                              onSelectView(item.id);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-950 dark:text-white'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight">
                                  {item.label}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                  {item.subtitle}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* 2. Mobile Bottom Navigation Bar (Visible only on Mobile screens < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors duration-200">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: My Space */}
          <button
            onClick={() => onSelectView('portal')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'portal'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${currentView === 'portal' ? 'bg-indigo-50 dark:bg-indigo-950/60 shadow-2xs' : ''}`}>
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-tight">My Space</span>
          </button>

          {/* Tab 2: Reviews */}
          <button
            onClick={() => onSelectView('reviews')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'reviews'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${currentView === 'reviews' ? 'bg-indigo-50 dark:bg-indigo-950/60 shadow-2xs' : ''}`}>
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-tight">Reviews</span>
          </button>

          {/* Tab 3: Appraisals (or Analytics for employee) */}
          {userRole !== 'EMPLOYEE' ? (
            <button
              onClick={() => onSelectView('appraisals')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentView === 'appraisals'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${currentView === 'appraisals' ? 'bg-indigo-50 dark:bg-indigo-950/60 shadow-2xs' : ''}`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium leading-tight">Appraisals</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectView('reports')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentView === 'reports'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${currentView === 'reports' ? 'bg-indigo-50 dark:bg-indigo-950/60 shadow-2xs' : ''}`}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium leading-tight">Analytics</span>
            </button>
          )}

          {/* Tab 4: AI & 360 */}
          <button
            onClick={() => onSelectView('ai_performance')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'ai_performance'
                ? 'text-violet-600 dark:text-violet-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${currentView === 'ai_performance' ? 'bg-violet-50 dark:bg-violet-950/60 shadow-2xs' : ''}`}>
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-[10px] font-medium leading-tight">AI & 360</span>
          </button>

          {/* Tab 5: Menu / Admin */}
          <button
            onClick={onOpenMobileMenu}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
              isCurrentViewAdmin
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="All Workspaces & Administration"
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isCurrentViewAdmin ? 'bg-indigo-50 dark:bg-indigo-950/60 shadow-2xs' : ''}`}>
              <Grid className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-tight truncate max-w-[55px]">
              {isCurrentViewAdmin && activeAdminItem ? activeAdminItem.label.split(' ')[0] : 'Menu'}
            </span>
            {isCurrentViewAdmin && (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
