import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { TopNav } from './components/TopNav';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { KraManagementView } from './components/KraManagementView';
import { KraTemplateBuilderModal } from './components/KraTemplateBuilderModal';
import { KraLibraryModal } from './components/KraLibraryModal';
import { QuarterlyReviewView, ReviewViewConfig } from './components/QuarterlyReviewView';
import { AppraisalManagementView, AppraisalViewConfig } from './components/AppraisalManagementView';
import { EmployeePortalView, EmployeePortalConfig } from './components/EmployeePortalView';
import { ReportsCenterView, ReportsViewConfig } from './components/ReportsCenterView';
import { BulkImportExportManager } from './components/BulkImportExportManager';
import { AuditComplianceExplorer } from './components/AuditComplianceExplorer';
import { AiPerformanceHub } from './components/AiPerformanceHub';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { ForcePasswordChangeScreen } from './components/ForcePasswordChangeScreen';
import { Loader2, Users, LayoutDashboard, Target, Award, Sparkles, FileText, Sliders, DollarSign, UserCheck, FileSpreadsheet, UploadCloud, ShieldCheck } from 'lucide-react';
import { KraTemplate, Kra, Department, Designation, Employee, Cycle } from './types';
import { api } from './services/api';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'portal' | 'ai_performance' | 'appraisals' | 'reviews' | 'kras' | 'employees' | 'reports' | 'bulk' | 'audit' | 'overview'>('portal');

  // View-specific configurations for direct workflow navigation
  const [appraisalConfig, setAppraisalConfig] = useState<AppraisalViewConfig | null>(null);
  const [reviewConfig, setReviewConfig] = useState<ReviewViewConfig | null>(null);
  const [reportsConfig, setReportsConfig] = useState<ReportsViewConfig | null>(null);
  const [portalConfig, setPortalConfig] = useState<EmployeePortalConfig | null>(null);

  const handleNavigate = (tab: string, options?: any) => {
    if (['portal', 'ai_performance', 'appraisals', 'reviews', 'kras', 'employees', 'reports', 'bulk', 'audit', 'overview'].includes(tab)) {
      setAppraisalConfig(tab === 'appraisals' ? options || null : null);
      setReviewConfig(tab === 'reviews' ? options || null : null);
      setReportsConfig(tab === 'reports' ? options || null : null);
      setPortalConfig(tab === 'portal' ? options || null : null);
      setCurrentView(tab as any);
    }
  };

  // Auto-switch to portal if user is an employee, and reset all view configs when switching roles
  useEffect(() => {
    setReviewConfig(null);
    setAppraisalConfig(null);
    setReportsConfig(null);
    setPortalConfig(null);
    if (user?.role === 'EMPLOYEE') {
      setCurrentView('portal');
    }
  }, [user?.id, user?.role]);

  // Master Data State
  const [templates, setTemplates] = useState<KraTemplate[]>([]);
  const [kras, setKras] = useState<Kra[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);

  // KRA Modals
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [isKraLibraryOpen, setIsKraLibraryOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<KraTemplate | null>(null);

  const canManageKras = user?.role === 'SUPER_ADMIN' || user?.role === 'HR' || user?.role === 'HOD';

  const loadInitialData = async () => {
    try {
      const [tmplRes, kraRes, deptRes, desRes, empRes, cycleRes] = await Promise.allSettled([
        api.getKraTemplates(),
        api.getKras(),
        api.getDepartments(),
        api.getDesignations(),
        api.getEmployees(),
        api.getCycles(),
      ]);
      if (tmplRes.status === 'fulfilled' && Array.isArray(tmplRes.value)) setTemplates(tmplRes.value);
      if (kraRes.status === 'fulfilled' && Array.isArray(kraRes.value)) setKras(kraRes.value);
      if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) setDepartments(deptRes.value);
      if (desRes.status === 'fulfilled' && Array.isArray(desRes.value)) setDesignations(desRes.value);
      if (empRes.status === 'fulfilled' && Array.isArray(empRes.value)) setEmployees(empRes.value);
      if (cycleRes.status === 'fulfilled' && Array.isArray(cycleRes.value)) setCycles(cycleRes.value);
    } catch (err) {
      console.error('Failed to load initial master data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const handleSaveTemplate = async (templateData: Partial<KraTemplate>) => {
    if (templateData.id) {
      await api.updateKraTemplate(templateData.id, templateData);
    } else {
      await api.createKraTemplate(templateData);
    }
    await loadInitialData();
  };

  const handleSaveKra = async (kraData: Partial<Kra>) => {
    if (kraData.id) {
      await api.updateKra(kraData.id, kraData);
    } else {
      await api.createKra(kraData);
    }
    await loadInitialData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Initializing Enterprise Performance & Appraisal System...</p>
      </div>
    );
  }

  // If not logged in, directly show the modern enterprise LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If logged in but must change password — show gate screen, block the whole app
  if (user?.mustChangePassword) {
    return <ForcePasswordChangeScreen />;
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Header */}
      <Header
        onNavigate={handleNavigate}
        onOpenLogin={() => setIsLoginModalOpen(true)}
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
            setCurrentView(v);
          }}
          userRole={user?.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 overflow-x-hidden">
          {/* View Context Banner */}
          {VIEW_META[currentView] && (
            <div className="mb-6 p-4 sm:p-5 bg-white/75 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
        </main>
      </div>

      {/* Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* KRA Modals */}
      {isTemplateBuilderOpen && (
        <KraTemplateBuilderModal
          template={editingTemplate}
          departments={departments}
          designations={designations}
          kraLibrary={kras}
          onSave={handleSaveTemplate}
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
          onSaveKra={handleSaveKra}
          onClose={() => setIsKraLibraryOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Performance & Appraisal Management</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Quarterly Reviews • Annual Calibration • AI-Assisted Growth
          </span>
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
