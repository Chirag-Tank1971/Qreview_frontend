import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Employee, Department, Designation, Cycle, KraTemplate, UserRole, CreateEmployeeResponse } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import {
  X,
  Building2,
  Briefcase,
  Calendar,
  Shield,
  Mail,
  Hash,
  AlertCircle,
  Phone,
  MapPin,
  DollarSign,
  Key,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  ChevronRight,
  ChevronLeft,
  Lock,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeToEdit?: Employee | null;
  departments: Department[];
  designations: Designation[];
  cycles: Cycle[];
  allEmployees: Employee[];
  kraTemplates?: KraTemplate[];
}

type TabType = 'profile' | 'hierarchy' | 'compensation' | 'access';

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employeeToEdit,
  departments,
  designations,
  cycles,
  allEmployees,
  kraTemplates = [],
}) => {
  const isEditing = Boolean(employeeToEdit);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Tab 1: Profile & Organization
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Bangalore HQ');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'NOTICE'>('ACTIVE');

  // Tab 2: Hierarchy & Performance
  const [cycleId, setCycleId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [hodId, setHodId] = useState('');
  const [currentKraTemplateId, setCurrentKraTemplateId] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<KraTemplate[]>(kraTemplates);

  // Tab 3: Compensation & Payroll
  const [currentCtc, setCurrentCtc] = useState<number | string>(1800000);
  const [currency, setCurrency] = useState('₹');

  // Tab 4: System Access & Login
  const [provisionLogin, setProvisionLogin] = useState(true);
  const [systemRole, setSystemRole] = useState<UserRole>('EMPLOYEE');
  const [hasUserManuallyChangedRole, setHasUserManuallyChangedRole] = useState(false);
  const [initialPassword, setInitialPassword] = useState('Welcome@2026');
  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Onboarding Card State
  const [createdResponse, setCreatedResponse] = useState<CreateEmployeeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Load KRA templates if not provided via props
  useEffect(() => {
    if (kraTemplates && kraTemplates.length > 0) {
      setAvailableTemplates(kraTemplates);
    } else if (isOpen) {
      api.getKraTemplates().then((res) => {
        if (res && res.length > 0) setAvailableTemplates(res);
      }).catch(() => {});
    }
  }, [isOpen, kraTemplates]);

  // Helper to check if designation is managerial
  const isManagerDesignation = (desName?: string, level?: number) => {
    if (!desName) return false;
    const lower = desName.toLowerCase();
    return (
      lower.includes('manager') ||
      lower.includes('lead') ||
      lower.includes('head') ||
      lower.includes('director') ||
      lower.includes('vp') ||
      lower.includes('supervisor') ||
      lower.includes('principal') ||
      lower.includes('chief') ||
      lower.includes('coordinator') ||
      lower.includes('hod') ||
      (level !== undefined && level >= 2)
    );
  };

  // Auto infer default role based on designation
  const inferDefaultRole = (desigId: string): UserRole => {
    const des = designations.find((d) => d.id === desigId);
    if (!des) return 'EMPLOYEE';
    const lower = des.name.toLowerCase();
    if (lower.includes('hr manager') || lower.includes('hr lead') || lower.includes('people')) return 'HR';
    if (lower.includes('vp') || lower.includes('director') || lower.includes('hod') || des.level >= 4) return 'HOD';
    if (lower.includes('manager') || lower.includes('lead') || des.level >= 3) return 'MANAGER';
    return 'EMPLOYEE';
  };

  // Initialize or reset form
  useEffect(() => {
    if (employeeToEdit) {
      setEmployeeCode(employeeToEdit.employeeCode || '');
      setName(employeeToEdit.name || '');
      setEmail(employeeToEdit.email || '');
      setPhone(employeeToEdit.phone || '');
      setLocation(employeeToEdit.location || 'Bangalore HQ');
      setDepartmentId(employeeToEdit.departmentId || '');
      setDesignationId(employeeToEdit.designationId || '');
      setJoiningDate(employeeToEdit.joiningDate ? employeeToEdit.joiningDate.split('T')[0] : '');
      setCycleId(employeeToEdit.cycleId || (cycles[0]?.id || ''));
      setManagerId(employeeToEdit.managerId || '');
      setHodId(employeeToEdit.hodId || '');
      setCurrentKraTemplateId(employeeToEdit.currentKraTemplateId || '');
      setCurrentCtc(employeeToEdit.currentCtc !== undefined ? employeeToEdit.currentCtc : 1800000);
      setCurrency(employeeToEdit.currency || '₹');
      setStatus(employeeToEdit.status || 'ACTIVE');

      const initialHasAccount = employeeToEdit.hasLoginAccount !== undefined
        ? Boolean(employeeToEdit.hasLoginAccount)
        : (employeeToEdit.userActive !== undefined ? Boolean(employeeToEdit.userActive) : true);

      setProvisionLogin(initialHasAccount);
      setSystemRole(employeeToEdit.systemRole || inferDefaultRole(employeeToEdit.designationId));
      setHasUserManuallyChangedRole(Boolean(employeeToEdit.systemRole));
      setInitialPassword('');

      // Fetch fresh record from server to ensure 100% authoritative access status
      api.getEmployeeById(employeeToEdit.id).then((freshEmp) => {
        if (freshEmp && freshEmp.id === employeeToEdit.id) {
          if (freshEmp.hasLoginAccount !== undefined) {
            setProvisionLogin(Boolean(freshEmp.hasLoginAccount));
          }
          if (freshEmp.systemRole) {
            setSystemRole(freshEmp.systemRole);
          }
        }
      }).catch(() => {});
    } else {
      const maxNum = (allEmployees || []).reduce((max, emp) => {
        const match = emp.employeeCode?.match(/EMP-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextCode = `EMP-${String(maxNum + 1).padStart(3, '0')}`;
      const defaultDept = departments[0]?.id || '';
      const defaultDeptObj = departments.find((d) => d.id === defaultDept);

      setEmployeeCode(nextCode);
      setName('');
      setEmail('');
      setPhone('');
      setLocation('Bangalore HQ');
      setDepartmentId(defaultDept);
      setDesignationId('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setCycleId(cycles[0]?.id || '');
      setManagerId('');
      setHodId(defaultDeptObj?.hodId || '');
      setCurrentKraTemplateId('');
      setCurrentCtc(1800000);
      setCurrency('₹');
      setStatus('ACTIVE');
      setProvisionLogin(true);
      setInitialPassword(`Welcome@${new Date().getFullYear()}`);
      setSystemRole('EMPLOYEE');
      setHasUserManuallyChangedRole(false);
    }
    setActiveTab('profile');
    setError(null);
    setCreatedResponse(null);
  }, [employeeToEdit, isOpen, departments, cycles, allEmployees]);

  // Selected Department Details
  const selectedDeptObj = departments.find((d) => d.id === departmentId);

  // Filter designations by selected department
  useEffect(() => {
    if (departmentId) {
      const filtered = designations.filter((d) => d.departmentId === departmentId);
      setFilteredDesignations(filtered);
      if (!isEditing || !filtered.some((d) => d.id === designationId)) {
        if (filtered.length > 0) {
          const nextDesId = filtered[0].id;
          setDesignationId(nextDesId);
          if (!hasUserManuallyChangedRole) {
            setSystemRole(inferDefaultRole(nextDesId));
          }
        }
      }
    } else {
      setFilteredDesignations(designations);
    }
  }, [departmentId, designations]);

  // Filter available managers to managers/leads of selected department
  const departmentManagers = allEmployees.filter((emp) => {
    if (employeeToEdit && emp.id === employeeToEdit.id) return false;
    if (departmentId && emp.departmentId !== departmentId) return false;

    const empDes = designations.find((d) => d.id === emp.designationId);
    const isDeptHod = selectedDeptObj?.hodId === emp.id;
    const isAlreadyManaging = allEmployees.some((other) => other.managerId === emp.id);
    const isMgrTitle = isManagerDesignation(emp.designationName || empDes?.name, empDes?.level);

    return isDeptHod || isAlreadyManaging || isMgrTitle;
  });

  // Filter available HODs
  const departmentHods = allEmployees.filter((emp) => {
    if (employeeToEdit && emp.id === employeeToEdit.id) return false;
    if (departmentId && emp.departmentId !== departmentId) return false;

    const empDes = designations.find((d) => d.id === emp.designationId);
    const desName = (emp.designationName || empDes?.name || '').toLowerCase();
    const isOfficialDeptHod = selectedDeptObj?.hodId === emp.id;
    const isHodTitle =
      desName.includes('hod') ||
      desName.includes('head') ||
      desName.includes('director') ||
      desName.includes('vp') ||
      desName.includes('vice president') ||
      (empDes?.level !== undefined && empDes.level >= 3);

    return isOfficialDeptHod || isHodTitle;
  });

  // Auto-select KRA template matching department or designation if not set
  useEffect(() => {
    if (!currentKraTemplateId && availableTemplates.length > 0) {
      const matching = availableTemplates.find(
        (t) => (designationId && t.designationId === designationId) || (departmentId && t.departmentId === departmentId)
      );
      if (matching) {
        setCurrentKraTemplateId(matching.id);
      }
    }
  }, [departmentId, designationId, availableTemplates, currentKraTemplateId]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !createdResponse) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, createdResponse]);

  if (!isOpen) return null;

  // Handle password auto-generation
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pwd = 'Pass@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInitialPassword(pwd);
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!createdResponse || !createdResponse.provisionedUser) return;
    const text = `Appraisal Management System Credentials:\n` +
      `URL: ${window.location.origin}\n` +
      `Employee Code: ${createdResponse.employeeCode}\n` +
      `Name: ${createdResponse.name}\n` +
      `Corporate Email: ${createdResponse.provisionedUser.email}\n` +
      `Access Role: ${createdResponse.provisionedUser.role}\n` +
      `Temporary Password: ${createdResponse.provisionedUser.temporaryPassword}\n` +
      `Note: You will be asked to update your password on first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info('Credentials copied to clipboard.', 'Copied');
    setTimeout(() => setCopied(false), 2500);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!employeeCode.trim()) {
      setError('Employee Code is required.');
      toast.warning('Employee Code is required.', 'Validation Error');
      setActiveTab('profile');
      return;
    }
    if (!name.trim()) {
      setError('Full Name is required.');
      toast.warning('Full Name is required.', 'Validation Error');
      setActiveTab('profile');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid corporate email address.');
      toast.warning('Valid corporate email address required.', 'Validation Error');
      setActiveTab('profile');
      return;
    }
    const parsedCtc = Number(currentCtc);
    if (isNaN(parsedCtc) || parsedCtc <= 0) {
      setError('Annual CTC must be a positive number.');
      toast.warning('Annual CTC must be a positive number.', 'Validation Error');
      setActiveTab('compensation');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && employeeToEdit) {
        await api.updateEmployee(employeeToEdit.id, {
          employeeCode: employeeCode.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          departmentId,
          designationId,
          joiningDate: new Date(joiningDate).toISOString(),
          cycleId,
          managerId: managerId || undefined,
          hodId: hodId || undefined,
          currentKraTemplateId: currentKraTemplateId || undefined,
          currentCtc: parsedCtc,
          currency,
          status,
          systemRole,
          provisionLogin,
          initialPassword: provisionLogin && initialPassword && initialPassword.trim().length >= 6 ? initialPassword.trim() : undefined,
        });

        toast.success(`Profile updated for ${name.trim()} (${employeeCode.trim()}).`, 'Employee Saved');
        onSaved();
        onClose();
      } else {
        const res = await api.createEmployee({
          employeeCode: employeeCode.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          departmentId,
          designationId,
          joiningDate: new Date(joiningDate).toISOString(),
          cycleId,
          managerId: managerId || undefined,
          hodId: hodId || undefined,
          currentKraTemplateId: currentKraTemplateId || undefined,
          currentCtc: parsedCtc,
          currency,
          status,
          provisionLogin,
          systemRole,
          initialPassword: provisionLogin ? initialPassword : undefined,
        });

        toast.success(`Employee ${name.trim()} (${employeeCode.trim()}) registered successfully!`, 'Employee Onboarded');
        if (res.provisionedUser) {
          setCreatedResponse(res);
          onSaved();
        } else {
          onSaved();
          onClose();
        }
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to save employee profile';
      setError(errMsg);
      toast.error(errMsg, 'Save Error');
    } finally {
      setLoading(false);
    }
  };

  const numericCtc = Number(currentCtc) || 0;
  const monthlyGross = Math.round(numericCtc / 12);

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createdResponse) onClose();
      }}
    >
      {/* 1. ONBOARDING CREDENTIALS SUCCESS CARD */}
      {createdResponse && createdResponse.provisionedUser ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-slate-800 dark:text-slate-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Employee Created & Access Provisioned!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The employee profile and login account were created successfully. Share these initial credentials with the employee.
            </p>
          </div>

          <div className="mt-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Employee:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-sans">{createdResponse.name} ({createdResponse.employeeCode})</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Corporate Email:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{createdResponse.provisionedUser.email}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-sans">System Access Role:</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 font-sans text-[11px]">
                {createdResponse.provisionedUser.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Temporary Password:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                {createdResponse.provisionedUser.temporaryPassword}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
            <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Employee will be prompted to set a permanent password upon their first login.</span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleCopyCredentials}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-2xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Copy Login Details</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* 2. MAIN EMPLOYEE CREATION / EDIT MODAL */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                {isEditing ? <Briefcase className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Employee Master Profile' : 'Add New Employee Profile'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure identity, department role, 8-Cycle appraisal group, compensation, and portal credentials
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 shrink-0 overflow-x-auto no-scrollbar gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              1. Profile & Department
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hierarchy')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              2. Hierarchy & 8-Cycle
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compensation')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'compensation'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              3. Compensation (CTC)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('access')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'access'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              4. System Access & Role
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: PROFILE & ORGANIZATION */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Employee Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Employee Code (Unique ID) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={employeeCode}
                        onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                        placeholder="EMP-001"
                        className="w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                      />
                    </div>
                    {isEditing && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Changing this code will automatically cascade across all review and appraisal records.</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                    />
                  </div>

                  {/* Corporate Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@company.com"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Mobile / Contact</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Work Location */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Base Office / Work Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
                      >
                        <option value="Bangalore HQ">Bangalore HQ</option>
                        <option value="Mumbai Branch">Mumbai Branch</option>
                        <option value="Delhi NCR Hub">Delhi NCR Hub</option>
                        <option value="Hyderabad Tech Center">Hyderabad Tech Center</option>
                        <option value="Remote - India">Remote - India</option>
                        <option value="Global Remote">Global Remote</option>
                      </select>
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Joining Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        required
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <select
                        required
                        value={departmentId}
                        onChange={(e) => {
                          const newDeptId = e.target.value;
                          const targetDept = departments.find((d) => d.id === newDeptId);
                          setDepartmentId(newDeptId);
                          setManagerId('');
                          setHodId(targetDept?.hodId || '');
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                      <select
                        required
                        value={designationId}
                        onChange={(e) => {
                          const newDesId = e.target.value;
                          setDesignationId(newDesId);
                          if (!hasUserManuallyChangedRole) {
                            setSystemRole(inferDefaultRole(newDesId));
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
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

                  {/* Employment Status */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['ACTIVE', 'PROBATION', 'NOTICE', 'INACTIVE'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatus(st)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            status === st
                              ? st === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                                : st === 'PROBATION'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                                : st === 'NOTICE'
                                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 ring-2 ring-slate-500/20'
                              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HIERARCHY & 8-CYCLE & KRA */}
            {activeTab === 'hierarchy' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-300">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">8-Cycle Rolling Appraisal Framework:</span> Every employee is assigned to a quarterly cohort (Cycle A through H). Their quarterly evaluations and annual appraisal month are calculated automatically based on this cohort.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 8-Cycle Assignment */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      8-Cycle Cohort Assignment <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-2.5" />
                      <select
                        required
                        value={cycleId}
                        onChange={(e) => setCycleId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
                      >
                        {cycles.map((c) => (
                          <option key={c.id} value={c.id}>
                            Cycle {c.code} — {c.name} (Appraisal Month: {c.appraisalMonth})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Assigned KRA Template */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Goal / KRA Template
                    </label>
                    <select
                      value={currentKraTemplateId}
                      onChange={(e) => setCurrentKraTemplateId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
                    >
                      <option value="">Auto-Assign / Default Template</option>
                      {availableTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title || t.name} ({t.departmentName || 'General'} • {t.items?.length || 4} Deliverables)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Quarterly reviews will automatically instantiate performance deliverables from this template.
                    </p>
                  </div>

                  {/* Reporting Manager (L1) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reporting Manager (L1 Reviewer)
                    </label>
                    <select
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
                    >
                      <option value="">None / Self-Managed</option>
                      {departmentManagers.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.designationName || 'Manager'})
                        </option>
                      ))}
                    </select>
                    {departmentManagers.length === 0 && departmentId && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                        No manager profiles currently found in this department. Set to Self-Managed or add a manager first.
                      </p>
                    )}
                  </div>

                  {/* Head of Department (HOD) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Head of Department (HOD Approval)
                    </label>
                    <select
                      value={hodId}
                      onChange={(e) => setHodId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium"
                    >
                      <option value="">None / Direct Management</option>
                      {departmentHods.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.id === selectedDeptObj?.hodId ? 'Official HOD' : emp.designationName || 'HOD'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMPENSATION & CTC */}
            {activeTab === 'compensation' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Compensation Baseline:</span> Starting CTC is used for appraisal hike percentage calculations, merit increase recommendations, and annual compensation letters.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Currency */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                    >
                      <option value="₹">₹ INR (Indian Rupee)</option>
                      <option value="$">$ USD (US Dollar)</option>
                      <option value="€">€ EUR (Euro)</option>
                      <option value="£">£ GBP (British Pound)</option>
                      <option value="AED">AED (Emirati Dirham)</option>
                      <option value="SGD">SGD (Singapore Dollar)</option>
                    </select>
                  </div>

                  {/* Starting Annual CTC */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Starting Annual CTC <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 dark:text-slate-500">{currency}</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="10000"
                        value={currentCtc}
                        onChange={(e) => setCurrentCtc(e.target.value)}
                        placeholder="1800000"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Breakdown Preview */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Payroll Breakdown Preview</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Annual Gross CTC</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {currency}{numericCtc.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Estimated Monthly Gross</div>
                      <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                        {currency}{monthlyGross.toLocaleString()} / mo
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Quarterly Compensation</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {currency}{Math.round(numericCtc / 4).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Common Starting CTC Presets (INR):</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '₹8 LPA', val: 800000 },
                      { label: '₹12 LPA', val: 1200000 },
                      { label: '₹16 LPA', val: 1600000 },
                      { label: '₹20 LPA', val: 2000000 },
                      { label: '₹25 LPA', val: 2500000 },
                      { label: '₹32 LPA', val: 3200000 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setCurrentCtc(item.val);
                          setCurrency('₹');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM ACCESS & CREDENTIALS */}
            {activeTab === 'access' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-300">
                  <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">System Access & Authentication:</span> Provision a secure login account for the employee so they can access the self-assessment and appraisal portal immediately.
                  </div>
                </div>

                {/* Provision Login Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Enable Portal Login Access</span>
                      {isEditing && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            provisionLogin
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {provisionLogin ? 'Access Enabled' : 'Access Disabled'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isEditing
                        ? 'Controls whether this employee can sign in to the self-assessment & appraisal portal'
                        : 'Create a user account with login credentials linked to their corporate email'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provisionLogin}
                      onChange={(e) => setProvisionLogin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {!provisionLogin && isEditing && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Portal login is disabled. Saving will deactivate this employee's sign-in access.</span>
                  </div>
                )}

                {provisionLogin && (
                  <div className="space-y-4 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 bg-white dark:bg-slate-800 shadow-2xs">
                    {/* System Access Role */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        System Access Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={systemRole}
                        onChange={(e) => {
                          setSystemRole(e.target.value as UserRole);
                          setHasUserManuallyChangedRole(true);
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                      >
                        <option value="EMPLOYEE">EMPLOYEE (Individual Contributor — Self Appraisal)</option>
                        <option value="MANAGER">MANAGER (Team Lead / L1 Reviewer & Scoring)</option>
                        <option value="HOD">HOD (Department Head — Secondary Calibration)</option>
                        <option value="HR">HR (People Operations — Full Calibration & Approval)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Complete System Administrator)</option>
                      </select>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Controls navigation views, permission guards, and access to appraisal scoring.
                      </p>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {isEditing ? 'Reset Login Password (Optional)' : 'Initial Login Password'}
                        </label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          Auto-generate Secure Password
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={initialPassword}
                          onChange={(e) => setInitialPassword(e.target.value)}
                          placeholder={isEditing ? 'Leave blank to retain current password' : 'Initial password (min 6 chars)'}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          {isEditing
                            ? 'Leave blank to keep current password, or enter a new one to reset credentials.'
                            : 'Employee will be forced to change this password upon their first login.'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Navigation Buttons */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between shrink-0">
              {/* Tab Back/Next Helpers */}
              <div className="flex items-center gap-2">
                {activeTab !== 'profile' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'hierarchy') setActiveTab('profile');
                      else if (activeTab === 'compensation') setActiveTab('hierarchy');
                      else if (activeTab === 'access') setActiveTab('compensation');
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}
                {activeTab !== 'access' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'profile') setActiveTab('hierarchy');
                      else if (activeTab === 'hierarchy') setActiveTab('compensation');
                      else if (activeTab === 'compensation') setActiveTab('access');
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Next Step
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    'Saving...'
                  ) : isEditing ? (
                    'Update Employee'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Save & Provision Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>,
    document.body
  );
};
