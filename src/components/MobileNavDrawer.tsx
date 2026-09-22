import React from 'react';
import { createPortal } from 'react-dom';
import {
  User as UserIcon,
  Shield,
  Sparkles,
  X,
  LogOut,
  Moon,
  Sun,
  Check,
  Building2,
  Briefcase,
  Layers,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { NAV_ITEMS, getNavLabel, getNavSubtitle, isNavItemVisible } from '../config/navigation';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
}) => {
  const { isMounted, handleClose, handleBackdropClick, backdropClass, drawerLeftClass } = useModalAnimation({
    isOpen,
    onClose,
  });

  const { user, employeeProfile, logout, switchRole, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isMounted) return null;
  if (typeof document === 'undefined') return null;

  const userRole = user?.role;

  const roleConfigs: Record<
    UserRole,
    { label: string; icon: React.ComponentType<{ className?: string }>; badgeColor: string }
  > = {
    SUPER_ADMIN: { label: 'Super Admin', icon: Shield, badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    HR: { label: 'HR Manager', icon: UserCheck, badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    MANAGER: { label: 'Reporting Manager', icon: Briefcase, badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    REPORTING_MANAGER: { label: 'Reporting Manager', icon: Briefcase, badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    HOD: { label: 'Dept Head (HOD)', icon: Building2, badgeColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    EMPLOYEE: { label: 'Employee (ESS)', icon: Layers, badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    MANAGEMENT: { label: 'Executive Management', icon: Sparkles, badgeColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  };

  const currentRoleConfig = user ? roleConfigs[user.role] : roleConfigs.EMPLOYEE;
  const RoleIcon = currentRoleConfig.icon;

  // Both lists derive from the shared NAV_ITEMS registry (frontend/src/config/navigation.ts)
  // instead of hand-duplicating labels/icons/roles here — see that file's header comment for why.
  const visibleNavItems = NAV_ITEMS.filter((item) => isNavItemVisible(item, userRole));
  const primaryNavItems = visibleNavItems.filter((item) => item.mobileSection === 'primary');
  const adminNavItems = visibleNavItems.filter((item) => item.mobileSection === 'admin');

  const quickPersonas = [
    { role: 'SUPER_ADMIN' as UserRole, name: 'System Admin', title: 'Admin', userId: 'usr_sa' },
    { role: 'HR' as UserRole, name: 'HR Manager', title: 'HR', userId: 'usr_mgr_hr' },
    { role: 'MANAGER' as UserRole, name: 'Dave Manager', title: 'Manager', userId: 'usr_mgr_eng' },
    { role: 'HOD' as UserRole, name: 'Alice HOD', title: 'HOD', userId: 'usr_hod_eng' },
    { role: 'EMPLOYEE' as UserRole, name: 'Grace Engineer', title: 'Employee', userId: 'usr_com_1' },
  ];

  const visiblePrimary = primaryNavItems;
  const visibleAdmin = adminNavItems;

  const handleNavClick = (viewId: string) => {
    onSelectView(viewId);
    handleClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] flex bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs ${backdropClass}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-[85vw] max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden ${drawerLeftClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                MintReview System
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Navigation
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Card in Drawer */}
        {user && (
          <div className="p-3 bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-medium text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <RoleIcon className="w-2.5 h-2.5" />
                  {currentRoleConfig.label}
                </span>
              </div>
            </div>

            {/* Dark mode button inside user row */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-[4px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
          </div>
        )}

        {/* Nav Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Primary Workspaces */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspaces
            </div>
            <div className="space-y-1">
              {visiblePrimary.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-[4px] text-left transition-colors cursor-pointer ${isActive
                        ? 'border-l-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-medium leading-tight flex items-center gap-1.5">
                          <span>{getNavLabel(item, userRole)}</span>
                          {item.isAiBadge && (
                            <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded-[4px] uppercase ${isActive ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                              AI
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {getNavSubtitle(item, userRole)}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin & Setup (if eligible) */}
          {visibleAdmin.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Administration & Setup
              </div>
              <div className="space-y-0.5">
                {visibleAdmin.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-[4px] text-left transition-colors cursor-pointer ${isActive
                          ? 'border-l-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <div>
                          <div className="text-xs font-medium leading-tight">{getNavLabel(item, userRole)}</div>
                          <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                            {getNavSubtitle(item, userRole)}
                          </div>
                        </div>
                      </div>
                      {isActive ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Persona Demo Switcher (Development/Demo only) */}
          {(!import.meta.env.PROD || import.meta.env.VITE_ENABLE_DEMO_PERSONAS === 'true') && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Quick Role Switch</span>
                <span className="text-[9px] text-indigo-500 font-semibold">Demo</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {quickPersonas.map((p) => {
                  const isCurrent = user?.role === p.role;
                  return (
                    <button
                      key={p.role}
                      onClick={() => {
                        switchRole(p.role, p.userId);
                        handleClose();
                      }}
                      disabled={isLoading}
                      className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold border transition-all cursor-pointer ${isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      <div className="truncate font-bold">{p.title}</div>
                      <div className="text-[9px] text-slate-400 truncate">{p.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <button
            onClick={() => {
              handleClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
