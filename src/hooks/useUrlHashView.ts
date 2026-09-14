import { useState, useEffect, useCallback } from 'react';

export type AppView =
  | 'portal'
  | 'management'
  | 'ai_performance'
  | 'appraisals'
  | 'reviews'
  | 'kras'
  | 'employees'
  | 'hierarchy'
  | 'reports'
  | 'bulk'
  | 'audit'
  | 'notifications';

const VALID_VIEWS: AppView[] = [
  'portal',
  'management',
  'ai_performance',
  'appraisals',
  'reviews',
  'kras',
  'employees',
  'hierarchy',
  'reports',
  'bulk',
  'audit',
  'notifications',
];

export const ROLE_ALLOWED_VIEWS: Record<string, AppView[]> = {
  SUPER_ADMIN: ['portal', 'reviews', 'appraisals', 'ai_performance', 'reports', 'employees', 'hierarchy', 'kras', 'bulk', 'audit', 'notifications'],
  MANAGEMENT: ['management', 'reports', 'hierarchy', 'notifications', 'portal'],
  HR: ['portal', 'reviews', 'appraisals', 'reports', 'employees', 'hierarchy', 'kras', 'bulk', 'audit', 'notifications'],
  HOD: ['portal', 'reviews', 'appraisals', 'reports', 'hierarchy', 'notifications'],
  REPORTING_MANAGER: ['portal', 'reviews', 'appraisals', 'notifications'],
  MANAGER: ['portal', 'reviews', 'appraisals', 'notifications'],
  EMPLOYEE: ['portal', 'reviews', 'notifications'],
};

export function isViewPermitted(view: AppView, role?: string): boolean {
  if (!role) return true;
  const allowed = ROLE_ALLOWED_VIEWS[role];
  return allowed ? allowed.includes(view) : true;
}

function getInitialView(): AppView {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (VALID_VIEWS.includes(hash as AppView)) {
    return hash as AppView;
  }
  return 'portal';
}

export function useUrlHashView() {
  const [currentView, setCurrentViewState] = useState<AppView>(getInitialView);

  // Sync hash when view changes
  const setView = useCallback((view: AppView, replaceHistory = false) => {
    setCurrentViewState(view);
    const newHash = `#${view}`;
    if (window.location.hash !== newHash) {
      if (replaceHistory) {
        window.history.replaceState(null, '', newHash);
      } else {
        window.history.pushState(null, '', newHash);
      }
    }
  }, []);

  // Listen to browser Back/Forward (popstate/hashchange)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (VALID_VIEWS.includes(hash as AppView)) {
        setCurrentViewState(hash as AppView);
      } else {
        setCurrentViewState('portal');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  return { currentView, setView };
}
