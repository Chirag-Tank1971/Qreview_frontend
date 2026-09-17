import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { ForcePasswordChangeScreen } from './components/ForcePasswordChangeScreen';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { ViewSkeletonFallback } from './components/ui/ViewSkeletonFallback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMasterData } from './hooks/useMasterData';
import { useUrlHashView, AppView, isViewPermitted } from './hooks/useUrlHashView';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Sidebar } from './components/ui/Sidebar';
import { KraTemplate } from './types';
import { ReviewViewConfig } from './components/QuarterlyReviewView';
import { AppraisalViewConfig } from './components/AppraisalManagementView';
import { EmployeePortalConfig } from './components/EmployeePortalView';
import { ReportsViewConfig } from './components/ReportsCenterView';
import { PageLoadingProgress } from './components/ui/PageLoadingProgress';
import { PageTransition } from './components/ui/PageTransition';

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
const NotificationsCenterView = lazy(() =>
  import('./components/NotificationsCenterView').then((m) => ({ default: m.NotificationsCenterView }))
);
const ManagementDashboardView = lazy(() =>
  import('./components/ManagementDashboardView').then((m) => ({ default: m.ManagementDashboardView }))
);
const DepartmentHierarchyView = lazy(() =>
  import('./components/DepartmentHierarchyView').then((m) => ({ default: m.DepartmentHierarchyView }))
);

// Modals lazy loaded on demand
const EmployeeModal = lazy(() =>
  import('./components/EmployeeModal').then((m) => ({ default: m.EmployeeModal }))
);
const KraTemplateBuilderModal = lazy(() =>
  import('./components/KraTemplateBuilderModal').then((m) => ({ default: m.KraTemplateBuilderModal }))
);
const KraLibraryModal = lazy(() =>
  import('./components/KraLibraryModal').then((m) => ({ default: m.KraLibraryModal }))
);

