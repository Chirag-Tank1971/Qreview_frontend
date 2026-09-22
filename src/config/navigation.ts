import type { ComponentType } from 'react';
import {
  Layers,
  BarChart3,
  FileCheck,
  Award,
  Download,
  Users,
  Target,
  Sparkles,
  Upload,
  Shield,
  ClipboardList,
  Bell,
} from 'lucide-react';
import type { AppView } from '../hooks/useUrlHashView';
import type { UserRole } from '../types';

export interface NavItemConfig {
  id: AppView;
  /** Sidebar section heading (also used as the Header breadcrumb "group"). */
  group: 'Work' | 'People' | 'Configuration' | 'System';
  /** MobileNavDrawer's two-section split — distinct from `group` because the mobile
   *  drawer intentionally groups by "how often you'd reach for this" rather than by
   *  the desktop sidebar's topical taxonomy. */
  mobileSection: 'primary' | 'admin';
  /** false hides the item from the desktop Sidebar entirely (e.g. Notifications, which
   *  only lives in the Header bell + mobile drawer). Defaults to true. */
  inSidebar?: boolean;
  label: string | ((role?: UserRole) => string);
  /** Mobile drawer only — a one-line description under the label. */
  subtitle?: string | ((role?: UserRole) => string);
  icon: ComponentType<{ className?: string }>;
  roles: UserRole[];
  isAiBadge?: boolean;
}

/**
 * Single source of truth for every routable nav destination: which roles can see it,
 * what it's labelled, which icon it uses, and which section it belongs to on desktop vs
 * mobile. `Sidebar.tsx`, `MobileNavDrawer.tsx`, `Header.tsx` (breadcrumb), and
 * `useUrlHashView.ts` (role-permission gating + valid-hash list) all derive from this
 * list instead of each hand-maintaining their own copy — that duplication is exactly
 * what let a nav item exist in one place but not the role-permission list in another
 * (the 'pip' view briefly wasn't in ROLE_ALLOWED_VIEWS for HOD/Manager despite having a
 * working Sidebar entry). Add or change a destination here once; every surface picks it
 * up automatically.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'management',
    group: 'Work',
    mobileSection: 'primary',
    label: 'Executive Analytics',
    subtitle: 'Organization-wide KPIs, department matrix & trends',
    icon: BarChart3,
    roles: ['MANAGEMENT'],
  },
  {
    id: 'portal',
    group: 'Work',
    mobileSection: 'primary',
    label: 'My Workspace',
    subtitle: 'Goals, self-evaluations & appraisal letters',
    icon: Layers,
    roles: ['SUPER_ADMIN', 'HR', 'REPORTING_MANAGER', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'],
  },
  {
    id: 'reviews',
    group: 'Work',
    mobileSection: 'primary',
    label: (role) => (role === 'EMPLOYEE' ? 'My Reviews' : 'Quarterly Reviews'),
    subtitle: 'Score KRAs and track performance cycles',
    icon: FileCheck,
    roles: ['SUPER_ADMIN', 'HR', 'REPORTING_MANAGER', 'MANAGER', 'HOD', 'EMPLOYEE'],
  },
  {
    id: 'appraisals',
    group: 'Work',
    mobileSection: 'primary',
    label: 'Annual Appraisals',
    subtitle: 'Cohort calibrations & salary increment proposals',
    icon: Award,
    roles: ['SUPER_ADMIN', 'HR', 'HOD', 'REPORTING_MANAGER', 'MANAGER'],
  },
  {
    id: 'reports',
    group: 'Work',
    mobileSection: 'primary',
    label: 'Reports Center',
    subtitle: 'Bell curve distributions & department trends',
    icon: Download,
    roles: ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'],
  },
  {
    id: 'employees',
    group: 'People',
    mobileSection: 'admin',
    label: 'Employee Directory',
    subtitle: 'Organization directory & profiles',
    icon: Users,
    roles: ['SUPER_ADMIN', 'HR'],
  },
  {
    id: 'hierarchy',
    group: 'People',
    mobileSection: 'admin',
    label: 'Department & Hierarchy',
    subtitle: 'Org tree, HODs, & reporting lines',
    icon: Layers,
    roles: ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'],
  },
  {
    id: 'pip',
    group: 'People',
    mobileSection: 'admin',
    label: 'Performance Plans',
    subtitle: 'Improvement plans, goals & check-ins',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN', 'HR', 'HOD', 'REPORTING_MANAGER', 'MANAGER', 'EMPLOYEE'],
  },
  {
    id: 'kras',
    group: 'Configuration',
    mobileSection: 'admin',
    label: 'Goal Templates (KRAs)',
    subtitle: 'Standard metrics & 100% weight rubrics',
    icon: Target,
    roles: ['SUPER_ADMIN', 'HR'],
  },
  {
    id: 'ai_performance',
    group: 'Configuration',
    mobileSection: 'primary',
    label: 'AI Copilot & 360',
    subtitle: 'AI review assistant & continuous praise',
    icon: Sparkles,
    roles: ['SUPER_ADMIN'],
    isAiBadge: true,
  },
  {
    id: 'bulk',
    group: 'System',
    mobileSection: 'admin',
    label: 'Bulk Data Manager',
    subtitle: 'Import or export Excel/CSV master data',
    icon: Upload,
    roles: ['SUPER_ADMIN', 'HR'],
  },
  {
    id: 'audit',
    group: 'System',
    mobileSection: 'admin',
    label: (role) => (role === 'HR' ? 'Appraisal Lifecycle' : 'Compliance & Audit Trail'),
    subtitle: (role) => (role === 'HR' ? 'Employee appraisal evolution timeline' : 'Decision history & master audit stream'),
    icon: Shield,
    roles: ['SUPER_ADMIN', 'HR'],
  },
  {
    id: 'notifications',
    group: 'System',
    mobileSection: 'primary',
    inSidebar: false,
    label: 'Notifications Hub',
    subtitle: 'Actionable tasks & email delivery audit',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'HR', 'REPORTING_MANAGER', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'],
  },
];

export function getNavLabel(item: NavItemConfig, role?: UserRole): string {
  return typeof item.label === 'function' ? item.label(role) : item.label;
}

export function getNavSubtitle(item: NavItemConfig, role?: UserRole): string | undefined {
  return typeof item.subtitle === 'function' ? item.subtitle(role) : item.subtitle;
}

export function isNavItemVisible(item: NavItemConfig, role?: UserRole): boolean {
  return !role || item.roles.includes(role);
}

export function getVisibleNavItems(role?: UserRole): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => isNavItemVisible(item, role));
}
