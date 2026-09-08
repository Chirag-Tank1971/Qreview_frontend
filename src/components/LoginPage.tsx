import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Layers,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Building2,
  Briefcase,
  UserCheck,
  User as UserIcon,
  CheckCircle2,
  KeyRound,
  HelpCircle,
  Info,
} from 'lucide-react';

interface QuickRole {
  role: UserRole;
  title: string;
  email: string;
  name: string;
  department: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderHover: string;
}

const QUICK_ROLES: QuickRole[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    email: 'admin@company.com',
    name: 'System Admin',
    department: 'IT / Operations',
    badge: 'Full Platform Access',
    icon: Shield,
    accentColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    borderHover: 'hover:border-indigo-400 hover:bg-indigo-50/40',
  },
  {
    role: 'HR',
    title: 'HR Manager',
    email: 'frank.mgr@company.com',
    name: 'Frank HR Manager',
    department: 'Human Resources',
    badge: 'Calibration & Letters',
    icon: UserCheck,
    accentColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderHover: 'hover:border-emerald-400 hover:bg-emerald-50/40',
  },
  {
    role: 'MANAGER',
    title: 'Reporting Manager',
    email: 'dave.mgr@company.com',
    name: 'Dave Eng Manager',
    department: 'Engineering Team',
    badge: 'Team KRA Reviews',
    icon: Briefcase,
    accentColor: 'bg-blue-50 text-blue-700 border-blue-200',
    borderHover: 'hover:border-blue-400 hover:bg-blue-50/40',
  },
  {
    role: 'HOD',
    title: 'Head of Department',
    email: 'alice.hod@company.com',
    name: 'Alice Engineering HOD',
    department: 'Engineering Org',
    badge: 'Budget Pools & Norms',
    icon: Building2,
    accentColor: 'bg-purple-50 text-purple-700 border-purple-200',
    borderHover: 'hover:border-purple-400 hover:bg-purple-50/40',
  },
  {
    role: 'MANAGEMENT',
    title: 'Executive Management',
    email: 'executive@company.com',
    name: 'Executive Management',
    department: 'C-Suite & Board',
    badge: 'Org-wide Analytics',
    icon: Sparkles,
    accentColor: 'bg-rose-50 text-rose-700 border-rose-200',
    borderHover: 'hover:border-rose-400 hover:bg-rose-50/40',
  },
  {
    role: 'EMPLOYEE',
    title: 'Employee (ESS)',
    email: 'grace@company.com',
    name: 'Grace Engineer',
    department: 'Software Engineering',
    badge: 'Self-Service Portal',
    icon: UserIcon,
    accentColor: 'bg-amber-50 text-amber-700 border-amber-200',
    borderHover: 'hover:border-amber-400 hover:bg-amber-50/40',
  },
];

export const LoginPage: React.FC = () => {
  const { login, switchRole, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both corporate email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickRole: QuickRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Use switchRole for immediate fast-authentication
      await switchRole(quickRole.role);
    } catch (err: any) {
      // Fallback to normal credentials login
      try {
        await login(quickRole.email, 'password123');
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Quick login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutofillForm = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background Decorative Mesh / Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              <span className="hidden sm:inline">Quarterly Review & Appraisal Management</span>
              <span className="inline sm:hidden">Appraisal System</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Enterprise Performance & Calibration Portal
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden xs:inline">Access Guide</span>
          </button>
        </div>
      </header>

      {/* Main Center Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Left Column: Interactive Modern Login Card */}
          <div className="lg:col-span-6 max-w-lg mx-auto w-full">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl shadow-black/50 border border-slate-100 dark:border-slate-800 p-5 sm:p-10 relative">
              
              {/* Card Header */}
              <div className="space-y-2 mb-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Secure Enterprise Authentication</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Sign In to Workspace
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your corporate credentials to access your performance reviews, team calibrations, and self-service records.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Authentication Error</p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutofillForm('admin@company.com')}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                    >
                      Fill Default Password
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox and Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Remember this workstation</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotInfo(!showForgotInfo)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Forgot Password Info Box */}
                {showForgotInfo && (
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">Forgot your password?</p>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                        Please contact your <strong>HR department</strong> to reset your password. HR can issue a new temporary password from the <em>Employee Directory → Manage Login Access</em> panel.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="w-full mt-2 py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 active:bg-slate-950 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Corporate Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to System</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Badge Footer */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Bcrypt Salting & JWT Bearer Session</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">v2.4 Production</span>
              </div>
            </div>
          </div>

          {/* Right Column: One-Click Enterprise Persona Fast-Login */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-indigo-300 border border-slate-700/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instant Enterprise Role Access</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Select Your Role or Persona
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Click any corporate persona below for direct, one-click authentication or to explore role-specific permissions across the appraisal lifecycle.
              </p>
            </div>

            {/* Quick Roles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_ROLES.map((qr) => {
                const Icon = qr.icon;
                return (
                  <div
                    key={qr.role}
                    className={`bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 ${qr.borderHover} rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-sm`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-700/80 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4 text-indigo-300" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${qr.accentColor}`}>
                          {qr.badge}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                        {qr.title}
                      </h3>
                      <p className="text-xs text-slate-300 font-medium">{qr.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{qr.email}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                      <button
                        onClick={() => handleQuickLogin(qr)}
                        disabled={isLoading || isSubmitting}
                        className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span>Direct Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAutofillForm(qr.email)}
                        className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-medium rounded-lg transition-colors"
                        title="Autofill this email into form"
                      >
                        Autofill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enterprise Highlights Bar */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Default Password for all seed accounts: <strong className="text-white font-mono">password123</strong></span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Enterprise Performance Management & Appraisal Calibration System</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span>8-Cycle Cohort Rollup</span>
          <span>•</span>
          <span>4-Quarter Calibration</span>
          <span>•</span>
          <span>Role-Based Access Control</span>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Enterprise Access & Credentials</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                The system comes pre-configured with active enterprise personas representing every stage of the 4-quarter review and annual compensation appraisal cycle:
              </p>
              <div className="space-y-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Super Administrator:</span>
                  <span className="font-mono text-indigo-300">admin@company.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">HR Manager:</span>
                  <span className="font-mono text-indigo-300">frank.mgr@company.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Reporting Manager:</span>
                  <span className="font-mono text-indigo-300">dave.mgr@company.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Head of Department (HOD):</span>
                  <span className="font-mono text-indigo-300">alice.hod@company.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Employee (ESS):</span>
                  <span className="font-mono text-indigo-300">grace@company.com</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Universal test password: <span className="font-mono text-white bg-slate-800 px-1.5 py-0.5 rounded">password123</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
