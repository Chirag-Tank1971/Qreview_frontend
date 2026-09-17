import React, { useState, useMemo } from 'react';
import { Employee, Department, Designation, Cycle, KraTemplate, User } from '../types';
import {
  Building2,
  Users,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  Crown,
  Edit2,
  Mail,
  ArrowRight,
  ArrowLeft,
  Layers,
  Sparkles,
  TrendingUp,
  Filter,
  Plus,
} from 'lucide-react';
import { CycleBadge } from './ui/CycleBadge';
import { PageSkeletonLoader } from './ui/PageSkeletonLoader';

interface DepartmentHierarchyViewProps {
  employees: Employee[];
  departments: Department[];
  designations?: Designation[];
  cycles?: Cycle[];
  isHRorAdmin?: boolean;
  onEditEmployee?: (employee: Employee) => void;
  onAddEmployee?: () => void;
  onBackToDirectory?: () => void;
}

interface ManagerWithReports {
  manager: Employee;
  directReports: Employee[];
  isCrossDept?: boolean;
}

interface DepartmentHierarchyData {
  department: Department;
  hod: Employee | null;
  totalHeadcount: number;
  activeHeadcount: number;
  managersWithReports: ManagerWithReports[];
  directToHodOrUnassigned: Employee[];
}

export const DepartmentHierarchyView: React.FC<DepartmentHierarchyViewProps> = ({
  employees,
  departments,
  designations = [],
  cycles = [],
  isHRorAdmin = false,
  onEditEmployee,
  onAddEmployee,
  onBackToDirectory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [collapsedManagers, setCollapsedManagers] = useState<Record<string, boolean>>({});

  // Memoize department hierarchy calculations
  const hierarchyData: DepartmentHierarchyData[] = useMemo(() => {
    const empMap = new Map<string, Employee>(employees.map((e) => [e.id, e]));

    return departments.map((dept) => {
      // 1. Department members
      const deptMembers = employees.filter((e) => e.departmentId === dept.id);
      const activeMembers = deptMembers.filter((e) => e.status === 'ACTIVE');

      // 2. Identify HOD
      let hod: Employee | null = null;
      if (dept.hodId && empMap.has(dept.hodId)) {
        hod = empMap.get(dept.hodId) || null;
      } else {
        hod =
          deptMembers.find(
            (e) =>
              e.systemRole === 'HOD' ||
              e.designationName?.toLowerCase().includes('vp') ||
              e.designationName?.toLowerCase().includes('head')
          ) || null;
      }

      // 3. Identify Managers in this Department
      const managerIdsSet = new Set<string>();

      deptMembers.forEach((e) => {
        if (e.systemRole === 'MANAGER' || e.systemRole === 'REPORTING_MANAGER') {
          managerIdsSet.add(e.id);
        }
      });

      employees.forEach((e) => {
        if (e.managerId && deptMembers.some((dm) => dm.id === e.managerId)) {
          managerIdsSet.add(e.managerId);
        }
      });

      // Exclude HOD from managers list if HOD is displayed separately
      if (hod && managerIdsSet.has(hod.id)) {
        managerIdsSet.delete(hod.id);
      }

      const managersWithReports: ManagerWithReports[] = [];
      Array.from(managerIdsSet).forEach((mId) => {
        const manager = empMap.get(mId);
        if (manager) {
          const directReports = employees.filter(
            (e) => e.managerId === manager.id && e.id !== manager.id
          );
          managersWithReports.push({
            manager,
            directReports,
            isCrossDept: manager.departmentId !== dept.id,
          });
        }
      });
      managersWithReports.sort((a, b) => b.directReports.length - a.directReports.length);

      // 4. Employees reporting directly to HOD or without intermediate manager
      const managerIds = new Set(managersWithReports.map((m) => m.manager.id));
      const directToHodOrUnassigned = deptMembers.filter((e) => {
        if (hod && e.id === hod.id) return false;
        if (e.managerId && managerIds.has(e.managerId)) return false;
        return true;
      });

      return {
        department: dept,
        hod,
        totalHeadcount: deptMembers.length,
        activeHeadcount: activeMembers.length,
        managersWithReports,
        directToHodOrUnassigned,
      };
    });
  }, [employees, departments]);

  // Overall Organization Stats
  const stats = useMemo(() => {
    const totalDepts = departments.length;
    const deptsWithHod = hierarchyData.filter((d) => d.hod !== null).length;
    
    // Unique managers with at least 1 direct report
    const uniqueManagers = new Set<string>();
    let totalAssignedDirectReports = 0;

    hierarchyData.forEach((d) => {
      d.managersWithReports.forEach((m) => {
        uniqueManagers.add(m.manager.id);
        totalAssignedDirectReports += m.directReports.length;
      });
    });

    const avgSpanOfControl =
      uniqueManagers.size > 0 ? (totalAssignedDirectReports / uniqueManagers.size).toFixed(1) : '0';

    return {
      totalDepts,
      deptsWithHod,
      totalManagers: uniqueManagers.size,
      totalAssignedDirectReports,
      avgSpanOfControl,
    };
  }, [departments, hierarchyData]);

  // Filtered department list based on user search & department selection
  const filteredHierarchy = useMemo(() => {
    let list = hierarchyData;

    if (selectedDeptId && selectedDeptId !== 'ALL') {
      list = list.filter((d) => d.department.id === selectedDeptId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const matchDept =
          d.department.name.toLowerCase().includes(q) ||
          d.department.code.toLowerCase().includes(q);
        const matchHod =
          d.hod &&
          (d.hod.name.toLowerCase().includes(q) ||
            d.hod.employeeCode.toLowerCase().includes(q) ||
            d.hod.email.toLowerCase().includes(q));
        const matchManager = d.managersWithReports.some(
          (m) =>
            m.manager.name.toLowerCase().includes(q) ||
            m.manager.employeeCode.toLowerCase().includes(q) ||
            m.directReports.some(
              (r) =>
                r.name.toLowerCase().includes(q) ||
                r.employeeCode.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q)
            )
        );
        const matchDirectStaff = d.directToHodOrUnassigned.some(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.employeeCode.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
        );

        return matchDept || matchHod || matchManager || matchDirectStaff;
      });
    }

    return list;
  }, [hierarchyData, selectedDeptId, searchQuery]);

  // Toggle Collapse handlers
  const toggleDeptCollapse = (deptId: string) => {
    setCollapsedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const toggleManagerCollapse = (mgrId: string) => {
    setCollapsedManagers((prev) => ({
      ...prev,
      [mgrId]: !prev[mgrId],
    }));
  };

  const expandAll = () => {
    setCollapsedDepts({});
    setCollapsedManagers({});
  };

  const collapseAll = () => {
    const allDeptCollapsed: Record<string, boolean> = {};
    departments.forEach((d) => {
      allDeptCollapsed[d.id] = true;
    });
    setCollapsedDepts(allDeptCollapsed);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Active
          </span>
        );
      case 'PROBATION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-2.5 h-2.5 text-amber-500" /> Probation
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-2.5 h-2.5 text-rose-500" /> Notice
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  if (departments.length === 0) {
    return <PageSkeletonLoader variant="hierarchy" />;
  }

  return (
    <div className="space-y-6">
      {/* Native Page Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (onBackToDirectory) {
                  onBackToDirectory();
                } else {
                  window.location.hash = '#employees';
                }
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Back to Employee Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Department & Manager Hierarchy
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Org Structure
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-9">
            Departmental leadership, HOD assignments, reporting managers, and direct report distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => {
              if (onBackToDirectory) {
                onBackToDirectory();
              } else {
                window.location.hash = '#employees';
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Return to Employee Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
          </button>

          {isHRorAdmin && onAddEmployee && (
            <button
              onClick={onAddEmployee}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          )}
        </div>
      </div>

      {/* 1. EXECUTIVE KPI SUMMARY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Departments Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Departments
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.totalDepts}
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-1.5 py-0.5 rounded">
              Active Units
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Organizational structure
          </p>
        </div>

        {/* Assigned HODs Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Department HODs
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.deptsWithHod}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
              {stats.totalDepts > 0 ? Math.round((stats.deptsWithHod / stats.totalDepts) * 100) : 0}% Assigned
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Departmental leadership
          </p>
        </div>

        {/* Reporting Managers Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              People Managers
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.totalManagers}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
              Active Leaders
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Reviewing managers with teams
          </p>
        </div>

        {/* Average Span of Control Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg. Team Span
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.avgSpanOfControl}
            </span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Reports / Mgr
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {stats.totalAssignedDirectReports} managed team members
          </p>
        </div>
      </div>

      {/* 2. SEARCH, FILTER & ACCORDION CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2.5 rounded-xl shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search department, HOD, manager, or direct report..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Select */}
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="h-9 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          {/* Expand / Collapse All */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* 3. DEPARTMENT HIERARCHY CARDS LIST */}
      <div className="space-y-4">
        {filteredHierarchy.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No departments or managers match your search criteria.
          </div>
        ) : (
          filteredHierarchy.map((deptData) => {
            const { department, hod, totalHeadcount, activeHeadcount, managersWithReports, directToHodOrUnassigned } =
              deptData;
            const isDeptCollapsed = Boolean(collapsedDepts[department.id]);

            return (
              <div
                key={department.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Department Card Header */}
                <div
                  onClick={() => toggleDeptCollapse(department.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {department.code?.substring(0, 3) || department.name.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {department.name}
                        </h2>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                          {department.code}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {department.budgetCapPercent ? `Appraisal Budget Cap: ${department.budgetCapPercent}%` : 'Standard Budget Allocation'}
                      </p>
                    </div>
                  </div>

                  {/* Right Header Stats & Badges */}
                  <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
                    {/* HOD Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-medium">
                      <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>HOD:</span>
                      <strong className="font-semibold text-amber-900 dark:text-amber-100">
                        {hod?.name || department.hodName || 'Unassigned'}
                      </strong>
                    </div>

                    {/* Managers Count Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-blue-200 text-xs font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Managers:</span>
                      <strong className="font-semibold text-blue-900 dark:text-blue-100">
                        {managersWithReports.length}
                      </strong>
                    </div>

                    {/* Total Staff Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Staff:</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {totalHeadcount} ({activeHeadcount} Active)
                      </strong>
                    </div>

                    {/* Chevron */}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                    >
                      {isDeptCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Department Details (When Expanded) */}
                {!isDeptCollapsed && (
                  <div className="p-4 sm:p-6 space-y-6 bg-slate-50/40 dark:bg-slate-900/30">
                    {/* SECTION A: HOD LEADERSHIP CARD */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        Department Leadership (HOD)
                      </h3>

                      {hod ? (
                        <div className="bg-gradient-to-r from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-800/60 flex items-center justify-center font-bold text-base shrink-0">
                              {hod.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {hod.name}
                                </h4>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                  <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" /> HOD
                                </span>
                                {getStatusBadge(hod.status)}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {hod.designationName || 'Department Head'}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{hod.employeeCode}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" /> {hod.email}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <CycleBadge
                              code={hod.cycleCode}
                              color={hod.cycleColor}
                              size="sm"
                              showTooltip
                            />
                            {isHRorAdmin && onEditEmployee && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditEmployee(hod!);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit HOD Profile"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>No HOD assigned to this department yet.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION B: MANAGERS AND THEIR ASSIGNED EMPLOYEES */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                          Department Managers & Teams ({managersWithReports.length})
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          Shows each manager and their assigned direct reports
                        </span>
                      </div>

                      {managersWithReports.length === 0 ? (
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                          No intermediate managers in this department. All team members report directly to the HOD.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {managersWithReports.map(({ manager, directReports }) => {
                            const isManagerCollapsed = Boolean(collapsedManagers[manager.id]);

                            return (
                              <div
                                key={manager.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden"
                              >
                                {/* Manager Header Bar */}
                                <div
                                  onClick={() => toggleManagerCollapse(manager.id)}
                                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center font-bold text-xs shrink-0">
                                      {manager.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                          {manager.name}
                                        </h4>
                                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                          MANAGER
                                        </span>
                                        {getStatusBadge(manager.status)}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span>{manager.designationName || 'Manager'}</span>
                                        <span>•</span>
                                        <span className="font-mono">{manager.employeeCode}</span>
                                        <span>•</span>
                                        <span>{manager.email}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assigned Employees Count Badge */}
                                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{directReports.length} Direct Reports Assigned</span>
                                    </div>

                                    {isHRorAdmin && onEditEmployee && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditEmployee(manager);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Edit Manager"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                      {isManagerCollapsed ? (
                                        <ChevronRight className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Direct Reports Table / List (When Expanded) */}
                                {!isManagerCollapsed && (
                                  <div className="p-3 sm:p-4">
                                    {directReports.length === 0 ? (
                                      <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                                        No employees currently assigned under this manager.
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                          <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                                              <th className="pb-2 pl-2 font-semibold">Assigned Employee</th>
                                              <th className="pb-2 font-semibold">Designation</th>
                                              <th className="pb-2 font-semibold">Appraisal Cycle</th>
                                              <th className="pb-2 font-semibold">Status</th>
                                              <th className="pb-2 font-semibold">Joining Date</th>
                                              {isHRorAdmin && <th className="pb-2 text-right pr-2 font-semibold">Action</th>}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {directReports.map((emp) => (
                                              <tr
                                                key={emp.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                                              >
                                                {/* Employee Name & Code */}
                                                <td className="py-2.5 pl-2">
                                                  <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                      {emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                      <span className="font-semibold text-slate-900 dark:text-white block">
                                                        {emp.name}
                                                      </span>
                                                      <span className="text-[10px] text-slate-400 font-mono">
                                                        {emp.employeeCode} • {emp.email}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </td>

                                                {/* Designation */}
                                                <td className="py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                                  {emp.designationName || 'Team Member'}
                                                </td>

                                                {/* Cycle */}
                                                <td className="py-2.5">
                                                  <CycleBadge
                                                    code={emp.cycleCode}
                                                    color={emp.cycleColor}
                                                    size="sm"
                                                    showTooltip
                                                  />
                                                </td>

                                                {/* Status */}
                                                <td className="py-2.5">
                                                  {getStatusBadge(emp.status)}
                                                </td>

                                                {/* Joining Date */}
                                                <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                                                  {emp.joiningDate
                                                    ? new Date(emp.joiningDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                      })
                                                    : '—'}
                                                </td>

                                                {/* Action */}
                                                {isHRorAdmin && (
                                                  <td className="py-2.5 text-right pr-2">
                                                    {onEditEmployee && (
                                                      <button
                                                        onClick={() => onEditEmployee(emp)}
                                                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                                                        title="Edit Employee & Reassign Manager"
                                                      >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                  </td>
                                                )}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* SECTION C: DIRECT REPORTS TO HOD OR UNASSIGNED SUB-STAFF */}
                    {directToHodOrUnassigned.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            Direct Reports to HOD / Staff ({directToHodOrUnassigned.length})
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Team members without an intermediate sub-manager
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-x-auto p-3 sm:p-4">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                                <th className="pb-2 pl-2 font-semibold">Employee</th>
                                <th className="pb-2 font-semibold">Designation</th>
                                <th className="pb-2 font-semibold">Appraisal Cycle</th>
                                <th className="pb-2 font-semibold">Reporting Line</th>
                                <th className="pb-2 font-semibold">Status</th>
                                {isHRorAdmin && <th className="pb-2 text-right pr-2 font-semibold">Action</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {directToHodOrUnassigned.map((emp) => (
                                <tr
                                  key={emp.id}
                                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                  <td className="py-2.5 pl-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                        {emp.name.charAt(0)}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-900 dark:text-white block">
                                          {emp.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {emp.employeeCode} • {emp.email}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                    {emp.designationName || 'Team Member'}
                                  </td>
                                  <td className="py-2.5">
                                    <CycleBadge
                                      code={emp.cycleCode}
                                      color={emp.cycleColor}
                                      size="sm"
                                      showTooltip
                                    />
                                  </td>
                                  <td className="py-2.5">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md font-medium">
                                      <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                      {hod?.name || 'Direct to HOD'}
                                    </span>
                                  </td>
                                  <td className="py-2.5">
                                    {getStatusBadge(emp.status)}
                                  </td>
                                  {isHRorAdmin && (
                                    <td className="py-2.5 text-right pr-2">
                                      {onEditEmployee && (
                                        <button
                                          onClick={() => onEditEmployee(emp)}
                                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                                          title="Edit Employee"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
