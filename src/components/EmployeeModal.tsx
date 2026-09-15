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
  Lock,
  User,
  Target,
  UserMinus,
  Clock,
  Edit2,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeToEdit?: Employee | null;
  initialRehire?: boolean;
  departments: Department[];
  designations: Designation[];
  cycles: Cycle[];
  allEmployees: Employee[];
  kraTemplates?: KraTemplate[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employeeToEdit,
  initialRehire = false,
  departments,
  designations,
  cycles,
  allEmployees,
  kraTemplates = [],
}) => {
  const [rehireTarget, setRehireTarget] = useState<Employee | null>(null);
  const isEditing = Boolean(employeeToEdit) || Boolean(rehireTarget);

  // Form Fields: Profile & Organization
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Bangalore HQ');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'NOTICE'>('ACTIVE');
  const [relievingDate, setRelievingDate] = useState('');

  // Past / Inactive state helpers
  const wasPastEmployee = Boolean(employeeToEdit?.status === 'INACTIVE') || Boolean(employeeToEdit?.isPastEmployee) || Boolean(rehireTarget);
  const isInactive = status === 'INACTIVE';
  const isRehiring = wasPastEmployee && status !== 'INACTIVE';

  // Form Fields: Hierarchy & Performance
  const [cycleId, setCycleId] = useState('');
  const [hasUserManuallyChangedCycle, setHasUserManuallyChangedCycle] = useState(false);
  const [managerId, setManagerId] = useState('');
  const [hodId, setHodId] = useState('');
  const [currentKraTemplateId, setCurrentKraTemplateId] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<KraTemplate[]>(kraTemplates);

  // Form Fields: Compensation
  const [currentCtc, setCurrentCtc] = useState<number | string>(1800000);
  const [currency, setCurrency] = useState('₹');

  // Form Fields: System Access & Login
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
      api
        .getKraTemplates()
        .then((res) => {
          if (res && res.length > 0) setAvailableTemplates(res);
        })
        .catch(() => {});
    }
  }, [isOpen, kraTemplates]);

  // Helper to check if an employee is an HOD
  const isEmployeeHod = (emp: Employee) => {
    if (emp.systemRole === 'HOD' || (emp as any).role === 'HOD') return true;
    if (departments.some((d) => d.hodId === emp.id)) return true;
    const empDes = designations.find((d) => d.id === emp.designationId);
    const desName = (emp.designationName || empDes?.name || '').toLowerCase();
    const empName = (emp.name || '').toLowerCase();
    if (
      desName.includes('hod') ||
      desName.includes('head of') ||
      desName.includes('director') ||
      desName.includes('vp') ||
      desName.includes('vice president') ||
      (empDes && empDes.level >= 4)
    ) {
      return true;
    }
    if (empName.includes('_hod') || empName.includes(' hod')) return true;
    return false;
  };

  // Helper to check if designation is a reporting manager/lead designation
  const isReportingManagerDesignation = (desName?: string) => {
    if (!desName) return false;
    const lower = desName.toLowerCase();
    // Exclude HOD / executive titles
    if (
      lower.includes('hod') ||
      lower.includes('head of') ||
      lower.includes('vp') ||
      lower.includes('vice president') ||
      lower.includes('director')
    ) {
      return false;
    }
    return (
      lower.includes('manager') ||
      lower.includes('lead') ||
      lower.includes('supervisor') ||
      lower.includes('coordinator') ||
      lower.includes('principal')
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

  // Helper to determine smart suggested cycle cohort based on joining date
  const getSuggestedCycle = (dateStr?: string): Cycle | undefined => {
    if (!dateStr || !cycles || cycles.length === 0) return undefined;
    const parts = dateStr.split('-');
    if (parts.length < 2) return undefined;
    const joiningMonth = parseInt(parts[1], 10);
    if (isNaN(joiningMonth) || joiningMonth < 1 || joiningMonth > 12) return undefined;

    const candidateCycles = cycles.filter((c) => c.active !== false);
    const pool = candidateCycles.length > 0 ? candidateCycles : cycles;
    const sorted = [...pool].sort((a, b) => a.appraisalMonth - b.appraisalMonth);

    // 1. Exact match with joining month
    const exact = sorted.find((c) => c.appraisalMonth === joiningMonth);
    if (exact) return exact;

    // 2. Next upcoming cycle in current year
    const upcoming = sorted.find((c) => c.appraisalMonth > joiningMonth);
    if (upcoming) return upcoming;

    // 3. Wrap around to earliest cycle of next year
    return sorted[0];
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
      setCycleId(employeeToEdit.cycleId || cycles[0]?.id || '');
      setManagerId(employeeToEdit.managerId || '');
      setHodId(employeeToEdit.hodId || '');
      setCurrentKraTemplateId(employeeToEdit.currentKraTemplateId || '');
      setCurrentCtc(employeeToEdit.currentCtc !== undefined ? employeeToEdit.currentCtc : 1800000);
      setCurrency(employeeToEdit.currency || '₹');
      if (initialRehire) {
        setStatus('ACTIVE');
        const todayStr = new Date().toISOString().split('T')[0];
        setJoiningDate(todayStr);
        setRelievingDate('');
        setProvisionLogin(true);
        setInitialPassword(`Welcome@${new Date().getFullYear()}`);
        const suggested = getSuggestedCycle(todayStr);
        setCycleId(suggested ? suggested.id : (employeeToEdit.cycleId || cycles[0]?.id || ''));
        setHasUserManuallyChangedCycle(false);
      } else {
        setStatus(employeeToEdit.status || 'ACTIVE');
        setJoiningDate(employeeToEdit.joiningDate ? employeeToEdit.joiningDate.split('T')[0] : '');
        setCycleId(employeeToEdit.cycleId || cycles[0]?.id || '');
        setHasUserManuallyChangedCycle(Boolean(employeeToEdit.cycleId));
        setRelievingDate(
          employeeToEdit.relievingDate
            ? employeeToEdit.relievingDate.split('T')[0]
            : employeeToEdit.pastEmployeeDate
            ? employeeToEdit.pastEmployeeDate.split('T')[0]
            : ''
        );
      }

      const initialHasAccount =
        employeeToEdit.hasLoginAccount !== undefined
          ? Boolean(employeeToEdit.hasLoginAccount)
          : employeeToEdit.userActive !== undefined
          ? Boolean(employeeToEdit.userActive)
          : true;

      setProvisionLogin(initialHasAccount);
      setSystemRole(employeeToEdit.systemRole || inferDefaultRole(employeeToEdit.designationId));
      setHasUserManuallyChangedRole(Boolean(employeeToEdit.systemRole));
      setInitialPassword(initialRehire ? `Welcome@${new Date().getFullYear()}` : '');

      // Fetch fresh record from server to ensure authoritative access status
      api
        .getEmployeeById(employeeToEdit.id)
        .then((freshEmp) => {
          if (freshEmp && freshEmp.id === employeeToEdit.id) {
            if (freshEmp.hasLoginAccount !== undefined) {
              setProvisionLogin(Boolean(freshEmp.hasLoginAccount));
            }
            if (freshEmp.systemRole) {
              setSystemRole(freshEmp.systemRole);
            }
          }
        })
        .catch(() => {});
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

      const todayStr = new Date().toISOString().split('T')[0];
      setEmployeeCode(nextCode);
      setName('');
      setEmail('');
      setPhone('');
      setLocation('Bangalore HQ');
      setDepartmentId(defaultDept);
      setDesignationId('');
      setJoiningDate(todayStr);
      const suggested = getSuggestedCycle(todayStr);
      setCycleId(suggested ? suggested.id : (cycles[0]?.id || ''));
      setHasUserManuallyChangedCycle(false);
      setManagerId('');
      setHodId(defaultDeptObj?.hodId || '');
      setCurrentKraTemplateId('');
      setCurrentCtc(1800000);
      setCurrency('₹');
      setStatus('ACTIVE');
      setRelievingDate('');
      setProvisionLogin(true);
      setInitialPassword(`Welcome@${new Date().getFullYear()}`);
      setSystemRole('EMPLOYEE');
      setHasUserManuallyChangedRole(false);
    }
    setRehireTarget(null);
    setError(null);
    setCreatedResponse(null);
  }, [employeeToEdit, initialRehire, isOpen, departments, cycles, allEmployees]);

  // Rehire handler to switch modal into rehire mode
  const handleStartRehire = (pastEmp: Employee) => {
    setRehireTarget(pastEmp);
    setName(pastEmp.name || '');
    setEmployeeCode(pastEmp.employeeCode || '');
    setEmail(pastEmp.email || '');
    setPhone(pastEmp.phone || '');
    setLocation(pastEmp.location || 'Bangalore HQ');
    setDepartmentId(pastEmp.departmentId || departments[0]?.id || '');
    const todayStr = new Date().toISOString().split('T')[0];
    setDesignationId(pastEmp.designationId || '');
    setJoiningDate(todayStr);
    const suggested = getSuggestedCycle(todayStr);
    setCycleId(suggested ? suggested.id : (pastEmp.cycleId || cycles[0]?.id || ''));
    setHasUserManuallyChangedCycle(false);
    setManagerId(pastEmp.managerId || '');
    setHodId(pastEmp.hodId || '');
    setCurrentKraTemplateId(pastEmp.currentKraTemplateId || '');
    setCurrentCtc(pastEmp.currentCtc !== undefined ? pastEmp.currentCtc : 1800000);
    setCurrency(pastEmp.currency || '₹');
    setStatus('ACTIVE');
    setRelievingDate('');
    setProvisionLogin(true);
    setInitialPassword(`Welcome@${new Date().getFullYear()}`);
    setSystemRole(pastEmp.systemRole || inferDefaultRole(pastEmp.designationId));
    setError(null);
    toast.info(`Loaded ${pastEmp.name}'s profile in Rehire mode. Update details and save to reactivate.`, 'Rehire Mode');
  };

  // Real-time email conflict detection for duplicate prevention and smart rehire
  const normalizedEmail = email.trim().toLowerCase();
  const emailConflict =
    normalizedEmail && !employeeToEdit && !rehireTarget
      ? (allEmployees || []).find((e) => (e.email || '').trim().toLowerCase() === normalizedEmail)
      : null;
  const isConflictPastEmployee = Boolean(emailConflict && (emailConflict.status === 'INACTIVE' || emailConflict.isPastEmployee));

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

  // Filter available managers to ONLY reporting managers (HODs strictly excluded because HODs do not conduct employee reviews)
  const departmentManagers = allEmployees
    .filter((emp) => {
      if (employeeToEdit && emp.id === employeeToEdit.id) return false;
      if (departmentId && emp.departmentId !== departmentId) return false;
      if (emp.status === 'INACTIVE' || emp.isPastEmployee) return false;

      // Strictly exclude HODs from reporting manager options
      if (isEmployeeHod(emp)) {
        // If this manager was already saved on this employee previously, keep it visible in edit mode
        if (employeeToEdit && employeeToEdit.managerId === emp.id) return true;
        return false;
      }

      const empDes = designations.find((d) => d.id === emp.designationId);
      const isAlreadyManaging = allEmployees.some((other) => other.managerId === emp.id && other.status !== 'INACTIVE');
      const isMgrTitle = isReportingManagerDesignation(emp.designationName || empDes?.name);
      const isMgrRole =
        emp.systemRole === 'MANAGER' ||
        (emp as any).role === 'MANAGER' ||
        (emp as any).role === 'REPORTING_MANAGER';

      return isAlreadyManaging || isMgrTitle || isMgrRole;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Filter available HODs
  const departmentHods = allEmployees
    .filter((emp) => {
      if (employeeToEdit && emp.id === employeeToEdit.id) return false;
      if (departmentId && emp.departmentId !== departmentId) return false;
      if (emp.status === 'INACTIVE' || emp.isPastEmployee) return false;

      const empDes = designations.find((d) => d.id === emp.designationId);
      const desName = (emp.designationName || empDes?.name || '').toLowerCase();
      const isOfficialDeptHod = selectedDeptObj?.hodId === emp.id;
      const isHodTitle =
        desName.includes('hod') ||
        desName.includes('head') ||
        desName.includes('director') ||
        desName.includes('vp') ||
        desName.includes('vice president') ||
        emp.systemRole === 'HOD';

      return isOfficialDeptHod || isHodTitle;
    })
    .sort((a, b) => {
      const aIsOfficial = selectedDeptObj?.hodId === a.id;
      const bIsOfficial = selectedDeptObj?.hodId === b.id;
      if (aIsOfficial && !bIsOfficial) return -1;
      if (!aIsOfficial && bIsOfficial) return 1;
      return (a.name || '').localeCompare(b.name || '');
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

  // Smart cycle suggestion derived values
  const suggestedCycle = getSuggestedCycle(joiningDate);
  const isSelectedSuggested = Boolean(suggestedCycle && cycleId === suggestedCycle.id);
  const joiningMonthIndex = joiningDate ? parseInt(joiningDate.split('-')[1], 10) - 1 : -1;
  const joiningMonthName = joiningMonthIndex >= 0 && joiningMonthIndex < 12 ? MONTH_NAMES[joiningMonthIndex] : '';

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
    const text =
      `Appraisal Management System Credentials:\n` +
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

    const parsedCtc = Number(currentCtc);

    // Validation
    if (isInactive) {
      if (!relievingDate) {
        setError('Official Relieving / Exit Date is required for an inactive or past employee.');
        toast.warning('Please specify the official Relieving / Exit Date.', 'Validation Error');
        return;
      }
    } else {
      if (!employeeCode.trim()) {
        setError('Employee Code is required.');
        toast.warning('Employee Code is required.', 'Validation Error');
        return;
      }
      if (!name.trim()) {
        setError('Full Name is required.');
        toast.warning('Full Name is required.', 'Validation Error');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please provide a valid corporate email address.');
        toast.warning('Valid corporate email address required.', 'Validation Error');
        return;
      }
      if (!departmentId) {
        setError('Department is required.');
        toast.warning('Department is required.', 'Validation Error');
        return;
      }
      if (!designationId) {
        setError('Designation is required.');
        toast.warning('Designation is required.', 'Validation Error');
        return;
      }
      if (!joiningDate) {
        setError('Joining Date is required.');
        toast.warning('Joining Date is required.', 'Validation Error');
        return;
      }
      if (isNaN(parsedCtc) || parsedCtc <= 0) {
        setError('Annual CTC must be a positive number.');
        toast.warning('Annual CTC must be a positive number.', 'Validation Error');
        return;
      }
    }

    setLoading(true);

    try {
      const targetEmp = employeeToEdit || rehireTarget;
      if (targetEmp) {
        if (isInactive) {
          // When an employee is inactive / past employee, ONLY relieving date and inactive status can be modified
          await api.updateEmployee(targetEmp.id, {
            status: 'INACTIVE',
            relievingDate: new Date(relievingDate).toISOString(),
          });
          toast.success(`Relieving date saved for ${name.trim()} (${employeeCode.trim()}).`, 'Record Updated');
        } else {
          const parsedCtc = Number(currentCtc);
          await api.updateEmployee(targetEmp.id, {
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
            initialPassword:
              provisionLogin && initialPassword && initialPassword.trim().length >= 6
                ? initialPassword.trim()
                : undefined,
          });
          if (wasPastEmployee) {
            toast.success(`${name.trim()} (${employeeCode.trim()}) successfully rehired and reactivated!`, 'Employee Rehired');
          } else {
            toast.success(`Profile updated for ${name.trim()} (${employeeCode.trim()}).`, 'Employee Saved');
          }
        }

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
          relievingDate:
            status === 'INACTIVE' && relievingDate
              ? new Date(relievingDate).toISOString()
              : undefined,
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createdResponse) onClose();
      }}
    >
      {/* 1. ONBOARDING CREDENTIALS SUCCESS CARD */}
      {createdResponse && createdResponse.provisionedUser ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 sm:p-8 text-slate-800 dark:text-slate-200">
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Employee Created & Access Provisioned!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The employee profile and login account were created successfully. Share these initial credentials with the employee.
            </p>
          </div>

          <div className="mt-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Employee:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-sans">
                {createdResponse.name} ({createdResponse.employeeCode})
              </span>
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

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleCopyCredentials}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
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
              className="py-2.5 px-6 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* 2. SIMPLE ONE-PAGE EMPLOYEE FORM MODAL */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs">
                {isRehiring ? <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : isEditing ? <Briefcase className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isRehiring ? 'Rehire Past Employee' : isEditing ? 'Edit Employee Profile' : 'Add New Employee'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRehiring ? 'Reactivate past employee profile with new tenure details, cycle, and portal access.' : 'Fill in employee details, department, cycle, compensation, and portal credentials in one place.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Single Unified Scrollable Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-slate-900">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
                {emailConflict && isConflictPastEmployee && (
                  <button
                    type="button"
                    onClick={() => handleStartRehire(emailConflict)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3" />
                    Rehire {emailConflict.name}
                  </button>
                )}
              </div>
            )}

            {/* Rehiring Mode Active Banner */}
            {isRehiring && (
              <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150 shadow-2xs">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <span className="font-bold text-emerald-950 dark:text-emerald-100 block text-xs">
                    Rehiring Mode Active — Reactivating Employee Record
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-300/90 leading-relaxed text-[11px]">
                    You are rehiring <strong>{name}</strong> ({employeeCode}). Past appraisals and reviews remain securely preserved and immutable. A new employment tenure begins on <strong>{joiningDate || 'today'}</strong>. All profile, organization, compensation, and portal credential fields are now unlocked.
                  </p>
                </div>
              </div>
            )}

            {/* Inactive / Past Employee Audit Lock Notice */}
            {isInactive && (
              <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150 shadow-2xs">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-950 dark:text-amber-100 block text-xs">
                      {wasPastEmployee ? 'Archived Past Employee — Profile Details Inactive' : 'Employee Marked as Inactive — Profile Details Locked'}
                    </span>
                    <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed text-[11px]">
                      This employee record is marked inactive / relieved. Only the official Relieving / Exit Date can be updated, or you can rehire them to begin a new tenure.
                    </p>
                  </div>
                </div>
                {wasPastEmployee && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('ACTIVE');
                      setJoiningDate(new Date().toISOString().split('T')[0]);
                      setRelievingDate('');
                      setProvisionLogin(true);
                      setInitialPassword(`Welcome@${new Date().getFullYear()}`);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Rehire Employee
                  </button>
                )}
              </div>
            )}

            {/* SECTION 1: Personal & Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    1. Personal & Contact Details
                  </h3>
                </div>
                {isInactive && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      disabled={isInactive}
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                      placeholder="EMP-001"
                      className="w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isInactive}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                  />
                </div>

                {/* Corporate Email */}
                <div className={emailConflict ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      disabled={isInactive}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="rahul@company.com"
                      className={`w-full bg-white dark:bg-slate-800 border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60 ${
                        emailConflict
                          ? isConflictPastEmployee
                            ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-500/20'
                            : 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>

                  {/* Smart Rehire / Duplicate Email Assistant */}
                  {emailConflict && (
                    <div className="mt-2.5">
                      {isConflictPastEmployee ? (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 shadow-2xs animate-in fade-in duration-150">
                          <div className="flex items-start gap-2.5">
                            <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-bold text-blue-950 dark:text-blue-100 block text-xs">
                                Past Employee Record Found: {emailConflict.name} ({emailConflict.employeeCode})
                              </span>
                              <p className="text-[11px] text-blue-800 dark:text-blue-300/90 leading-relaxed">
                                This email was used by an employee relieved on {emailConflict.relievingDate ? new Date(emailConflict.relievingDate).toLocaleDateString() : 'previous date'}. Production HRMS systems require rehiring their profile rather than creating a duplicate account.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartRehire(emailConflict)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Rehire This Employee
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>This corporate email is actively in use by <strong>{emailConflict.name}</strong> ({emailConflict.employeeCode}). Please enter a unique corporate email.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Mobile / Contact
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      disabled={isInactive}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    />
                  </div>
                </div>

                {/* Base Office / Work Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base Office / Work Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <select
                      disabled={isInactive}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
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
                      disabled={isInactive}
                      value={joiningDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setJoiningDate(newDate);
                        if (!hasUserManuallyChangedCycle && newDate) {
                          const suggested = getSuggestedCycle(newDate);
                          if (suggested) {
                            setCycleId(suggested.id);
                          }
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    />
                  </div>
                  {suggestedCycle && (
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                      <span>
                        Cohort: <strong>{suggestedCycle.name}</strong>
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Organization & Job Assignment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    2. Department & Employment Role
                  </h3>
                </div>
                {isInactive && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <select
                      required
                      disabled={isInactive}
                      value={departmentId}
                      onChange={(e) => {
                        const newDeptId = e.target.value;
                        const targetDept = departments.find((d) => d.id === newDeptId);
                        setDepartmentId(newDeptId);
                        setManagerId('');
                        setHodId(targetDept?.hodId || '');
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    >
                      <option value="" disabled>
                        Select Department
                      </option>
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
                      disabled={isInactive}
                      value={designationId}
                      onChange={(e) => {
                        const newDesId = e.target.value;
                        setDesignationId(newDesId);
                        if (!hasUserManuallyChangedRole) {
                          setSystemRole(inferDefaultRole(newDesId));
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    >
                      <option value="" disabled>
                        Select Designation
                      </option>
                      {filteredDesignations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} (Level {d.level})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 8-Cycle Assignment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Appraisal Cycle Cohort <span className="text-rose-500">*</span>
                    </label>
                    {suggestedCycle && !isSelectedSuggested && (
                      <button
                        type="button"
                        onClick={() => {
                          setCycleId(suggestedCycle.id);
                          setHasUserManuallyChangedCycle(false);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                        title={`Reset to suggested ${suggestedCycle.name}`}
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Reset (Cycle {suggestedCycle.code})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <select
                      required
                      disabled={isInactive}
                      value={cycleId}
                      onChange={(e) => {
                        setCycleId(e.target.value);
                        setHasUserManuallyChangedCycle(true);
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    >
                      {cycles.map((c) => {
                        const isRecommended = suggestedCycle?.id === c.id;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} (Month {c.appraisalMonth}){isRecommended ? ' ★ Recommended' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {suggestedCycle && joiningMonthName && (
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                      {isSelectedSuggested ? (
                        <span>
                          Auto-matched to <strong>Cycle {suggestedCycle.code}</strong> for {joiningMonthName} joining.
                        </span>
                      ) : (
                        <span>
                          Manual override (recommended for {joiningMonthName}: <strong>Cycle {suggestedCycle.code}</strong>).
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Employment Status Selector (Spans Full Width across sm:col-span-3) */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Employment Status
                    </label>
                    {wasPastEmployee && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isRehiring ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {isRehiring ? (
                          <>
                            <UserCheck className="w-2.5 h-2.5" /> Rehire Active
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" /> Inactive Record
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'ACTIVE', label: 'Active', icon: CheckCircle2, activeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/20' },
                      { key: 'PROBATION', label: 'Probation', icon: Clock, activeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-1 ring-amber-500/20' },
                      { key: 'NOTICE', label: 'Notice Period', icon: AlertCircle, activeClass: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700 ring-1 ring-orange-500/20' },
                      { key: 'INACTIVE', label: 'Inactive / Relieved', icon: UserMinus, activeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 ring-1 ring-rose-500/20' },
                    ].map(({ key, label, icon: Icon, activeClass }) => {
                      const isSelected = status === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setStatus(key as any);
                            if (key === 'INACTIVE') {
                              if (!relievingDate) {
                                setRelievingDate(new Date().toISOString().split('T')[0]);
                              }
                            } else if (wasPastEmployee) {
                              setRelievingDate('');
                              setJoiningDate(new Date().toISOString().split('T')[0]);
                              setProvisionLogin(true);
                              setInitialPassword(`Welcome@${new Date().getFullYear()}`);
                            }
                          }}
                          className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? activeClass
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Relieving / Exit Date Field */}
                {isInactive && (
                  <div className="sm:col-span-3 bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Official Relieving / Exit Date <span className="text-rose-600">*</span>
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
                        <Edit2 className="w-2.5 h-2.5" /> Editable Field
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-rose-500 pointer-events-none" />
                        <input
                          type="date"
                          required
                          value={relievingDate}
                          onChange={(e) => setRelievingDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-rose-300 dark:border-rose-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-semibold shadow-xs"
                        />
                      </div>
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                        This employee is marked as inactive / relieved. All other profile details are locked; only this relieving date can be adjusted.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: Reporting Hierarchy & Goals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Hierarchy & Performance Alignment
                  </h3>
                </div>
                {isInactive && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Reporting Manager (L1) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reporting Manager (L1)
                  </label>
                  <select
                    disabled={isInactive}
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                  >
                    <option value="">None / Self-Managed</option>
                    {departmentManagers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designationName || 'Reporting Manager'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Head of Department (HOD) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Head of Dept (HOD)
                  </label>
                  <select
                    disabled={isInactive}
                    value={hodId}
                    onChange={(e) => setHodId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                  >
                    <option value="">None / Direct Management</option>
                    {departmentHods.map((emp) => {
                      const isOfficial = emp.id === selectedDeptObj?.hodId;
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.designationName || 'HOD'}){isOfficial ? ' ★ Official HOD' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Assigned Goal / KRA Template */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goal / KRA Template
                  </label>
                  <select
                    disabled={isInactive}
                    value={currentKraTemplateId}
                    onChange={(e) => setCurrentKraTemplateId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                  >
                    <option value="">Auto-Assign / Default Template</option>
                    {availableTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title || t.name} ({t.departmentName || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4: Compensation & Portal Login */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    4. Compensation & Portal Access
                  </h3>
                </div>
                {isInactive && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Starting Annual CTC */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Starting Annual CTC <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <select
                      disabled={isInactive}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="absolute left-2 bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 pr-1.5 py-1 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="₹">₹ INR</option>
                      <option value="$">$ USD</option>
                      <option value="€">€ EUR</option>
                      <option value="£">£ GBP</option>
                      <option value="AED">AED</option>
                      <option value="SGD">SGD</option>
                    </select>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10000"
                      disabled={isInactive}
                      value={currentCtc}
                      onChange={(e) => setCurrentCtc(e.target.value)}
                      placeholder="1800000"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-16 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    />
                  </div>
                </div>

                {/* Provision Login Toggle Card */}
                <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Enable Portal Login Access</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Create user account with corporate email credentials
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                    <input
                      type="checkbox"
                      disabled={isInactive}
                      checked={provisionLogin}
                      onChange={(e) => setProvisionLogin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                  </label>
                </div>
              </div>

              {/* Login Credentials Inputs (Visible when login enabled) */}
              {provisionLogin && (
                <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-150">
                  {/* System Access Role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      System Access Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      disabled={isInactive}
                      value={systemRole}
                      onChange={(e) => {
                        setSystemRole(e.target.value as UserRole);
                        setHasUserManuallyChangedRole(true);
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                    >
                      <option value="EMPLOYEE">EMPLOYEE (Self-Assessment & KRA Tracker)</option>
                      <option value="MANAGER">MANAGER (Reviewer & Scoring)</option>
                      <option value="HOD">HOD (Department Secondary Calibration)</option>
                      <option value="HR">HR (People Operations & Approvals)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (System Administrator)</option>
                    </select>
                  </div>

                  {/* Initial Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isEditing ? 'Reset Password (Optional)' : 'Initial Password'}
                      </label>
                      <button
                        type="button"
                        disabled={isInactive}
                        onClick={generateRandomPassword}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={isInactive}
                        value={initialPassword}
                        onChange={(e) => setInitialPassword(e.target.value)}
                        placeholder={isEditing ? 'Leave blank to keep current' : 'Min 6 characters'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                      />
                      <button
                        type="button"
                        disabled={isInactive}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Form Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {isInactive ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Profile locked for past employee • Relieving date editable
                  </span>
                ) : (
                  <>
                    Fields marked with <span className="text-rose-500">*</span> are mandatory
                  </>
                )}
              </span>

              <div className="flex items-center gap-2.5">
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
                  className="px-5 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    'Saving...'
                  ) : isRehiring ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Save & Rehire Employee
                    </>
                  ) : isInactive ? (
                    wasPastEmployee ? (
                      'Update Relieving Date'
                    ) : (
                      'Save & Relieve Employee'
                    )
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
