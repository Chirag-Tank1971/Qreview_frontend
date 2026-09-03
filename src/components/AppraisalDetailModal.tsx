import React, { useState } from 'react';
import {
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  Lock,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Building2,
  DollarSign,
  ChevronRight,
  Sparkles,
  Sliders,
  Send,
  Loader2,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { Appraisal, Designation, User as AuthUser } from '../types';
import { api } from '../services/api';
import { AppraisalLetterModal } from './AppraisalLetterModal';

interface AppraisalDetailModalProps {
  appraisal: Appraisal;
  currentUser: AuthUser | null;
  designations: Designation[];
  onClose: () => void;
  onRefresh: () => void;
}

export const AppraisalDetailModal: React.FC<AppraisalDetailModalProps> = ({
  appraisal,
  currentUser,
  designations,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'calibrate' | 'audit'>('calibrate');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLetterModal, setShowLetterModal] = useState<boolean>(false);
  const [confirmActionType, setConfirmActionType] = useState<'MANAGER' | 'HOD' | 'HR_APPROVE' | 'LOCK' | null>(null);

  // Form states
  const [incrementPercent, setIncrementPercent] = useState<number>(
    appraisal.approvedIncrementPercentage || appraisal.proposedIncrementPercentage || appraisal.suggestedIncrementMin || 12
  );
  const [promotionRecommended, setPromotionRecommended] = useState<boolean>(
    appraisal.promotionRecommended || false
  );
  const [promotionDesignationId, setPromotionDesignationId] = useState<string>(
    appraisal.promotionDesignationId || ''
  );
  const [justification, setJustification] = useState<string>(
    appraisal.managerRecommendation?.justification || ''
  );
  const [strengthsSummary, setStrengthsSummary] = useState<string>(
    appraisal.managerRecommendation?.strengthsSummary || ''
  );
  const [hodNotes, setHodNotes] = useState<string>(
    appraisal.hodCalibration?.notes || ''
  );
  const [hrNotes, setHrNotes] = useState<string>(
    appraisal.hrApproval?.notes || ''
  );
  const [effectiveDate, setEffectiveDate] = useState<string>(
    appraisal.effectiveDate || `${appraisal.appraisalYear}-10-01`
  );

  const currencySymbol = appraisal.currency || '₹';
  const currentCtc = appraisal.currentCtc || 1800000;
  const incrementAmount = Math.round((currentCtc * incrementPercent) / 100);
  const calculatedRevisedCtc = currentCtc + incrementAmount;
  const currentMonthly = Math.round(currentCtc / 12);
  const revisedMonthly = Math.round(calculatedRevisedCtc / 12);
  const monthlyIncrement = revisedMonthly - currentMonthly;

  const userRole = currentUser?.role || 'EMPLOYEE';
  const isManager = userRole === 'MANAGER' || userRole === 'HOD' || userRole === 'SUPER_ADMIN';
  const isHod = userRole === 'HOD' || userRole === 'SUPER_ADMIN';
  const isHr = userRole === 'HR' || userRole === 'SUPER_ADMIN';
  const isLocked = appraisal.isLocked || appraisal.status === 'LOCKED';

  // Filter promotion designations strictly to the employee's current department
  const departmentDesignations = React.useMemo(() => {
    // 1. Filter designations matching employee's current department
    const deptList = designations.filter((d) => {
      const matchId = appraisal.departmentId && d.departmentId === appraisal.departmentId;
      const matchName =
        appraisal.departmentName &&
        d.departmentName &&
        d.departmentName.trim().toLowerCase() === appraisal.departmentName.trim().toLowerCase();
      return Boolean(matchId || matchName);
    });

    const targetList = deptList.length > 0 ? deptList : designations;

    // 2. Exclude employee's current designation so user doesn't recommend promotion to their existing role
    const eligibleList = targetList.filter((d) => {
      if (d.id === promotionDesignationId) return true;
      const isCurrent =
        (appraisal.designationId && d.id === appraisal.designationId) ||
        (appraisal.designationName && d.name.trim().toLowerCase() === appraisal.designationName.trim().toLowerCase());
      return !isCurrent;
    });

    const finalOptions = eligibleList.length > 0 ? eligibleList : targetList;

    // 3. Sort by hierarchy level ascending
    return [...finalOptions].sort((a, b) => a.level - b.level);
  }, [
    designations,
    appraisal.departmentId,
    appraisal.departmentName,
    appraisal.designationId,
    appraisal.designationName,
    promotionDesignationId,
  ]);

  // Manager Recommendation Submit
  const handleManagerSubmit = async () => {
    if (!justification.trim()) {
      setError('Please provide a manager recommendation justification before submitting.');
      setConfirmActionType(null);
      return;
    }
    if (promotionRecommended && !promotionDesignationId) {
      setError('Please select the proposed promoted designation level.');
      setConfirmActionType(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const selectedDes = designations.find((d) => d.id === promotionDesignationId);
      await api.submitManagerRecommendation(appraisal.id, {
        suggestedIncrementPercent: incrementPercent,
        promotionRecommended,
        promotionDesignationId: promotionRecommended ? promotionDesignationId : undefined,
        promotionDesignationName: promotionRecommended ? selectedDes?.name : undefined,
        justification,
        strengthsSummary,
      });
      setConfirmActionType(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit manager recommendation');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HOD Calibration Submit
  const handleHodSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitHodCalibration(appraisal.id, {
        calibratedIncrementPercent: incrementPercent,
        promotionApproved: promotionRecommended,
        notes: hodNotes,
      });
      setConfirmActionType(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit HOD calibration');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HR Approval Submit
  const handleHrApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitHrApproval(appraisal.id, {
        finalIncrementPercent: incrementPercent,
        finalRating: appraisal.finalRating || appraisal.recommendedRating,
        revisedCtc: calculatedRevisedCtc,
        effectiveDate,
        notes: hrNotes,
      });
      setConfirmActionType(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit HR approval');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Lock Appraisal (Final Lock & Release)
  const handleExecuteLock = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.lockAppraisal(appraisal.id);
      setConfirmActionType(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to lock appraisal');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirm = (type: 'MANAGER' | 'HOD' | 'HR_APPROVE' | 'LOCK') => {
    setError(null);
    if (type === 'MANAGER') {
      if (!justification.trim()) {
        setError('Please provide a manager recommendation justification before submitting.');
        return;
      }
      if (promotionRecommended && !promotionDesignationId) {
        setError('Please select the proposed promoted designation level.');
        return;
      }
    }
    setConfirmActionType(type);
  };

  const handleExecuteConfirmAction = () => {
    if (confirmActionType === 'MANAGER') {
      handleManagerSubmit();
    } else if (confirmActionType === 'HOD') {
      handleHodSubmit();
    } else if (confirmActionType === 'HR_APPROVE') {
      handleHrApprove();
    } else if (confirmActionType === 'LOCK') {
      handleExecuteLock();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{appraisal.employeeName}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-white/10 text-slate-300">
                    {appraisal.employeeCode}
                  </span>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      backgroundColor: `${appraisal.cycleColor || '#4f46e5'}20`,
                      color: appraisal.cycleColor || '#818cf8',
                      borderColor: `${appraisal.cycleColor || '#4f46e5'}40`,
                    }}
                  >
                    {appraisal.cycleName} • {appraisal.appraisalYear}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {appraisal.designationName} • {appraisal.departmentName} • Rolling Score:{' '}
                  <strong className="text-indigo-300 font-mono">{appraisal.averageQuarterlyScore.toFixed(2)} / 5.0</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(appraisal.status === 'HR_APPROVED' || appraisal.status === 'LOCKED' || appraisal.isLocked) && (
                <button
                  type="button"
                  onClick={() => setShowLetterModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Appraisal Letter</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('calibrate')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'calibrate'
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Salary Calibration & Recommendation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('breakdown')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'breakdown'
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>4-Quarter Review Performance History ({appraisal.quarterlyHistory?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'audit'
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Multi-Stage Sign-Off Audit Trail</span>
              </button>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  appraisal.status === 'LOCKED'
                    ? 'bg-slate-900 text-white border-slate-800'
                    : appraisal.status === 'HR_APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : appraisal.status === 'HOD_CALIBRATED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : appraisal.status === 'MANAGER_RECOMMENDED'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Workflow: {appraisal.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: CALIBRATION & SALARY REVISION */}
            {activeTab === 'calibrate' && (
              <div className="space-y-6">
                {/* When Locked: Prominent Approved & Locked Master Banner */}
                {isLocked && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Appraisal Approved & Locked</h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Immutable Record
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          All approved compensation settings, revised CTC ({currencySymbol}{calculatedRevisedCtc.toLocaleString()}), and designation are permanently locked in the system.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLetterModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Official Appraisal Letter</span>
                    </button>
                  </div>
                )}

                {/* Rolling Score & Recommended Matrix Guideline Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                      Rolling 4-Quarter Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-indigo-950 font-mono">
                        {appraisal.averageQuarterlyScore.toFixed(2)}
                      </span>
                      <span className="text-xs text-indigo-700">/ 5.00</span>
                    </div>
                    <p className="text-[11px] text-indigo-800">
                      Calculated from {appraisal.quarterlyHistory?.length || 4} evaluated quarters
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      Rating & Increment Matrix
                    </span>
                    <div className="text-sm font-bold text-emerald-950">
                      {appraisal.recommendedRating.replace(/_/g, ' ')}
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Standard Guideline Band:{' '}
                      <strong>
                        {appraisal.suggestedIncrementMin}% - {appraisal.suggestedIncrementMax}%
                      </strong>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Current Compensation
                    </span>
                    <div className="text-xl font-bold text-slate-900 font-mono">
                      {currencySymbol}{currentCtc.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {currencySymbol}{currentMonthly.toLocaleString()} / month gross
                    </p>
                  </div>
                </div>

                {/* Live Salary Calibration Playground / Approved Settings */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>Compensation & Increment Calibration</span>
                        {isLocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>Approved & Locked</span>
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {isLocked
                          ? 'Approved increment percentage and finalized CTC impact'
                          : 'Adjust proposed increment percentage to simulate CTC budget impact'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">
                        {isLocked ? 'Approved Increment' : 'Proposed Increment'}
                      </div>
                      <div className="text-xl font-bold text-indigo-600 font-mono">+{incrementPercent.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>0% (No Revision)</span>
                      <span className="text-emerald-700 font-semibold">
                        Recommended Band: {appraisal.suggestedIncrementMin}% - {appraisal.suggestedIncrementMax}%
                      </span>
                      <span>25% (Exceptional)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="0.5"
                      value={incrementPercent}
                      disabled={isLocked}
                      onChange={(e) => setIncrementPercent(parseFloat(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none accent-indigo-600 ${
                        isLocked ? 'bg-slate-300 opacity-60 cursor-not-allowed' : 'bg-slate-200 cursor-pointer'
                      }`}
                    />
                  </div>

                  {/* Compensation Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                        <span>Annual Increment</span>
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div className="text-base font-bold text-emerald-700 font-mono">
                        +{currencySymbol}{incrementAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">+{currencySymbol}{monthlyIncrement.toLocaleString()} / mo</div>
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                      <div className="text-[10px] text-indigo-700 font-semibold uppercase flex items-center justify-between">
                        <span>Revised Annual CTC</span>
                        {isLocked && <Lock className="w-3 h-3 text-indigo-400" />}
                      </div>
                      <div className="text-lg font-bold text-indigo-950 font-mono">
                        {currencySymbol}{calculatedRevisedCtc.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-indigo-700">Gross annual fixed salary</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                        <span>Revised Monthly</span>
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div className="text-base font-bold text-slate-900 font-mono">
                        {currencySymbol}{revisedMonthly.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">Gross monthly pre-tax</div>
                    </div>
                  </div>
                </div>

                {/* Promotion Section */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-bold text-slate-900">Promotion Recommendation</h4>
                      {isLocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>

                    <label className={`flex items-center gap-2 ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={promotionRecommended}
                        disabled={isLocked}
                        onChange={(e) => setPromotionRecommended(e.target.checked)}
                        className={`w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 ${
                          isLocked ? 'cursor-not-allowed' : ''
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-700 select-none">
                        Recommend for Promotion
                      </span>
                    </label>
                  </div>

                  {promotionRecommended && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700">
                            Proposed Promoted Designation <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            {appraisal.departmentName || 'Current Department'} Track
                          </span>
                        </div>
                        <select
                          value={promotionDesignationId}
                          disabled={isLocked}
                          onChange={(e) => setPromotionDesignationId(e.target.value)}
                          className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none ${
                            isLocked ? 'cursor-not-allowed bg-slate-100 opacity-90' : 'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                          }`}
                        >
                          <option value="">-- Select Next Designation Level in {appraisal.departmentName || 'Department'} --</option>
                          {departmentDesignations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} (Level {d.level})
                            </option>
                          ))}
                        </select>
                        {departmentDesignations.length === 0 && (
                          <p className="text-[11px] text-amber-700 mt-1">
                            No higher designation progression options found for {appraisal.departmentName}.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Qualitative Justification & Comments */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        Manager Recommendation Justification <span className="text-red-500">*</span>
                      </label>
                      {isLocked && (
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked Record
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={justification}
                      disabled={isLocked || (userRole !== 'MANAGER' && userRole !== 'SUPER_ADMIN')}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Detail annual contributions, leadership milestones, and reason for proposed increment..."
                      className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none ${
                        isLocked
                          ? 'bg-slate-100/90 border-slate-200 cursor-not-allowed opacity-90'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  {(isHod || hodNotes || isLocked) && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-700">
                          HOD Departmental Calibration & Budget Notes
                        </label>
                        {isLocked && (
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked Record
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={hodNotes}
                        disabled={isLocked || (userRole !== 'HOD' && userRole !== 'SUPER_ADMIN')}
                        onChange={(e) => setHodNotes(e.target.value)}
                        placeholder="HOD normalization justification and department budget clearance notes..."
                        className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none ${
                          isLocked
                            ? 'bg-slate-100/90 border-slate-200 cursor-not-allowed opacity-90'
                            : 'bg-purple-50/30 border-purple-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500'
                        }`}
                      />
                    </div>
                  )}

                  {(isHr || hrNotes || isLocked) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700">Effective Date</label>
                          {isLocked && (
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <input
                          type="date"
                          value={effectiveDate}
                          disabled={isLocked || (userRole !== 'HR' && userRole !== 'SUPER_ADMIN')}
                          onChange={(e) => setEffectiveDate(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none ${
                            isLocked
                              ? 'bg-slate-100/90 border-slate-200 cursor-not-allowed opacity-90'
                              : 'bg-slate-50 border-slate-200 focus:bg-white'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700">HR Compliance Notes</label>
                          {isLocked && (
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={hrNotes}
                          disabled={isLocked || (userRole !== 'HR' && userRole !== 'SUPER_ADMIN')}
                          onChange={(e) => setHrNotes(e.target.value)}
                          placeholder="HR approval notes / payroll release reference"
                          className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none ${
                            isLocked
                              ? 'bg-slate-100/90 border-slate-200 cursor-not-allowed opacity-90'
                              : 'bg-slate-50 border-slate-200 focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Workflow Actions */}
                {!isLocked ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Current Action Gate:{' '}
                      <strong className="text-slate-800">
                        {appraisal.status === 'PENDING'
                          ? 'Stage 1: Manager Recommendation'
                          : appraisal.status === 'MANAGER_RECOMMENDED'
                          ? 'Stage 2: HOD Calibration'
                          : 'Stage 3: HR Final Approval & Lock'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {isManager && appraisal.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleOpenConfirm('MANAGER')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Submit Manager Recommendation</span>
                        </button>
                      )}

                      {isHod && appraisal.status === 'MANAGER_RECOMMENDED' && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleOpenConfirm('HOD')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Calibrate & Approve as HOD</span>
                        </button>
                      )}

                      {isHr && (appraisal.status === 'HOD_CALIBRATED' || appraisal.status === 'MANAGER_RECOMMENDED') && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleOpenConfirm('HR_APPROVE')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>HR Final Approval & Generate Letter</span>
                        </button>
                      )}

                      {isHr && appraisal.status === 'HR_APPROVED' && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleOpenConfirm('LOCK')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>Lock Appraisal & Release to Employee</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-emerald-950">Appraisal Finalized & Fully Approved</div>
                        <div className="text-emerald-800 text-[11px]">
                          All stages passed • Employee profile updated • Settings permanently locked
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLetterModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Appraisal Letter</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 4-QUARTER PERFORMANCE HISTORY */}
            {activeTab === 'breakdown' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">4-Quarter Performance Reviews Breakdown</h4>
                    <p className="text-xs text-slate-500">
                      Consolidated immutable quarterly review records evaluating annual performance
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500">Annual Composite Score:</span>
                    <div className="text-base font-bold text-indigo-600 font-mono">
                      {appraisal.averageQuarterlyScore.toFixed(2)} / 5.00
                    </div>
                  </div>
                </div>

                {appraisal.quarterlyHistory && appraisal.quarterlyHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appraisal.quarterlyHistory.map((q, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">{q.periodName}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border border-indigo-100">
                            <span>{q.score.toFixed(2)}</span>
                            <span className="text-[10px] text-indigo-400">/ 5.0</span>
                          </div>
                        </div>

                        {q.strengths && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-emerald-700">Key Achievements / Strengths:</span>
                            <p className="text-xs text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                              {q.strengths}
                            </p>
                          </div>
                        )}

                        {q.managerComments && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-500">Manager Evaluation:</span>
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                              {q.managerComments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No historical reviews found for this cohort.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AUDIT & STAGE SIGN-OFFS */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Multi-Stage Calibration Sign-Off Trail</h4>
                  
                  {/* Stage 1: Manager */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                          1
                        </span>
                        <span className="text-xs font-bold text-slate-900">Stage 1: Reporting Manager Recommendation</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {appraisal.managerRecommendation ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.managerRecommendation && (
                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg">
                        <div>Recommended By: <strong>{appraisal.managerRecommendation.recommendedByName}</strong></div>
                        <div>Suggested Increment: <strong>+{appraisal.managerRecommendation.suggestedIncrementPercent}%</strong></div>
                        <div>Promotion: <strong>{appraisal.managerRecommendation.promotionRecommended ? 'YES' : 'NO'}</strong></div>
                        <div>Justification: <em>"{appraisal.managerRecommendation.justification}"</em></div>
                      </div>
                    )}
                  </div>

                  {/* Stage 2: HOD */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          2
                        </span>
                        <span className="text-xs font-bold text-slate-900">Stage 2: HOD Departmental Calibration</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {appraisal.hodCalibration ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.hodCalibration && (
                      <div className="text-xs text-slate-600 space-y-1 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                        <div>Calibrated By: <strong>{appraisal.hodCalibration.calibratedByName}</strong></div>
                        <div>Calibrated Increment: <strong>+{appraisal.hodCalibration.calibratedIncrementPercent}%</strong></div>
                        <div>Notes: <em>"{appraisal.hodCalibration.notes}"</em></div>
                      </div>
                    )}
                  </div>

                  {/* Stage 3: HR */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          3
                        </span>
                        <span className="text-xs font-bold text-slate-900">Stage 3: HR Final Approval & Release</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {appraisal.hrApproval ? '✓ Approved' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.hrApproval && (
                      <div className="text-xs text-slate-600 space-y-1 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                        <div>Approved By: <strong>{appraisal.hrApproval.approvedByName}</strong></div>
                        <div>Final Increment: <strong>+{appraisal.hrApproval.finalIncrementPercent}%</strong></div>
                        <div>Revised CTC: <strong>{currencySymbol}{appraisal.hrApproval.revisedCtc.toLocaleString()}</strong></div>
                        <div>Letter Released: <strong>{appraisal.hrApproval.letterGenerated ? 'YES' : 'NO'}</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Printable Appraisal Letter Modal */}
      {showLetterModal && (
        <AppraisalLetterModal
          appraisal={appraisal}
          onClose={() => setShowLetterModal(false)}
        />
      )}

      {/* Workflow Stage Sign-Off In-App Confirmation Modal */}
      {confirmActionType && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    confirmActionType === 'MANAGER'
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : confirmActionType === 'HOD'
                      ? 'bg-purple-50 border-purple-200 text-purple-600'
                      : confirmActionType === 'HR_APPROVE'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-slate-900 border-slate-800 text-amber-400'
                  }`}
                >
                  {confirmActionType === 'MANAGER' && <Send className="w-6 h-6" />}
                  {confirmActionType === 'HOD' && <CheckCircle2 className="w-6 h-6" />}
                  {confirmActionType === 'HR_APPROVE' && <ShieldCheck className="w-6 h-6" />}
                  {confirmActionType === 'LOCK' && <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {confirmActionType === 'MANAGER' && 'Confirm Manager Recommendation'}
                      {confirmActionType === 'HOD' && 'Confirm HOD Calibration'}
                      {confirmActionType === 'HR_APPROVE' && 'Confirm HR Final Approval'}
                      {confirmActionType === 'LOCK' && 'Confirm Final Lock & Release'}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        confirmActionType === 'MANAGER'
                          ? 'bg-amber-100 text-amber-800'
                          : confirmActionType === 'HOD'
                          ? 'bg-purple-100 text-purple-800'
                          : confirmActionType === 'HR_APPROVE'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {confirmActionType === 'MANAGER' && 'Stage 1'}
                      {confirmActionType === 'HOD' && 'Stage 2'}
                      {confirmActionType === 'HR_APPROVE' && 'Stage 3'}
                      {confirmActionType === 'LOCK' && 'Final Lock'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {confirmActionType === 'MANAGER' && 'Review and submit manager rating & proposed increment'}
                    {confirmActionType === 'HOD' && 'Review and finalize departmental budget calibration'}
                    {confirmActionType === 'HR_APPROVE' && 'Review and approve compensation revision & letter'}
                    {confirmActionType === 'LOCK' && 'Finalize and lock all approved settings & release letter'}
                  </p>
                </div>
              </div>

              {/* Data Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Employee</span>
                  <span className="font-semibold text-slate-800">{appraisal.employeeName} ({appraisal.employeeCode})</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Cycle / Cohort</span>
                  <span className="font-semibold text-slate-800">{appraisal.cycleName} • {appraisal.appraisalYear}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">
                    {confirmActionType === 'MANAGER' ? 'Proposed Increment' : confirmActionType === 'HOD' ? 'Calibrated Increment' : 'Final Increment'}
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">
                    +{incrementPercent}% (+{currencySymbol}{incrementAmount.toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Revised Annual CTC</span>
                  <span className="font-bold text-slate-900 font-mono">{currencySymbol}{calculatedRevisedCtc.toLocaleString()}</span>
                </div>
                {effectiveDate && (confirmActionType === 'HR_APPROVE' || confirmActionType === 'LOCK') && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Effective Date</span>
                    <span className="font-semibold text-slate-800">{effectiveDate}</span>
                  </div>
                )}
                {promotionRecommended && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Promotion</span>
                    <span className="font-bold text-amber-700">
                      {designations.find((d) => d.id === promotionDesignationId)?.name || appraisal.promotionDesignationName || 'Promoted'}
                    </span>
                  </div>
                )}
              </div>

              {/* Stage Specific Consequence Notice */}
              <div
                className={`p-3 rounded-xl text-[11px] space-y-1 border ${
                  confirmActionType === 'LOCK'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-indigo-50/60 border-indigo-100 text-indigo-900'
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {confirmActionType === 'LOCK' ? 'Critical: Final Lock & System Action' : 'Workflow Next Step'}
                </p>
                {confirmActionType === 'MANAGER' && (
                  <p className="text-indigo-700">
                    Submitting this recommendation advances the appraisal to the HOD calibration gate. You can re-open to inspect progress at any time.
                  </p>
                )}
                {confirmActionType === 'HOD' && (
                  <p className="text-indigo-700">
                    Confirming departmental calibration forwards this review to HR for final compensation authorization and official letter generation.
                  </p>
                )}
                {confirmActionType === 'HR_APPROVE' && (
                  <p className="text-indigo-700">
                    Authorizes the final revised CTC and prepares the official printable appraisal letter. Next, HR can execute the final Lock & Release.
                  </p>
                )}
                {confirmActionType === 'LOCK' && (
                  <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-1">
                    <li><strong>Locks all approved settings</strong> permanently in the system (no further modifications).</li>
                    <li><strong>Updates Employee Profile</strong> master data with the new CTC ({currencySymbol}{calculatedRevisedCtc.toLocaleString()}) and new designation.</li>
                    <li><strong>Releases official appraisal letter</strong> to employee portal.</li>
                  </ul>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setConfirmActionType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteConfirmAction}
                  className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer ${
                    confirmActionType === 'MANAGER'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : confirmActionType === 'HOD'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : confirmActionType === 'HR_APPROVE'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : confirmActionType === 'MANAGER' ? (
                    <Send className="w-3.5 h-3.5" />
                  ) : confirmActionType === 'HOD' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : confirmActionType === 'HR_APPROVE' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {confirmActionType === 'MANAGER' && 'Confirm & Submit Recommendation'}
                    {confirmActionType === 'HOD' && 'Confirm & Submit Calibration'}
                    {confirmActionType === 'HR_APPROVE' && 'Confirm & Approve Appraisal'}
                    {confirmActionType === 'LOCK' && 'Confirm & Lock Approved Settings'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
