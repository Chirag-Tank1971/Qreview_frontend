import React, { useState, useEffect } from 'react';
import { Employee, Department, Designation, Cycle } from '../types';
import { api } from '../services/api';
import { X, Building2, Briefcase, Calendar, Shield, Mail, Hash, AlertCircle } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeToEdit?: Employee | null;
  departments: Department[];
  designations: Designation[];
  cycles: Cycle[];
  allEmployees: Employee[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employeeToEdit,
  departments,
  designations,
  cycles,
  allEmployees,
}) => {
  const isEditing = Boolean(employeeToEdit);

  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [hodId, setHodId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'NOTICE'>('ACTIVE');

  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (employeeToEdit) {
      setEmployeeCode(employeeToEdit.employeeCode || '');
      setName(employeeToEdit.name || '');
      setEmail(employeeToEdit.email || '');
      setDepartmentId(employeeToEdit.departmentId || '');
      setDesignationId(employeeToEdit.designationId || '');
      setJoiningDate(employeeToEdit.joiningDate ? employeeToEdit.joiningDate.split('T')[0] : '');
      setCycleId(employeeToEdit.cycleId || (cycles[0]?.id || ''));
      setManagerId(employeeToEdit.managerId || '');
      setHodId(employeeToEdit.hodId || '');
      setStatus(employeeToEdit.status || 'ACTIVE');
    } else {
      // Generate suggestion code
      const nextCode = `EMP-${100 + allEmployees.length + 1}`;
      setEmployeeCode(nextCode);
      setName('');
      setEmail('');
      setDepartmentId(departments[0]?.id || '');
      setDesignationId('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setCycleId(cycles[0]?.id || '');
      setManagerId('');
      setHodId('');
      setStatus('ACTIVE');
    }
    setError(null);
  }, [employeeToEdit, isOpen, departments, cycles, allEmployees]);

  // Filter designations by selected department
  useEffect(() => {
    if (departmentId) {
      const filtered = designations.filter((d) => d.departmentId === departmentId);
      setFilteredDesignations(filtered);
      if (!isEditing || !filtered.some((d) => d.id === designationId)) {
        if (filtered.length > 0) {
          setDesignationId(filtered[0].id);
        }
      }
    } else {
      setFilteredDesignations(designations);
    }
  }, [departmentId, designations]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && employeeToEdit) {
        await api.updateEmployee(employeeToEdit.id, {
          name,
          email,
          departmentId,
          designationId,
          joiningDate: new Date(joiningDate).toISOString(),
          cycleId,
          managerId: managerId || undefined,
          hodId: hodId || undefined,
          status,
        });
      } else {
        await api.createEmployee({
          employeeCode,
          name,
          email,
          departmentId,
          designationId,
          joiningDate: new Date(joiningDate).toISOString(),
          cycleId,
          managerId: managerId || undefined,
          hodId: hodId || undefined,
          status,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save employee profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Employee Master Profile' : 'Add New Employee Profile'}
            </h2>
            <p className="text-xs text-slate-500">
              Configure organizational department, role, 8-Cycle appraisal cohort & reporting hierarchy
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Code (Unique ID)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="EMP-101"
                  className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-mono ${
                    isEditing
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@company.com"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Organization & Role Mapping
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setManagerId('');
                      setHodId('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    required
                    value={designationId}
                    onChange={(e) => setDesignationId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
                  >
                    <option value="" disabled>Select Designation</option>
                    {filteredDesignations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Level {d.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Appraisal Cycle & Hierarchy Assignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Appraisal Cycle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  8-Cycle Framework Assignment
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-indigo-600 absolute left-3 top-2.5" />
                  <select
                    required
                    value={cycleId}
                    onChange={(e) => setCycleId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
                  >
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        Cycle {c.code} — {c.name} (Month: {c.appraisalMonth})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROBATION">PROBATION</option>
                  <option value="NOTICE">NOTICE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Reporting Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reporting Manager (L1 Reviewer)
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
                >
                  <option value="">None / Self-Managed</option>
                  {allEmployees
                    .filter((e) => (!employeeToEdit || e.id !== employeeToEdit.id) && (!departmentId || e.departmentId === departmentId))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designationName || 'Team Lead'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Head of Department (HOD) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head of Department (HOD Approval)
                </label>
                <select
                  value={hodId}
                  onChange={(e) => setHodId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
                >
                  <option value="">None / Direct Management</option>
                  {allEmployees
                    .filter((e) => (!employeeToEdit || e.id !== employeeToEdit.id) && (!departmentId || e.departmentId === departmentId))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.departmentName || 'HOD'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Employee' : 'Save New Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
