import React, { useState } from 'react';
import { Department, Designation, Employee, Cycle } from '../types';
import { api } from '../services/api';
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

      setDeptName('');
      setDeptCode('');
      setDeptHodId('');
      setDeptSuccess(true);
      onRefresh();
      setTimeout(() => setDeptSuccess(false), 3000);
    } catch (err: any) {
      setDeptError(err.message || 'Failed to create department');
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

      setDesName('');
      setDesSuccess(true);
      onRefresh();
      setTimeout(() => setDesSuccess(false), 3000);
    } catch (err: any) {
      setDesError(err.message || 'Failed to create designation');
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
      onRefresh();
    } catch (err: any) {
      setCycleError(err.message || 'Failed to update cycle');
    } finally {
      setCycleLoading(false);
    }
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Master */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department Master</h3>
                <p className="text-xs text-slate-500">Manage business units & Head of Departments (HOD)</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {departments.length} Units
            </span>
          </div>

          {/* New Dept Form */}
          <form onSubmit={handleCreateDepartment} className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800">Add New Department</h4>

            {deptError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{deptError}</span>
              </div>
            )}

            {deptSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Department created successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. ENG"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Designated HOD</label>
              <select
                value={deptHodId}
                onChange={(e) => setDeptHodId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
              >
                <option value="">Select Department Head (HOD)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={deptLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{deptLoading ? 'Creating...' : 'Create Department'}</span>
            </button>
          </form>

          {/* List of Departments */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Departments</h4>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              {departments.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs">{d.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600 border border-slate-200">
                        {d.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      HOD: <span className="text-slate-700 font-medium">{d.hodName || 'Not assigned'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Designation Master */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Designation & Role Master</h3>
                <p className="text-xs text-slate-500">Configure hierarchy levels & role titles per department</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {designations.length} Roles
            </span>
          </div>

          {/* New Des Form */}
          <form onSubmit={handleCreateDesignation} className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800">Add New Designation</h4>

            {desError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{desError}</span>
              </div>
            )}

            {desSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Designation created successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Designation Title</label>
                <input
                  type="text"
                  required
                  value={desName}
                  onChange={(e) => setDesName(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hierarchy Level</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={desLevel}
                  onChange={(e) => setDesLevel(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Associated Department</label>
              <select
                value={desDeptId}
                onChange={(e) => setDesDeptId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={desLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{desLoading ? 'Creating...' : 'Create Designation'}</span>
            </button>
          </form>

          {/* List of Designations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Designations</h4>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              {designations.map((des) => (
                <div key={des.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs">{des.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600 border border-slate-200">
                        Level {des.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Dept: {departments.find((d) => d.id === des.departmentId)?.name || 'General'}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Role Tier {des.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Master */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">8-Cycle Framework Master</h3>
              <p className="text-xs text-slate-500">Configure appraisal months and cycle designations</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {cycles?.length || 0} Cycles
          </span>
        </div>

        {cycleError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{cycleError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cycles?.map((cycle) => (
            <div key={cycle.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
              {editingCycleId === cycle.id ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-xs">Edit Cycle {cycle.code}</span>
                    <button onClick={() => setEditingCycleId(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Cycle Name</label>
                    <input
                      type="text"
                      value={editCycleData.name}
                      onChange={(e) => setEditCycleData({ ...editCycleData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Appraisal Month</label>
                    <select
                      value={editCycleData.appraisalMonth}
                      onChange={(e) => setEditCycleData({ ...editCycleData, appraisalMonth: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      {monthNames.map((month, idx) => (
                        <option key={idx + 1} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleUpdateCycle(cycle.id)}
                    disabled={cycleLoading}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
                        <span className="font-bold text-slate-900 text-sm">{cycle.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCycleId(cycle.id);
                          setEditCycleData({ name: cycle.name, appraisalMonth: cycle.appraisalMonth, description: cycle.description });
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Cycle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-3">{cycle.description}</div>
                    
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">
                        Appraisal Month: <span className="font-bold text-slate-900">{monthNames[cycle.appraisalMonth - 1]}</span>
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
