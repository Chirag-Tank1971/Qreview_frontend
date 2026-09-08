import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { TopNav } from './components/TopNav';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { ForcePasswordChangeScreen } from './components/ForcePasswordChangeScreen';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { ViewSkeletonFallback } from './components/ui/ViewSkeletonFallback';
import { useMasterData } from './hooks/useMasterData';
import { useUrlHashView, AppView } from './hooks/useUrlHashView';
import { Loader2 } from 'lucide-react';
import { KraTemplate } from './types';
import { ReviewViewConfig } from './components/QuarterlyReviewView';
import { AppraisalViewConfig } from './components/AppraisalManagementView';
import { EmployeePortalConfig } from './components/EmployeePortalView';
import { ReportsViewConfig } from './components/ReportsCenterView';

// Route-level code splitting: Lazy load heavy domain views
const EmployeePortalView = lazy(() =>
  import('./components/EmployeePortalView').then((m) => ({ default: m.EmployeePortalView }))
);
const QuarterlyReviewView = lazy(() =>
  import('./components/QuarterlyReviewView').then((m) => ({ default: m.QuarterlyReviewView }))
);
const AppraisalManagementView = lazy(() =>
  import('./components/AppraisalManagementView').then((m) => ({ default: m.AppraisalManagementView }))
);
const ReportsCenterView = lazy(() =>
  import('./components/ReportsCenterView').then((m) => ({ default: m.ReportsCenterView }))
);
const EmployeeDirectory = lazy(() =>
  import('./components/EmployeeDirectory').then((m) => ({ default: m.EmployeeDirectory }))
);
const KraManagementView = lazy(() =>
  import('./components/KraManagementView').then((m) => ({ default: m.KraManagementView }))
);
const AiPerformanceHub = lazy(() =>
  import('./components/AiPerformanceHub').then((m) => ({ default: m.AiPerformanceHub }))
);
const BulkImportExportManager = lazy(() =>
  import('./components/BulkImportExportManager').then((m) => ({ default: m.BulkImportExportManager }))
);
const AuditComplianceExplorer = lazy(() =>
  import('./components/AuditComplianceExplorer').then((m) => ({ default: m.AuditComplianceExplorer }))
);

// Modals lazy loaded on demand
const KraTemplateBuilderModal = lazy(() =>
  import('./components/KraTemplateBuilderModal').then((m) => ({ default: m.KraTemplateBuilderModal }))
);
const KraLibraryModal = lazy(() =>
  import('./components/KraLibraryModal').then((m) => ({ default: m.KraLibraryModal }))
);

