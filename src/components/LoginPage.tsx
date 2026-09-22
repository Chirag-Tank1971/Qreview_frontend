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
  Info,
  Building2,
  Briefcase,
  UserCheck,
  User as UserIcon,
  Sparkles,
  Shield,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

interface QuickRole {
  role: UserRole;
  title: string;
  shortLabel: string;
  email: string;
  name: string;
  department: string;
  badge: string;
  accent: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ROLES: QuickRole[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    shortLabel: 'Admin',
    email: 'admin@company.com',
    name: 'System Admin',
    department: 'IT & Platform Ops',
    badge: 'Full Access',
    accent: 'bg-violet-600',
    badgeColor: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    icon: Shield,
  },
  {
    role: 'HR',
    title: 'HR Manager',
    shortLabel: 'HR',
    email: 'frank.mgr@company.com',
    name: 'Frank HR',
    department: 'People Operations',
    badge: 'Calibration & Letters',
    accent: 'bg-emerald-600',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: UserCheck,
  },
  {
    role: 'MANAGER',
    title: 'Reporting Manager',
    shortLabel: 'Manager',
    email: 'dave.mgr@company.com',
    name: 'Dave Eng Manager',
    department: 'Engineering Team',
    badge: 'Team Reviews',
    accent: 'bg-blue-600',
    badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Briefcase,
  },
  {
    role: 'HOD',
    title: 'Head of Department',
    shortLabel: 'HOD',
    email: 'nikhilesh.hod@company.com',
    name: 'Nikhilesh Srivastava',
    department: 'Operations & Management',
    badge: 'Org-wide Approvals',
    accent: 'bg-amber-600',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Building2,
  },
  {
    role: 'MANAGEMENT',
    title: 'Executive C-Suite',
    shortLabel: 'Executive',
    email: 'executive@company.com',
    name: 'Executive Management',
    department: 'Executive Board',
    badge: 'Executive Intelligence',
    accent: 'bg-fuchsia-600',
    badgeColor: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
    icon: Sparkles,
  },
  {
    role: 'EMPLOYEE',
    title: 'Employee Portal',
    shortLabel: 'Employee',
    email: 'grace@company.com',
    name: 'Grace Engineer',
    department: 'Software Engineering',
    badge: 'Self-Service Reviews',
    accent: 'bg-sky-600',
    badgeColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    icon: UserIcon,
  },
];

