import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import {
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  ChevronDown,
  Info,
  Building2,
  Briefcase,
  UserCheck,
  User as UserIcon,
  Sparkles,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface QuickRole {
  role: UserRole;
  title: string;
  email: string;
  name: string;
  department: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ROLES: QuickRole[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    email: 'admin@company.com',
    name: 'System Admin',
    department: 'IT / Operations',
    badge: 'Full Access',
    icon: Shield,
  },
  {
    role: 'HR',
    title: 'HR Manager',
    email: 'frank.mgr@company.com',
    name: 'Frank HR Manager',
    department: 'Human Resources',
    badge: 'Calibration & Letters',
    icon: UserCheck,
  },
  {
    role: 'MANAGER',
    title: 'Reporting Manager',
    email: 'dave.mgr@company.com',
    name: 'Dave Eng Manager',
    department: 'Engineering Team',
    badge: 'Team Reviews',
    icon: Briefcase,
  },
  {
    role: 'HOD',
    title: 'Head of Department',
    email: 'alice.hod@company.com',
    name: 'Alice Engineering HOD',
    department: 'Engineering Org',
    badge: 'Department Approvals',
    icon: Building2,
  },
  {
    role: 'MANAGEMENT',
    title: 'Executive Management',
    email: 'executive@company.com',
    name: 'Executive Management',
    department: 'C-Suite & Board',
    badge: 'Executive Analytics',
    icon: Sparkles,
  },
  {
    role: 'EMPLOYEE',
    title: 'Employee',
    email: 'grace@company.com',
    name: 'Grace Engineer',
    department: 'Software Engineering',
    badge: 'Self-Service Portal',
    icon: UserIcon,
  },
];

export const LoginPage: React.FC = () => {
  const { login, switchRole, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both employee ID/email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
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
      await switchRole(quickRole.role);
    } catch (err: any) {
      try {
        await login(quickRole.email, 'password123');
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Quick sign-in failed.');
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

  const isActionLocked = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Discreet Utility Top Bar */}
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">AppraisalOS</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 my-auto">
        {/* Company / Application Identity */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs mx-auto mb-3">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Employee Management System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quarterly Review & Appraisal Calibration
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Authentication Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">Authentication Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Employee ID */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email or Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com or employee ID"
                  disabled={isActionLocked}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isActionLocked}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotInfo(!showForgotInfo)}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Forgot Password Policy Callout */}
            {showForgotInfo && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 space-y-1 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Password Reset Policy</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Please contact your <strong>HR department</strong> to reset your password. An HR administrator can issue a new temporary password from the <em>Employee Directory → Manage Login Access</em> panel.
                </p>
              </div>
            )}

            {/* Sign In Primary Button */}
            <button
              type="submit"
              disabled={isActionLocked}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isActionLocked ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Security / System Subtitle */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Secure Enterprise Access</span>
          <span>•</span>
          <span>Role-Based Control</span>
        </div>

        {/* Collapsible Demo Personas Accordion (Development/Demo only) */}
        {(!import.meta.env.PROD || import.meta.env.VITE_ENABLE_DEMO_PERSONAS === 'true') && (
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800/80 pt-4 text-center">
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium cursor-pointer transition-colors"
            >
              <span>Demo Personas & Test Accounts</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemoDrawer ? 'rotate-180' : ''}`} />
            </button>

            {showDemoDrawer && (
              <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-left space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span>Default Password for all: <code className="text-slate-700 dark:text-slate-300 font-mono font-bold">password123</code></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_ROLES.map((qr) => {
                    const Icon = qr.icon;
                    return (
                      <div
                        key={qr.role}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {qr.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {qr.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAutofillForm(qr.email)}
                            className="px-1.5 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                            title="Auto-fill form credentials"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickLogin(qr)}
                            disabled={isActionLocked}
                            className="px-2 py-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-3 text-center text-[11px] text-slate-400 dark:text-slate-600 shrink-0 border-t border-slate-200 dark:border-slate-800/60">
        <span>© 2026 AppraisalOS Inc. All rights reserved. Enterprise Performance & Appraisal Management.</span>
      </footer>
    </div>
  );
};