const VIEW_META: Record<string, { title: string; subtitle: string; tag: string; tagColor: string }> = {
  management: {
    title: 'Executive Management Intelligence',
    subtitle: 'Organization-wide review progress, department rankings, quarterly rating trends, and appraisal rollups',
    tag: 'Executive Leadership',
    tagColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
  },
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
  hierarchy: {
    title: 'Department & Manager Hierarchy',
    subtitle: 'Organizational structure, department HODs, reporting managers, and team headcount distribution',
    tag: 'Org Structure',
    tagColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
  },
  kras: {
    title: 'Goals & KRA Template Library',
    subtitle: 'Browse and configure Key Result Area templates and evaluation criteria by role',
    tag: 'Goal Templates',
    tagColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  },
  ai_performance: {
    title: 'AI Review & Talent Hub',
    subtitle: 'Generate AI-assisted review summaries and analyze strategic 9-box talent matrix',
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
  notifications: {
    title: 'Notifications & Workflow Center',
    subtitle: 'Track your actionable tasks, review deadlines, and monitor transactional audit communications',
    tag: 'Notification Hub',
    tagColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
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

  // Auto-land on Executive Management Dashboard for MANAGEMENT role
  useEffect(() => {
    if (user?.role === 'MANAGEMENT' && (!window.location.hash || window.location.hash === '#' || window.location.hash === '#portal')) {
      setView('management');
    }
  }, [user?.role, setView]);

  // Centralized Master Data via Custom Hook
  const {
    templates,
    kras,
    departments,
    designations,
    employees,
    cycles,
    refreshMasterData,
    saveTemplate,
    saveKra,
  } = useMasterData(isAuthenticated);

  // Hierarchy Employee Modal State
  const [isHierarchyEmpModalOpen, setIsHierarchyEmpModalOpen] = useState(false);
  const [hierarchyEditingEmployee, setHierarchyEditingEmployee] = useState<any>(null);

  // KRA Modals State
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [isKraLibraryOpen, setIsKraLibraryOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<KraTemplate | null>(null);

  const canManageKras = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';

  const handleNavigate = (tab: string, options?: any) => {
    setAppraisalConfig(tab === 'appraisals' ? options || null : null);
    setReviewConfig(tab === 'reviews' ? options || null : null);
    setReportsConfig(tab === 'reports' ? options || null : null);
    setPortalConfig(tab === 'portal' ? options || null : null);
    setView(tab as AppView);
  };

  // Proactive Role-Based Access Control (RBAC) Guard for Views
  useEffect(() => {
    setReviewConfig(null);
    setAppraisalConfig(null);
    setReportsConfig(null);
    setPortalConfig(null);

    // If current view is not permitted for the user's role, automatically redirect to their primary allowed workspace
    if (user?.role && !isViewPermitted(currentView, user.role)) {
      setView('portal', true);
    }
  }, [user?.id, user?.role, currentView, setView]);

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
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Universal GPU-Accelerated Page Loading Bar */}
      <PageLoadingProgress currentView={currentView} />

      {/* Unified Enterprise Header */}
      <Header
        currentView={currentView}
        onSelectView={(v) => {
          setReviewConfig(null);
          setAppraisalConfig(null);
          setReportsConfig(null);
          setPortalConfig(null);
          setView(v as AppView);
        }}
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Persistent Desktop Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={handleNavigate}
        />

        <div className="flex flex-col flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
          {/* Main Content Area - Full width enterprise canvas */}
          <main className="flex-1 w-full pl-2 sm:pl-3 pr-4 sm:pr-6 lg:pr-8 pt-4 pb-20 md:pb-10">
          {/* Notifications Return-to-Workspace Bar */}
          {currentView === 'notifications' && (
            <div className="mb-4">
              <button
                onClick={() => handleNavigate('portal')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs cursor-pointer"
                title="Back to Workspace"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Workspace</span>
              </button>
            </div>
          )}

          {/* Lazy loaded domain view with fallback */}
          <ErrorBoundary>
            <Suspense fallback={<ViewSkeletonFallback />}>
              <PageTransition viewKey={currentView}>
                {currentView === 'management' && user?.role === 'MANAGEMENT' ? (
                  <ManagementDashboardView
                    currentUser={user}
                    departments={departments}
                    onNavigateToReviews={(opts) => handleNavigate('reviews', opts)}
                    onNavigateToAppraisals={(opts) => handleNavigate('appraisals', opts)}
                  />
                ) : currentView === 'portal' ? (
                  <EmployeePortalView
                    onNavigateToAppraisals={(opts) => handleNavigate('appraisals', opts)}
                    onNavigateToReviews={(opts) => handleNavigate('reviews', opts)}
                    initialConfig={portalConfig}
                  />
                ) : currentView === 'ai_performance' && user?.role === 'SUPER_ADMIN' ? (
                  <AiPerformanceHub currentUser={user} />
                ) : currentView === 'appraisals' && ['SUPER_ADMIN', 'HR', 'MANAGEMENT', 'HOD', 'REPORTING_MANAGER', 'MANAGER'].includes(user?.role || '') ? (
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
                ) : currentView === 'reports' && ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'].includes(user?.role || '') ? (
                  <ReportsCenterView
                    departments={departments}
                    cycles={cycles}
                    initialConfig={reportsConfig}
                  />
                ) : currentView === 'bulk' && ['SUPER_ADMIN', 'HR'].includes(user?.role || '') ? (
                  <BulkImportExportManager currentUser={user} />
                ) : currentView === 'audit' && ['SUPER_ADMIN', 'HR'].includes(user?.role || '') ? (
                  <AuditComplianceExplorer currentUser={user} />
                ) : currentView === 'notifications' ? (
                  <NotificationsCenterView
                    currentUser={user}
                    onNavigate={(tab, opts) => handleNavigate(tab as AppView, opts)}
                  />
                ) : currentView === 'kras' && ['SUPER_ADMIN', 'HR'].includes(user?.role || '') ? (
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
                ) : currentView === 'employees' && ['SUPER_ADMIN', 'HR'].includes(user?.role || '') ? (
                  <EmployeeDirectory
                    currentUser={user}
                    departments={departments}
                    designations={designations}
                    cycles={cycles}
                    kraTemplates={templates}
                    onNavigateToAppraisals={(opts) => handleNavigate('appraisals', opts)}
                    onNavigateToReviews={(opts) => handleNavigate('reviews', opts)}
                    onNavigateToHierarchy={() => handleNavigate('hierarchy')}
                    initialConfig={portalConfig}
                    employees={employees}
                  />
                ) : currentView === 'hierarchy' && ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'].includes(user?.role || '') ? (
                  <div className="space-y-6">
                    <DepartmentHierarchyView
                      employees={employees}
                      departments={departments}
                      designations={designations}
                      cycles={cycles}
                      isHRorAdmin={['SUPER_ADMIN', 'HR'].includes(user?.role || '')}
                      onEditEmployee={(emp) => {
                        setHierarchyEditingEmployee(emp);
                        setIsHierarchyEmpModalOpen(true);
                      }}
                      onAddEmployee={() => {
                        setHierarchyEditingEmployee(null);
                        setIsHierarchyEmpModalOpen(true);
                      }}
                      onBackToDirectory={() => handleNavigate('employees')}
                    />
                    <Suspense fallback={null}>
                      {isHierarchyEmpModalOpen && (
                        <EmployeeModal
                          isOpen={isHierarchyEmpModalOpen}
                          onClose={() => setIsHierarchyEmpModalOpen(false)}
                          onSaved={refreshMasterData}
                          employeeToEdit={hierarchyEditingEmployee}
                          departments={departments}
                          designations={designations}
                          cycles={cycles}
                          allEmployees={employees}
                          kraTemplates={templates}
                        />
                      )}
                    </Suspense>
                  </div>
                ) : (
                  <EmployeePortalView
                    onNavigateToAppraisals={(opts) => handleNavigate('appraisals', opts)}
                    onNavigateToReviews={(opts) => handleNavigate('reviews', opts)}
                    initialConfig={portalConfig}
                  />
                )}
              </PageTransition>
            </Suspense>
          </ErrorBoundary>
          </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 mt-auto mb-16 md:mb-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
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