export const LoginPage: React.FC = () => {
  const { login, switchRole, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<QuickRole | null>(null);

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

  const handleSelectPersona = (qr: QuickRole) => {
    setSelectedPersona(qr);
    setEmail(qr.email);
    setPassword('password123');
    setError(null);
  };

  const isActionLocked = isLoading || isSubmitting;

  return (
    <div className="h-screen max-h-screen overflow-y-auto lg:overflow-hidden bg-slate-50 dark:bg-slate-950 login-grid-backdrop relative flex flex-col justify-between text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Ambient floating gradient blobs */}
      <div className="login-blob absolute top-10 left-[8%] w-80 h-80 bg-indigo-400/20 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="login-blob login-blob-delay absolute bottom-10 right-[10%] w-96 h-96 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar - Compact 44px */}
      <header className="login-fade-up w-full max-w-7xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="login-logo-glow w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white">
                MintReview System
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Enterprise v2.4
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* System Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Operational</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            id="login-theme-toggle-btn"
            className="relative p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all active:scale-90 cursor-pointer overflow-hidden"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
              <Sun
                className={`w-4 h-4 text-amber-500 transition-all duration-400 ease-out absolute inset-0 ${
                  isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                }`}
              />
              <Moon
                className={`w-4 h-4 text-slate-600 dark:text-slate-300 transition-all duration-400 ease-out absolute inset-0 ${
                  isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Main Single-Screen Hero - Flex Centered Without Overflow */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-center">
        <div className="w-full grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Column: Brand Showcase (Compact & Balanced) */}
          <div className="lg:col-span-6 space-y-4 text-left hidden lg:block">
            {/* Pill Tag */}
            <div className="login-fade-up login-delay-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Next-Gen Performance Calibration Platform</span>
            </div>

            {/* Main Headline */}
            <div className="login-fade-up login-delay-2 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Empower your workforce.{' '}
                <span className="text-indigo-600 dark:text-indigo-400">
                  Calibrate with confidence.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                Streamline quarterly evaluations, objective KRA grading, peer feedback, and automated appraisal letters in one unified workspace.
              </p>
            </div>

            {/* Live Metric Card */}
            <div className="login-fade-up login-delay-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 transition-shadow hover:shadow-lg hover:shadow-indigo-500/5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Q3 2026 Cycle Performance
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Organization-wide calibration
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ● Active Cycle
                </span>
              </div>

              {/* Mini Stats 3-Column */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Completed</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">96.8%</div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">On Track</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Avg Score</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">4.24<span className="text-[10px] text-slate-400 font-normal">/5</span></div>
                  <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">Exceptional</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Audited</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">100%</div>
                  <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">Verified</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Cycle Progress</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phase 3 of 4 (HR Sign-off)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="login-progress-fill relative h-full bg-indigo-600 rounded-full"
                    style={{ '--login-progress-target': '85%' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            {/* Compact Feature Badges Ribbon */}
            <div className="login-fade-up login-delay-4 flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-transform hover:-translate-y-0.5">
                <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Objective KRA Grading</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-transform hover:-translate-y-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Letter Generation</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-transform hover:-translate-y-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Role-Based ACL</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Compact Sign-In Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto login-fade-up login-delay-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 relative shadow-xl shadow-slate-200/40 dark:shadow-black/30">

              {/* Card Header Title */}
              <div className="space-y-0.5 mb-3.5 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Sign In
                  </h2>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-500" />
                    TLS 1.3 Encrypted
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {import.meta.env.DEV
                    ? 'Welcome to MintReview System. Choose a demo persona or enter credentials.'
                    : 'Welcome to MintReview System. Enter your credentials to access your account.'}
                </p>
              </div>

              {/* Interactive Quick Demo Personas - Strictly DEVELOPMENT ONLY */}
              {import.meta.env.DEV && (
                <>
                  <div className="mb-3.5 p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-left space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        1-Click Demo Personas
                        <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          DEV ONLY
                        </span>
                      </span>
                      <span className="text-slate-400 font-normal lowercase">click to test</span>
                    </div>

                    {/* 6 Quick Persona Pills */}
                    <div className="grid grid-cols-6 gap-1">
                      {QUICK_ROLES.map((qr) => {
                        const Icon = qr.icon;
                        const isSelected = selectedPersona?.role === qr.role;
                        return (
                          <button
                            key={qr.role}
                            type="button"
                            onClick={() => handleSelectPersona(qr)}
                            className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 text-center transition-all duration-150 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                              isSelected
                                ? 'bg-white dark:bg-slate-700 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 scale-105'
                                : 'bg-white/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-700/80 hover:border-slate-300'
                            }`}
                            title={`Test as ${qr.title}`}
                          >
                            <div className={`w-5 h-5 rounded ${qr.accent} text-white flex items-center justify-center transition-transform ${isSelected ? 'scale-110' : ''}`}>
                              <Icon className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                              {qr.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Selected Persona Highlight Strip */}
                    {selectedPersona && (
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 animate-fadeIn">
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {selectedPersona.name}
                            </span>
                            <span className={`text-[9px] font-bold px-1 rounded border ${selectedPersona.badgeColor}`}>
                              {selectedPersona.shortLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {selectedPersona.email}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickLogin(selectedPersona)}
                          disabled={isActionLocked}
                          className="login-btn-sheen px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isActionLocked ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Sign In</span>}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Slim Divider - Dev only */}
                  <div className="relative flex items-center justify-center my-2.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <span className="relative px-2.5 bg-white dark:bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Or enter credentials
                    </span>
                  </div>
                </>
              )}

              {/* Authentication Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="mb-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 text-left animate-fadeIn"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-tight">
                    <span className="font-semibold block">{error}</span>
                  </div>
                </div>
              )}

              {/* Compact Standard Login Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
                {/* Email or Employee ID */}
                <div className="space-y-1">
                  <label
                    htmlFor="login-email"
                    className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    Employee ID or Work Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="login-email"
                      type="text"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@company.com or MS0001"
                      disabled={isActionLocked}
                      className="w-full bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 sm:py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label
                    htmlFor="login-password"
                    className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="w-3.5 h-3.5" />
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
                      className="w-full bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-9 py-1.5 sm:py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-end text-xs pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotInfo(!showForgotInfo)}
                    className="font-semibold text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Forgot Password Policy Callout */}
                {showForgotInfo && (
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-fadeIn text-left">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200 text-[11px]">
                      <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Password Reset Policy</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">
                      Contact your designated <strong>HR Operations Administrator</strong> to issue a temporary security token from the <em>Employee Directory</em>.
                    </p>
                  </div>
                )}

                {/* Sign In Primary Button */}
                <button
                  type="submit"
                  disabled={isActionLocked}
                  className="login-btn-sheen w-full mt-1.5 py-2 sm:py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {isActionLocked ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to MintReview System</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Security Assurance */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 select-none">
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Zero-Trust Architecture</span>
                <span>•</span>
                <span>Role-Based Access</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Global Enterprise Footer - Compact 32px */}
      <footer className="login-fade-up login-delay-5 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-slate-600 shrink-0 border-t border-slate-200/60 dark:border-slate-800/60 gap-1.5">
        <span>© 2026 MintReview System Inc. All rights reserved. Enterprise Performance & Appraisal Calibration.</span>
        <div className="flex items-center gap-3">
          <span className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-pointer">Security</span>
          <span>•</span>
          <span className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-pointer">Privacy & Governance</span>
          <span>•</span>
          <span className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-pointer">SOC2 Compliance</span>
        </div>
      </footer>
    </div>
  );
};
