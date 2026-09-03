import React, { useState, useEffect } from 'react';
import { Employee, Department, Designation, Cycle } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

export const EmployeeDirectory: React.FC = () => {
  const { user } = useAuth();
  const isHRorAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';

  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'employees' | 'masters' | 'cycles'>('employees');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desRes, cycRes] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
        api.getDesignations(),
        api.getCycles(),
      ]);
      setEmployees(empRes);
      setDepartments(deptRes);
      setDesignations(desRes);
      setCycles(cycRes);
    } catch (err) {
      console.error('Failed to load employee master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered employees calculation
  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept && emp.departmentId !== selectedDept) return false;
    if (selectedCycle && emp.cycleId !== selectedCycle) return false;
    if (selectedStatus && emp.status !== selectedStatus) return false;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
          </span>
        );
      case 'PROBATION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            <Clock className="w-3 h-3 text-amber-600" /> Probation
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Notice
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            Inactive
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Organization & Employee Masters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee directories, 8-Cycle appraisal cohorts, departments, and reviewer hierarchies
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'employees'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employee Directory ({employees.length})
          </button>
          {isHRorAdmin && (
            <button
              onClick={() => setActiveTab('masters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'masters'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Departments & Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab('cycles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'cycles'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            8-Cycle Cohort Map
          </button>
        </div>
      </div>

      {/* VIEW 1: EMPLOYEES DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, employee code, email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none font-medium"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none font-medium"
                >
                  <option value="">All Cycles (A-H)</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.startsWith('Cycle') ? c.name : `Cycle ${c.code} (${c.name})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PROBATION">Probation</option>
                  <option value="NOTICE">Notice</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <button
                onClick={loadData}
                title="Refresh Directory"
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {isHRorAdmin && (
                <button
                  onClick={() => {
                    setEditingEmployee(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors ml-auto lg:ml-0"
                >
                  <Plus className="w-4 h-4" /> Add Employee
                </button>
              )}
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Department & Role</th>
                    <th className="px-4 py-3.5">Appraisal Cycle</th>
                    <th className="px-4 py-3.5">Reporting Hierarchy</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Joining Date</th>
                    {isHRorAdmin && <th className="px-4 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Loading employee records...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const cycleInfo = cycles.find((c) => c.id === emp.cycleId);
                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Employee Info */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs shadow-2xs">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {emp.employeeCode} • {emp.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dept & Role */}
                          <td className="px-4 py-3.5">
                            <div className="text-slate-900 font-medium">
                              {emp.designationName || 'Designation'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {emp.departmentName || 'Department'}
                            </div>
                          </td>

                          {/* Cycle */}
                          <td className="px-4 py-3.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]">
                              <span>Cycle {emp.cycleCode || cycleInfo?.code || 'A'}</span>
                              <span className="text-indigo-900/60 font-normal">
                                ({emp.cycleName || cycleInfo?.name})
                              </span>
                            </div>
                          </td>

                          {/* Hierarchy */}
                          <td className="px-4 py-3.5">
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-400">Manager:</span>{' '}
                              <span className="font-semibold text-slate-900">
                                {emp.managerName || 'Direct'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span className="text-slate-400">HOD:</span> {emp.hodName || 'Dept Head'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">{getStatusBadge(emp.status)}</td>

                          {/* Joining Date */}
                          <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                            {new Date(emp.joiningDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          {/* Actions */}
                          {isHRorAdmin && (
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Edit employee & cycle assignment"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* VIEW 3: 8-CYCLE OVERVIEW & MAPPING */}
      {activeTab === 'cycles' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-indigo-600" />
              8-Cycle Framework (Cohorts A through H)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Employees are grouped into 8 rolling quarterly cohorts to distribute appraisal workloads
              evenly across the calendar year.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cycles.map((c) => {
                const count = employees.filter((e) => e.cycleId === c.id || e.cycleCode === c.code).length;
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-white text-indigo-700 border border-slate-200 shadow-2xs">
                          Cycle {c.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {count} Employees
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{c.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Appraisal: Month {c.appraisalMonth}</span>
                      <span className="text-emerald-700 font-semibold">Active Cohort</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        employeeToEdit={editingEmployee}
        departments={departments}
        designations={designations}
        cycles={cycles}
        allEmployees={employees}
      />
    </div>
  );
};
