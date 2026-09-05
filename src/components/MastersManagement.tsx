import React, { useState } from 'react';
import { Department, Designation, Employee, Cycle } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import { Plus, Building2, Briefcase, Check, AlertCircle, Calendar, Edit2, X, Save } from 'lucide-react';

interface MastersManagementProps {
  departments: Department[];
  designations: Designation[];
  employees: Employee[];
  cycles: Cycle[];
  onRefresh: () => void;
}

export const MastersManagement: React.FC<MastersManagementProps> = ({
  departments,
  designations,
  employees,
  cycles,
  onRefresh,
}) => {
  // Department Form State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHodId, setDeptHodId] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptSuccess, setDeptSuccess] = useState(false);

  // Designation Form State
  const [desName, setDesName] = useState('');
  const [desDeptId, setDesDeptId] = useState(departments[0]?.id || '');
  const [desLevel, setDesLevel] = useState(1);
  const [desLoading, setDesLoading] = useState(false);
  const [desError, setDesError] = useState<string | null>(null);
  const [desSuccess, setDesSuccess] = useState(false);

  // Cycle Form State
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [editCycleData, setEditCycleData] = useState<{name: string, appraisalMonth: number, description: string}>({ name: '', appraisalMonth: 1, description: '' });
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);
    setDeptSuccess(false);
    setDeptLoading(true);

    try {
      const selectedHod = employees.find((emp) => emp.id === deptHodId);
      await api.createDepartment({
        name: deptName,
        code: deptCode,
        hodId: deptHodId || undefined,
        hodName: selectedHod?.name || undefined,
      });

      toast.success(`Department "${deptName}" (${deptCode}) created successfully.`, 'Department Created');
      setDeptName('');
      setDeptCode('');
      setDeptHodId('');
      setDeptSuccess(true);
      onRefresh();
      setTimeout(() => setDeptSuccess(false), 3000);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to create department';
      setDeptError(errMsg);
      toast.error(errMsg, 'Department Error');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    setDesError(null);
    setDesSuccess(false);
    setDesLoading(true);

    try {
      await api.createDesignation({
        name: desName,
        departmentId: desDeptId || departments[0]?.id,
        level: desLevel,
      });

      toast.success(`Designation "${desName}" created successfully.`, 'Designation Created');
      setDesName('');
      setDesSuccess(true);
      onRefresh();
      setTimeout(() => setDesSuccess(false), 3000);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to create designation';
      setDesError(errMsg);
      toast.error(errMsg, 'Designation Error');
    } finally {
      setDesLoading(false);
    }
  };

  const handleUpdateCycle = async (cycleId: string) => {
    setCycleError(null);
    setCycleLoading(true);
    try {
      await api.updateCycle(cycleId, editCycleData);
      setEditingCycleId(null);
      toast.success(`Cycle "${editCycleData.name}" updated successfully.`, 'Cohort Cycle Saved');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to update cycle';
      setCycleError(errMsg);
      toast.error(errMsg, 'Cycle Error');
    } finally {
      setCycleLoading(false);
    }
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Master */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Master</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage business units & Head of Departments (HOD)</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {departments.length} Units
            </span>
          </div>

          {/* New Dept Form */}
          <form onSubmit={handleCreateDepartment} className="space-y-3 bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Add New Department</h4>

            {deptError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{deptError}</span>
              </div>
            )}

            {deptSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Department created successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. ENG"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Designated HOD</label>
              <select
                value={deptHodId}
                onChange={(e) => setDeptHodId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 font-medium"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Department Head (HOD)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={deptLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{deptLoading ? 'Creating...' : 'Create Department'}</span>
            </button>
          </form>

          {/* List of Departments */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Departments</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              {departments.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">{d.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {d.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      HOD: <span className="text-slate-700 dark:text-slate-200 font-medium">{d.hodName || 'Not assigned'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Designation Master */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Designation & Role Master</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure hierarchy levels & role titles per department</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {designations.length} Roles
            </span>
          </div>

          {/* New Des Form */}
          <form onSubmit={handleCreateDesignation} className="space-y-3 bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Add New Designation</h4>

            {desError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{desError}</span>
              </div>
            )}

            {desSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Designation created successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation Title</label>
                <input
                  type="text"
                  required
                  value={desName}
                  onChange={(e) => setDesName(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Hierarchy Level</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={desLevel}
                  onChange={(e) => setDesLevel(parseInt(e.target.value) || 1)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Associated Department</label>
              <select
                value={desDeptId}
                onChange={(e) => setDesDeptId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 font-medium"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={desLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{desLoading ? 'Creating...' : 'Create Designation'}</span>
            </button>
          </form>

          {/* List of Designations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Designations</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              {designations.map((des) => (
                <div key={des.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">{des.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Level {des.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Dept: {departments.find((d) => d.id === des.departmentId)?.name || 'General'}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium">
                    Role Tier {des.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Master */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">8-Cycle Framework Master</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure appraisal months and cycle designations</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {cycles?.length || 0} Cycles
          </span>
        </div>

        {cycleError && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{cycleError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cycles?.map((cycle) => (
            <div key={cycle.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 shadow-xs flex flex-col justify-between">
              {editingCycleId === cycle.id ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">Edit Cycle {cycle.code}</span>
                    <button onClick={() => setEditingCycleId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cycle Name</label>
                    <input
                      type="text"
                      value={editCycleData.name}
                      onChange={(e) => setEditCycleData({ ...editCycleData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Appraisal Month</label>
                    <select
                      value={editCycleData.appraisalMonth}
                      onChange={(e) => setEditCycleData({ ...editCycleData, appraisalMonth: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      {monthNames.map((month, idx) => (
                        <option key={idx + 1} value={idx + 1} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{month}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleUpdateCycle(cycle.id)}
                    disabled={cycleLoading}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cycle.colorHex }}></div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{cycle.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCycleId(cycle.id);
                          setEditCycleData({ name: cycle.name, appraisalMonth: cycle.appraisalMonth, description: cycle.description });
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                        title="Edit Cycle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{cycle.description}</div>
                    
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Appraisal Month: <span className="font-bold text-slate-900 dark:text-white">{monthNames[cycle.appraisalMonth - 1]}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
