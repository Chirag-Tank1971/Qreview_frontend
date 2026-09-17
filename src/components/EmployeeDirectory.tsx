import React, { useState, useEffect } from 'react';
import { Employee, Department, Designation, Cycle, KraTemplate } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { EmployeeModal } from './EmployeeModal';
import { MastersManagement } from './MastersManagement';
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit2,
  Building2,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  MapPin,
  DollarSign,
  Key,
  LayoutGrid,
  List,
  Trash2,
  UserMinus,
  X,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Crown,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { User } from '../types';
import { CycleBadge } from './ui/CycleBadge';
import { PageSkeletonLoader } from './ui/PageSkeletonLoader';

interface EmployeeDirectoryProps {
  currentUser?: User | null;
  departments?: Department[];
  designations?: Designation[];
  cycles?: Cycle[];
  kraTemplates?: KraTemplate[];
  onNavigateToAppraisals?: (options?: any) => void;
  onNavigateToReviews?: (options?: any) => void;
  onNavigateToHierarchy?: () => void;
  initialConfig?: any;
  employees?: Employee[];
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  onNavigateToHierarchy,
  departments: initialDepartments,
  designations: initialDesignations,
  cycles: initialCycles,
  kraTemplates: initialKraTemplates,
  employees: initialEmployees,
}) => {
  const { user } = useAuth();
  const isHRorAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const isAdmin = user?.role === 'SUPER_ADMIN';

  // Data State initialized from props when available
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees || []);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments || []);
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations || []);
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles || []);
  const [kraTemplates, setKraTemplates] = useState<KraTemplate[]>(initialKraTemplates || []);
  const [loading, setLoading] = useState(
    !(initialEmployees && initialEmployees.length > 0 && initialDepartments && initialDepartments.length > 0)
  );

  // Sync with incoming master data props
  useEffect(() => {
    if (initialEmployees && initialEmployees.length > 0) setEmployees(initialEmployees);
    if (initialDepartments && initialDepartments.length > 0) setDepartments(initialDepartments);
    if (initialDesignations && initialDesignations.length > 0) setDesignations(initialDesignations);
    if (initialCycles && initialCycles.length > 0) setCycles(initialCycles);
    if (initialKraTemplates && initialKraTemplates.length > 0) setKraTemplates(initialKraTemplates);
    if (initialEmployees && initialEmployees.length > 0) setLoading(false);
  }, [initialEmployees, initialDepartments, initialDesignations, initialCycles, initialKraTemplates]);

  // Delete Employee Modal State
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Pagination State (20 employees per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedCycle, selectedStatus]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'employees' | 'masters'>('employees');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isRehireInitial, setIsRehireInitial] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desRes, cycRes, kraRes] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
        api.getDesignations(),
        api.getCycles(),
        api.getKraTemplates().catch(() => []),
      ]);
      setEmployees(empRes);
      setDepartments(deptRes);
      setDesignations(desRes);
      setCycles(cycRes);
      setKraTemplates(kraRes || []);
    } catch (err) {
      console.error('Failed to load employee master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only trigger remote fetch if props were not provided
    if (!initialEmployees || initialEmployees.length === 0) {
      loadData();
    }
  }, []);

  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    if (!isAdmin) {
      toast.error('Access denied: Only System Administrators can delete and archive employee data.', 'Permission Denied');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await api.deleteEmployee(employeeToDelete.id);
      toast.success(res.message || `Employee "${employeeToDelete.name}" archived as Past Employee and performance data deleted.`, 'Employee Archived');
      setEmployeeToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee data', 'Action Failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered employees calculation
  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept && emp.departmentId !== selectedDept) return false;
    if (selectedCycle && emp.cycleId !== selectedCycle && emp.cycleCode !== selectedCycle) return false;
    if (selectedStatus) {
      if (selectedStatus === 'INACTIVE') {
        if (emp.status !== 'INACTIVE' && !emp.isPastEmployee) return false;
      } else if (emp.status !== selectedStatus) {
        return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.departmentName && emp.departmentName.toLowerCase().includes(q)) ||
        (emp.designationName && emp.designationName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Pagination Calculations (20 per page)
  const totalFilteredCount = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredCount);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Helper for generating page numbers with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  };

  // KPI Metrics
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const uniqueDeptCount = new Set(employees.map((e) => e.departmentId).filter(Boolean)).size || departments.length;
  const hasActiveFilters = Boolean(searchQuery || selectedDept || selectedCycle || selectedStatus);

  const getStatusBadge = (status: string, isPastEmployee?: boolean) => {
    if (status === 'INACTIVE' || isPastEmployee) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
          <UserMinus className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Past Employee
        </span>
      );
    }
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Active
          </span>
        );
      case 'PROBATION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Probation
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Notice
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  if (!employees || employees.length === 0) {
    return <PageSkeletonLoader variant="table" rowCount={7} />;
  }

  return (
    <div className="space-y-6">
      {/* Native Page Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Employee Directory & Masters
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Headcount directory, 8-Cycle appraisal cohorts, departments, and reviewer assignments.
          </p>
        </div>

        {/* View Switcher and Primary Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'employees'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Employees ({employees.length})
            </button>
            {isHRorAdmin && (
              <button
                onClick={() => setActiveTab('masters')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'masters'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Departments & Roles
              </button>
            )}
          </div>

          {isHRorAdmin && activeTab === 'employees' && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: EMPLOYEES DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Employees Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Employees
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                  {totalEmployeesCount}
                </span>
                {hasActiveFilters && (
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
                    {filteredEmployees.length} filtered
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {hasActiveFilters ? 'Active filters applied' : 'Registered headcount'}
              </p>
            </div>

            {/* Active Workforce Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active Workforce
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                  {activeEmployeesCount}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                  {totalEmployeesCount > 0 ? Math.round((activeEmployeesCount / totalEmployeesCount) * 100) : 0}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Active member ratio
              </p>
            </div>

            {/* Departments Box */}
            <div
              onClick={() => {
                if (onNavigateToHierarchy) {
                  onNavigateToHierarchy();
                } else {
                  window.location.hash = '#hierarchy';
                }
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer group"
              title="Click to view Department & Manager Hierarchy"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Departments
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                  {departments.length || uniqueDeptCount}
                </span>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                  {designations.length} roles
                </span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5 mt-1 font-medium">
                View Org & Manager Hierarchy →
              </p>
            </div>

            {/* Review Cohorts Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Review Cohorts
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                  {cycles.length || 8}
                </span>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded">
                  Cycles A–H
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Staggered review schedules
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2.5 rounded-xl shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, employee code, email..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns and Actions Cluster */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Department Select */}
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="h-9 pl-2.5 pr-7 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Cycle Select */}
              <div className="relative">
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="h-9 pl-2.5 pr-7 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">All Cycles (A-H)</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.startsWith('Cycle') ? c.name : `Cycle ${c.code} (${c.name})`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Select */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 pl-2.5 pr-7 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PROBATION">Probation</option>
                  <option value="NOTICE">Notice</option>
                  <option value="INACTIVE">Past Employees</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Clear filters button if active */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('');
                    setSelectedCycle('');
                    setSelectedStatus('');
                  }}
                  className="h-9 px-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 font-medium transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              )}

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />

              {/* Refresh button */}
              <button
                onClick={loadData}
                title="Refresh Directory"
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Cards / Table View Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Employees Display: Cards or Table */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {loading ? (
                <div className="col-span-full p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  Loading employee records...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  No employees found matching the filters.
                </div>
              ) : (
                paginatedEmployees.map((emp) => {
                  const cycleInfo = cycles.find((c) => c.id === emp.cycleId || c.code === emp.cycleCode);
                  return (
                    <div
                      key={emp.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{emp.name}</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{emp.employeeCode} • {emp.email}</p>
                            </div>
                          </div>
                          {getStatusBadge(emp.status, emp.isPastEmployee)}
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.designationName || 'Role'} • {emp.departmentName || 'Dept'}</span>
                          </div>
                          {cycleInfo && (
                            <div className="flex items-center gap-1.5">
                              <CycleBadge code={emp.cycleCode || cycleInfo.code} />
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">({cycleInfo.name})</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span>Manager: <strong className="text-slate-700 dark:text-slate-300">{emp.managerName || 'None'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        {(emp.status === 'INACTIVE' || emp.isPastEmployee) ? (
                          <div>
                            <span className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold block leading-tight">
                              Relieved On
                            </span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {(emp.relievingDate || emp.pastEmployeeDate)
                                ? new Date(emp.relievingDate || emp.pastEmployeeDate!).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                                : 'Date not recorded'}
                            </span>
                          </div>
                        ) : isHRorAdmin ? (
                          <div>
                            <span className="text-[10px] text-slate-400 block leading-tight">Starting CTC</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {emp.currency || '₹'}{(emp.currentCtc || 1600000).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            Joined {new Date(emp.joiningDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                          </div>
                        )}

                        {isHRorAdmin && (
                          <div className="flex items-center gap-1.5">
                            {(emp.status === 'INACTIVE' || emp.isPastEmployee) && (
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setIsRehireInitial(true);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 px-2.5 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Rehire past employee and reactivate profile"
                              >
                                <UserCheck className="w-3 h-3" /> Rehire
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setIsRehireInitial(false);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 px-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            {isAdmin && emp.status !== 'INACTIVE' && !emp.isPastEmployee && (
                              <button
                                onClick={() => setEmployeeToDelete(emp)}
                                className="p-1.5 px-2 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                                title="Delete employee data & archive as past employee (Admin Only)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Department & Role</th>
                      <th className="px-4 py-3.5">Appraisal Cycle</th>
                      <th className="px-4 py-3.5">Reporting Hierarchy</th>
                      {isHRorAdmin && <th className="px-4 py-3.5">Starting CTC</th>}
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Joining / Relieving Date</th>
                      {isHRorAdmin && <th className="px-4 py-3.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {loading ? (
                      <tr>
                        <td colSpan={isHRorAdmin ? 8 : 6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                          Loading employee records...
                        </td>
                      </tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={isHRorAdmin ? 8 : 6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                          No employees found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((emp) => {
                        const cycleInfo = cycles.find((c) => c.id === emp.cycleId || c.code === emp.cycleCode);
                        return (
                          <tr
                            key={emp.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            {/* Employee Info */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs">
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {emp.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    {emp.employeeCode} • {emp.email}
                                  </div>
                                  {(emp.location || emp.phone) && (
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      {emp.location && (
                                        <span className="flex items-center gap-0.5">
                                          <MapPin className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                                          {emp.location}
                                        </span>
                                      )}
                                      {emp.phone && <span>• {emp.phone}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Dept & Role */}
                            <td className="px-4 py-3.5">
                              <div className="text-slate-900 dark:text-slate-200 font-medium flex items-center gap-1.5 flex-wrap">
                                <span>{emp.designationName || 'Designation'}</span>
                                {emp.hasLoginAccount && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                    title={`Portal Sign-In Active (${emp.systemRole || 'User'})`}
                                  >
                                    <Key className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
                                    {emp.systemRole || 'Portal Active'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                {emp.departmentName || 'Department'}
                              </div>
                            </td>

                            {/* Cycle */}
                            <td className="px-4 py-3.5">
                              <CycleBadge code={emp.cycleCode || cycleInfo?.code || 'A'} />
                            </td>

                            {/* Hierarchy */}
                            <td className="px-4 py-3.5">
                              <div className="text-[11px] text-slate-700 dark:text-slate-300">
                                <span className="text-slate-400 dark:text-slate-500">Manager:</span>{' '}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {emp.managerName || 'Direct'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="text-slate-400 dark:text-slate-500">HOD:</span> {emp.hodName || 'Dept Head'}
                              </div>
                            </td>

                            {/* Compensation */}
                            {isHRorAdmin && (
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-slate-900 dark:text-white font-mono text-[11px]">
                                  {emp.currency || '₹'}{(emp.currentCtc || 1600000).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                  Annual CTC
                                </div>
                              </td>
                            )}

                            {/* Status */}
                            <td className="px-4 py-3.5">{getStatusBadge(emp.status, emp.isPastEmployee)}</td>

                            {/* Joining / Relieving Date */}
                            <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                              <div>
                                <span className="text-slate-400 dark:text-slate-500">Joined: </span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {emp.joiningDate
                                    ? new Date(emp.joiningDate).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                    : '—'}
                                </span>
                              </div>
                              {(emp.status === 'INACTIVE' || emp.isPastEmployee) && (
                                <div className="mt-1 flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                  <span className="text-rose-500/80">Relieved: </span>
                                  <span>
                                    {(emp.relievingDate || emp.pastEmployeeDate)
                                      ? new Date(emp.relievingDate || emp.pastEmployeeDate!).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                      : 'Not set'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            {isHRorAdmin && (
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {(emp.status === 'INACTIVE' || emp.isPastEmployee) && (
                                    <button
                                      onClick={() => {
                                        setEditingEmployee(emp);
                                        setIsRehireInitial(true);
                                        setIsModalOpen(true);
                                      }}
                                      className="px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                      title="Rehire past employee and reactivate profile"
                                    >
                                      <UserCheck className="w-3 h-3" /> Rehire
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingEmployee(emp);
                                      setIsRehireInitial(false);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit employee & cycle assignment"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {isAdmin && emp.status !== 'INACTIVE' && !emp.isPastEmployee && (
                                    <button
                                      onClick={() => setEmployeeToDelete(emp)}
                                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Delete employee data & archive as past employee (Admin Only)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Footer Controls (20 per page) */}
          {totalFilteredCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-medium">
                <span>
                  Showing <strong className="text-slate-800 dark:text-slate-200">{startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> of{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{totalFilteredCount}</strong> employees
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                  20 per page
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={safeCurrentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageItem, idx) => {
                      if (pageItem === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 dark:text-slate-600 select-none">
                            •••
                          </span>
                        );
                      }
                      const pageNum = pageItem as number;
                      const isActive = pageNum === safeCurrentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={safeCurrentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
                    title="Next Page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MASTERS (DEPARTMENTS & DESIGNATIONS) */}
      {activeTab === 'masters' && isHRorAdmin && (
        <MastersManagement
          departments={departments}
          designations={designations}
          employees={employees}
          cycles={cycles}
          onRefresh={loadData}
        />
      )}

      {/* Edit / Add Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsRehireInitial(false);
        }}
        onSaved={loadData}
        employeeToEdit={editingEmployee}
        initialRehire={isRehireInitial}
        departments={departments}
        designations={designations}
        cycles={cycles}
        allEmployees={employees}
        kraTemplates={kraTemplates}
      />

      {/* Delete Employee Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 shrink-0">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Employee & Archive as Past Employee
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Purge performance data while keeping directory record
                  </p>
                </div>
              </div>
              <button
                onClick={() => !deleteLoading && setEmployeeToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                    {employeeToDelete.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {employeeToDelete.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {employeeToDelete.designationName || 'Designation'} • {employeeToDelete.departmentName || 'Department'}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block truncate">
                      {employeeToDelete.employeeCode} • {employeeToDelete.email}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {getStatusBadge(employeeToDelete.status, employeeToDelete.isPastEmployee)}
                </div>
              </div>

              {/* Leadership Impact Notice (If HOD or Manager) */}
              {(() => {
                const managedReports = employees.filter((e) => e.managerId === employeeToDelete.id && e.status !== 'INACTIVE');
                const ledDepartments = departments.filter((d) => d.hodId === employeeToDelete.id);
                if (managedReports.length === 0 && ledDepartments.length === 0) return null;

                return (
                  <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Leadership Assignment Impact:</span>
                    </div>
                    {managedReports.length > 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        Reporting Manager for <strong>{managedReports.length} active employee(s)</strong> ({managedReports.slice(0, 3).map((e) => e.name).join(', ')}{managedReports.length > 3 ? ` +${managedReports.length - 3} more` : ''}). Their manager will automatically be set to <strong>&quot;Unassigned&quot;</strong>.
                      </p>
                    )}
                    {ledDepartments.length > 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        Designated HOD for <strong>{ledDepartments.map((d) => d.name).join(', ')}</strong>. The department HOD will be reset to <strong>&quot;Unassigned&quot;</strong>.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Data Purge Breakdown Notice */}
              <div className="space-y-2.5">
                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>The following data will be PERMANENTLY deleted:</span>
                  </div>
                  <ul className="text-[11px] space-y-1 text-rose-700 dark:text-rose-300/90 pl-4 list-disc">
                    <li>All 4-quarter reviews, ratings, and self-evaluation submissions</li>
                    <li>All annual appraisal decision records and compensation letters</li>
                    <li>All 360-degree peer feedback requests and responses</li>
                    <li>User portal login account & credentials (portal sign-in revoked)</li>
                    <li>Unassigned as manager or HOD for any direct reports</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>What will be preserved:</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                    Identity details (Name, Employee Code, Department, Designation, and Joining Date) will remain preserved in the directory with status <strong>Past Employee</strong> for corporate compliance and historical service reference.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteEmployee}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deleteLoading ? 'Purging & Archiving...' : 'Confirm Deletion & Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
