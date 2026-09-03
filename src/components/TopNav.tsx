import React from 'react';
import { 
  User, 
  Award, 
  TrendingUp, 
  Target, 
  FileText, 
  Users, 
  Settings,
  Shield,
  Upload,
  Cpu
} from 'lucide-react';

interface SidebarNavProps {
  currentView: string;
  onSelectView: (view: any) => void;
  userRole?: string;
}

export const TopNav: React.FC<SidebarNavProps> = ({ currentView, onSelectView, userRole }) => {
  const allNavItems = [
    { id: 'portal', label: 'My Portal', icon: User, roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'] },
    { id: 'reviews', label: 'Reviews', icon: Award, roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'] },
    { id: 'appraisals', label: 'Appraisals', icon: TrendingUp, roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'MANAGEMENT'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'] },
    { id: 'employees', label: 'Directory', icon: Users, roles: ['SUPER_ADMIN', 'HR', 'MANAGEMENT'] },
    { id: 'kras', label: 'KRA Library', icon: Target, roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD'] },
    { id: 'ai_performance', label: 'AI Assistant', icon: Cpu, roles: ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'EMPLOYEE', 'MANAGEMENT'] },
    { id: 'bulk', label: 'Import/Export', icon: Upload, roles: ['SUPER_ADMIN', 'HR'] },
    { id: 'audit', label: 'Audit Log', icon: Shield, roles: ['SUPER_ADMIN', 'HR', 'MANAGEMENT'] },
  ];

  const navItems = allNavItems.filter((item) => !userRole || item.roles.includes(userRole));

  return (
    <div className="bg-white border-b border-slate-200 w-full shrink-0">
      <nav 
        className="flex items-center space-x-6 px-6 overflow-x-auto overflow-y-hidden max-w-7xl mx-auto top-nav-scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `.top-nav-scrollbar-hide::-webkit-scrollbar { display: none; }`}} />
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center space-x-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
