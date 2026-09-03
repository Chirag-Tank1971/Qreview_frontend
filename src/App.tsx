import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
      const [tmplRes, kraRes, deptRes, desRes, empRes, cycleRes] = await Promise.all([
        api.getKraTemplates(),
        api.getKras(),
        api.getDepartments(),
        api.getDesignations(),
        api.getEmployees(),
        api.getCycles(),
      ]);
      setTemplates(tmplRes);
      setKras(kraRes);
      setDepartments(deptRes);
      setDesignations(desRes);
      setEmployees(empRes);
      setCycles(cycleRes);
    } catch (err) {
      console.error('Failed to load initial master data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, currentView]);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
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
          {currentView === 'portal' ? (
            <EmployeePortalView
              onNavigateToAppraisals={() => setCurrentView('appraisals')}
              onNavigateToReviews={() => setCurrentView('reviews')}
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
            <BulkImportExportManager
              currentUser={user}
              onDataImported={loadInitialData}
            />
          ) : currentView === 'audit' ? (
            <AuditComplianceExplorer
              currentUser={user}
              onNavigateToEmployee={(empId) => {
                setCurrentView('appraisals');
              }}
            />
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
          ) : currentView === 'employees' ? (
            <EmployeeDirectory />
          ) : (
            <EmployeePortalView
              onNavigateToAppraisals={() => setCurrentView('appraisals')}
              onNavigateToReviews={() => setCurrentView('reviews')}
              initialConfig={portalConfig}
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
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Enterprise Performance Management & Appraisal Calibration System</span>
          <span className="font-mono text-[11px] text-slate-400">8-Cycle Cohort Rollup • 4-Quarter Calibration • Promotion & CTC Revision Letters</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

