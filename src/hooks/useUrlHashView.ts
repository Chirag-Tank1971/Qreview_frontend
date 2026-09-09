import { useState, useEffect, useCallback } from 'react';

export type AppView =
  | 'portal'
  | 'ai_performance'
  | 'appraisals'
  | 'reviews'
  | 'kras'
  | 'employees'
  | 'reports'
  | 'bulk'
  | 'audit'
  | 'notifications'
  | 'overview';

const VALID_VIEWS: AppView[] = [
  'portal',
  'ai_performance',
  'appraisals',
  'reviews',
  'kras',
  'employees',
  'reports',
  'bulk',
  'audit',
  'notifications',
  'overview',
];

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