const VIEW_META: Record<string, { title: string; subtitle: string; tag: string; tagColor: string }> = {
  portal: {
    title: 'My Space & Performance Goals',
    subtitle: 'Track your quarterly performance, complete self-reviews, and view your digital appraisal letter',
    tag: 'Personal Workspace',
    tagColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  },
  reviews: {
    title: 'Performance Reviews',
    subtitle: 'Review quarterly goals, provide ratings and feedback, and track team progress',
    tag: 'Evaluation Cycle',
    tagColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
  },
  appraisals: {
    title: 'Annual Appraisals & Calibrations',
    subtitle: 'Manage yearly appraisal cycles, salary calibrations, promotion reviews, and letter generation',
    tag: 'Annual Calibration',
    tagColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
  },
  reports: {
    title: 'Analytics & Reports',
    subtitle: 'Monitor review completion rates, department performance trends, and rating distributions',
    tag: 'Executive Reports',
    tagColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
  },
  employees: {
    title: 'Employee Directory',
    subtitle: 'Search team members, view reporting managers, and browse department structures',
    tag: 'Team Directory',
    tagColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
  },
  kras: {
    title: 'Goals & KRA Template Library',
    subtitle: 'Browse and configure Key Result Area templates and evaluation criteria by role',
    tag: 'Goal Templates',
    tagColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  },
  ai_performance: {
    title: 'AI Copilot & 360 Feedback',
    subtitle: 'Generate AI-assisted review summaries, share continuous kudos, and track growth plans',
    tag: 'AI Assisted',
    tagColor: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60',
  },
  bulk: {
    title: 'Bulk Data Management',
    subtitle: 'Import employee lists or download spreadsheet exports for reviews and salary records',
    tag: 'Data Tools',
    tagColor: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/60',
  },
  audit: {
    title: 'Compliance & Audit Trail',
    subtitle: 'Review tamper-evident change history, sign-offs, and administrative security logs',
    tag: 'Security & Audit',
    tagColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
  },
};

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Synchronized URL Hash Navigation
  const { currentView, setView } = useUrlHashView();

  // View-specific configurations for direct workflow navigation
  const [appraisalConfig, setAppraisalConfig] = useState<AppraisalViewConfig | null>(null);
  const [reviewConfig, setReviewConfig] = useState<ReviewViewConfig | null>(null);
  const [reportsConfig, setReportsConfig] = useState<ReportsViewConfig | null>(null);
  const [portalConfig, setPortalConfig] = useState<EmployeePortalConfig | null>(null);

  // Centralized Master Data via Custom Hook
  const {
    templates,
    kras,
    departments,
    designations,
    employees,
    cycles,
    saveTemplate,
    saveKra,
  } = useMasterData(isAuthenticated);

  // KRA Modals State
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [isKraLibraryOpen, setIsKraLibraryOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<KraTemplate | null>(null);

  const canManageKras = user?.role === 'SUPER_ADMIN' || user?.role === 'HR' || user?.role === 'HOD';

  const handleNavigate = (tab: string, options?: any) => {
    setAppraisalConfig(tab === 'appraisals' ? options || null : null);
    setReviewConfig(tab === 'reviews' ? options || null : null);
    setReportsConfig(tab === 'reports' ? options || null : null);
    setPortalConfig(tab === 'portal' ? options || null : null);
    setView(tab as AppView);
  };

  // Auto-switch to portal if user is an employee, and reset all view configs when switching roles
  useEffect(() => {
    setReviewConfig(null);
    setAppraisalConfig(null);
    setReportsConfig(null);
    setPortalConfig(null);
    if (user?.role === 'EMPLOYEE') {
      setView('portal', true);
    }
  }, [user?.id, user?.role, setView]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center border border-indigo-500/20">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
            Initializing Session & Security Tokens...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If logged in but must change password — show gate screen, block the whole app
  if (user?.mustChangePassword) {
    return <ForcePasswordChangeScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Header */}
      <Header
        onNavigate={handleNavigate}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
      />

      {/* Mobile Slide-Over Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentView={currentView}
        onSelectView={handleNavigate}
      />

      <div className="flex flex-col flex-1">
        {/* Top Navigation */}
        <TopNav
          currentView={currentView}
          onSelectView={(v) => {
            setReviewConfig(null);
            setAppraisalConfig(null);
            setReportsConfig(null);
            setPortalConfig(null);
            setView(v as AppView);
          }}
          userRole={user?.role}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-12 overflow-x-hidden">
          {/* View Context Banner */}
          {VIEW_META[currentView] && (
            <div className="mb-4 sm:mb-6 p-3.5 sm:p-5 bg-white/75 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {VIEW_META[currentView].title}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${VIEW_META[currentView].tagColor}`}>
                    {VIEW_META[currentView].tag}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {VIEW_META[currentView].subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  Role: <strong className="text-slate-900 dark:text-white">{user?.role}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Lazy loaded domain view with fallback */}
          <Suspense fallback={<ViewSkeletonFallback />}>
            {currentView === 'portal' ? (
              <EmployeePortalView
                onNavigateToAppraisals={(opts) => handleNavigate('appraisals', opts)}
                onNavigateToReviews={(opts) => handleNavigate('reviews', opts)}
                initialConfig={portalConfig}
              />
            ) : currentView === 'ai_performance' ? (
              <AiPerformanceHub currentUser={user} />
            ) : currentView === 'appraisals' ? (
              <AppraisalManagementView
                currentUser={user}
                departments={departments}
                cycles={cycles}
                designations={designations}
                initialConfig={appraisalConfig}
                onClearInitialConfig={() => setAppraisalConfig(null)}
              />
            ) : currentView === 'reviews' ? (
              <QuarterlyReviewView
                currentUser={user}
                departments={departments}
                cycles={cycles}
                employees={employees}
                initialConfig={reviewConfig}
                onClearInitialConfig={() => setReviewConfig(null)}
              />
            ) : currentView === 'reports' ? (
              <ReportsCenterView
                departments={departments}
                cycles={cycles}
                initialConfig={reportsConfig}
              />
            ) : currentView === 'bulk' ? (
              <BulkImportExportManager />
            ) : currentView === 'audit' ? (
              <AuditComplianceExplorer currentUser={user} />
            ) : currentView === 'kras' ? (
              <KraManagementView
                templates={templates}
                kras={kras}
                departments={departments}
                designations={designations}
                employees={employees}
                canManage={canManageKras}
                onOpenCreateTemplate={() => {
                  setEditingTemplate(null);
                  setIsTemplateBuilderOpen(true);
                }}
                onOpenEditTemplate={(tmpl) => {
                  setEditingTemplate(tmpl);
                  setIsTemplateBuilderOpen(true);
                }}
                onOpenLibrary={() => setIsKraLibraryOpen(true)}
              />
            ) : (
              <EmployeeDirectory
                currentUser={user}
                departments={departments}
                designations={designations}
                cycles={cycles}
                kraTemplates={templates}
                onNavigateToAppraisals={(opts) => handleNavigate('appraisals', opts)}
                onNavigateToReviews={(opts) => handleNavigate('reviews', opts)}
                initialConfig={portalConfig}
                employees={employees}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* KRA Modals with Suspense */}
      <Suspense fallback={null}>
        {isTemplateBuilderOpen && (
          <KraTemplateBuilderModal
            template={editingTemplate}
            departments={departments}
            designations={designations}
            kraLibrary={kras}
            onSave={saveTemplate}
            onClose={() => {
              setIsTemplateBuilderOpen(false);
              setEditingTemplate(null);
            }}
            onOpenLibrary={() => {
              setIsTemplateBuilderOpen(false);
              setIsKraLibraryOpen(true);
            }}
          />
        )}

        {isKraLibraryOpen && (
          <KraLibraryModal
            kras={kras}
            departments={departments}
            canEdit={canManageKras}
            onSaveKra={saveKra}
            onClose={() => setIsKraLibraryOpen(false)}
          />
        )}
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-4 mt-auto mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Performance & Appraisal Management</span>
            <span className="text-slate-400">•</span>
            <span>Enterprise Edition</span>
          </div>
          <div>
            <span>Quarterly Cycles • Calibration • Audit Governance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
