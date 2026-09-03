import React, { useState, useEffect, useMemo } from 'react';
import {
  EmployeeReview,
  ReviewKraSnapshot,
  ReviewStatus,
  User,
} from '../types';
import { api } from '../services/api';
import {
  X,
  Star,
  CheckCircle2,
  Clock,
  Send,
  Save,
  RotateCcw,
  Lock,
  Award,
  AlertCircle,
  FileText,
  UserCheck,
  History,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Printer,
} from 'lucide-react';

interface ReviewScoringModalProps {
  review: EmployeeReview | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const RATING_RUBRIC = [
  { value: 1, label: 'Needs Improvement', desc: 'Consistently below expectations / targets not achieved', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { value: 2, label: 'Developing', desc: 'Partially meets expectations; inconsistent target achievement', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 3, label: 'Meets Expectations', desc: 'Consistently achieves targets and meets key milestones', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 4, label: 'Exceeds Expectations', desc: 'Exceeds targets with high quality, speed, and ownership', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { value: 5, label: 'Outstanding', desc: 'Significantly outperforms, sets benchmarks, and displays leadership', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
];

export const ReviewScoringModal: React.FC<ReviewScoringModalProps> = ({
  review,
  currentUser,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !review) return null;

  const [snapshots, setSnapshots] = useState<ReviewKraSnapshot[]>([]);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [managerComments, setManagerComments] = useState('');
  const [hrComments, setHrComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');
  const [statusModalRemarks, setStatusModalRemarks] = useState('');
  const [showStatusModal, setShowStatusModal] = useState<ReviewStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scoring' | 'qualitative' | 'audit'>('scoring');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync state when review prop changes
  useEffect(() => {
    if (review) {
      setSnapshots(
        review.kraSnapshot.map((s) => ({
          ...s,
          rating: s.rating || 0,
          achievement: s.achievement || '',
          comments: s.comments || '',
        }))
      );
      setStrengths(review.strengths || '');
      setImprovements(review.improvements || '');
      setManagerComments(review.managerOverallComments || '');
      setHrComments(review.hrComments || '');
      setEmployeeComments(review.employeeComments || '');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [review]);

  // Real-time calculated live weighted score
  const computedScore = useMemo(() => {
    let sum = 0;
    snapshots.forEach((item) => {
      const r = item.rating || 0;
      const w = item.weight || 0;
      sum += (r * w) / 100;
    });
    return Number(sum.toFixed(2));
  }, [snapshots]);

  // Score tier label & color
  const scoreTier = useMemo(() => {
    if (computedScore === 0) return { label: 'Unscored', color: 'text-slate-500 bg-slate-100 border-slate-200' };
    if (computedScore >= 4.5) return { label: 'Outstanding (5/5 Tier)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (computedScore >= 3.5) return { label: 'Exceeds Expectations', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' };
    if (computedScore >= 2.5) return { label: 'Meets Expectations', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    return { label: 'Needs Improvement', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  }, [computedScore]);

  // Check user permissions
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'HOD';
  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGEMENT';
  const canEdit = !review.isClosed && (isManager || isHrOrAdmin);

  // Update a single snapshot row
  const handleKraChange = (index: number, field: keyof ReviewKraSnapshot, value: any) => {
    setSnapshots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save draft or submit scores
  const handleSaveScores = async (isDraft: boolean) => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation if submitting
    if (!isDraft) {
      const unrated = snapshots.some((s) => !s.rating || s.rating === 0);
      if (unrated) {
        setErrorMessage('All KRA items must be assigned a rating (1-5) before submitting the evaluation.');
        setSaving(false);
        return;
      }
    }

    try {
      await api.scoreReview(review.id, {
        kraSnapshot: snapshots,
        strengths,
        improvements,
        managerOverallComments: managerComments,
        employeeComments,
        hrComments,
        isDraft,
      });

      setSuccessMessage(isDraft ? 'Review draft saved successfully.' : 'Review evaluation submitted successfully!');
      setTimeout(() => {
        onSaved();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save review scoring.');
    } finally {
      setSaving(false);
    }
  };

  // Transition Review Status
  const handleStatusTransition = async (newStatus: ReviewStatus) => {
    setSaving(true);
    setErrorMessage('');
    try {
      await api.updateReviewStatus(review.id, {
        status: newStatus,
        remarks: statusModalRemarks || `Transitioned review status to ${newStatus}`,
      });
      setShowStatusModal(null);
      setStatusModalRemarks('');
      setSuccessMessage(`Review status updated to ${newStatus}`);
      setTimeout(() => {
        onSaved();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update review status.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-4">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: review.cycleColor || '#1e3a8a' }}
            >
              {review.cycleCode}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-slate-900">{review.employeeName}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-200 text-slate-700">
                  {review.employeeCode}
                </span>
                {review.isAppraisalMonthDue && (
                  <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-900 border border-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Appraisal Due (Cycle {review.cycleCode})</span>
                  </span>
                )}
                {review.isClosed && (
                  <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-200 text-slate-800">
                    <Lock className="w-3 h-3" />
                    <span>Closed & Locked</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {review.designationName} • {review.departmentName} • Period: <span className="font-medium text-slate-700">{review.reviewPeriodName}</span> • Manager: <span className="font-medium text-slate-700">{review.managerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title="Print Review Sheet"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMessage && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SCORE SUMMARY BANNER */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-xs text-slate-500 font-medium">Final Weighted Score</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-slate-900">{computedScore.toFixed(2)}</span>
                <span className="text-xs text-slate-400 font-medium">/ 5.00</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xs text-slate-500 font-medium">Performance Bracket</span>
              <div>
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${scoreTier.color}`}>
                  {scoreTier.label}
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xs text-slate-500 font-medium">Review Status</span>
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  {review.status}
                </span>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('scoring')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'scoring'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              KRA Scoring ({snapshots.length})
            </button>
            <button
              onClick={() => setActiveTab('qualitative')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'qualitative'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Feedback & Summary
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Trail ({review.actionHistory?.length || 0})
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
          {/* TAB 1: KRA SCORING TABLE */}
          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Key Result Areas & Weighted Evaluation</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Formula: Final Score = &Sigma; (Rating &times; Weight) &divide; 100
                </span>
              </div>

              <div className="space-y-4">
                {snapshots.map((item, idx) => {
                  const itemContribution = ((item.rating || 0) * (item.weight || 0)) / 100;
                  return (
                    <div
                      key={item.id || idx}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition-shadow hover:shadow-sm"
                    >
                      {/* KRA Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex-1 min-w-[240px]">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                            <h4 className="text-sm font-semibold text-slate-900">{item.kraName || item.title}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Weight: {item.weight}%
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                          )}
                        </div>

                        {/* Weighted Contribution Badge */}
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Score Contribution</span>
                          <div className="text-sm font-bold text-slate-800">
                            +{itemContribution.toFixed(2)} pts
                          </div>
                        </div>
                      </div>

                      {/* Target & Measurement Criteria */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 bg-slate-50/70 -mx-4 px-4 my-3 text-xs">
                        <div>
                          <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                            Target Expectation SLA
                          </span>
                          <p className="text-slate-800 mt-0.5">{item.targetSnapshot || 'None specified'}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                            Measurement Criteria / Rubric
                          </span>
                          <p className="text-slate-700 mt-0.5 font-mono text-[11px]">
                            {item.measurementCriteria || '1: Below SLA | 3: Meets SLA | 5: Exceeds SLA'}
                          </p>
                        </div>
                      </div>

                      {/* Manager Rating Selector & Feedback Inputs */}
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Performance Rating (1 to 5 Scale)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {RATING_RUBRIC.map((rubric) => {
                              const isSelected = item.rating === rubric.value;
                              return (
                                <button
                                  type="button"
                                  key={rubric.value}
                                  disabled={!canEdit}
                                  onClick={() => handleKraChange(idx, 'rating', rubric.value)}
                                  className={`text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                                    isSelected
                                      ? `${rubric.color} ring-2 ring-indigo-500 font-semibold shadow-xs`
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  } ${!canEdit ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold">{rubric.value} ★</span>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                  </div>
                                  <div className="text-[11px] font-medium mt-1 leading-tight">{rubric.label}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Key Achievement & Comments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Key Deliverables / Quantifiable Achievements
                            </label>
                            <textarea
                              rows={2}
                              disabled={!canEdit}
                              value={item.achievement || ''}
                              onChange={(e) => handleKraChange(idx, 'achievement', e.target.value)}
                              placeholder="e.g. Shipped authentication microservice with 0 critical bugs..."
                              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Manager Notes & Qualitative Feedback
                            </label>
                            <textarea
                              rows={2}
                              disabled={!canEdit}
                              value={item.comments || ''}
                              onChange={(e) => handleKraChange(idx, 'comments', e.target.value)}
                              placeholder="e.g. Demonstrated exceptional speed and code cleanliness..."
                              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: QUALITATIVE & OVERALL COMMENTS */}
          {activeTab === 'qualitative' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Comprehensive Qualitative Evaluation</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Strengths & High-Impact Contributions
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Highlight core competencies, leadership traits, mentorship, and extraordinary accomplishments..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Development Areas & Growth Opportunities
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Identify specific skill gaps, system design areas, communication habits, or training goals for next quarter..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manager Overall Summary & Appraisal Recommendations
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    placeholder="Provide overarching narrative for HOD/HR calibration, promotion readiness, or increment alignment..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>

                {isHrOrAdmin && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-semibold text-indigo-900 mb-1">
                      HR Calibration / Executive Management Remarks (Internal)
                    </label>
                    <textarea
                      rows={2}
                      value={hrComments}
                      onChange={(e) => setHrComments(e.target.value)}
                      placeholder="HR notes regarding cohort normalization, cycle appraisal recommendation, or increment approval..."
                      className="w-full text-xs p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <History className="w-4 h-4 text-slate-600" />
                <span>Lifecycle Action History & Audit Log</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(review.actionHistory || []).map((action, idx) => (
                  <div key={action.id || idx} className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">{action.action}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600">{action.performedByName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {action.performedByRole}
                        </span>
                      </div>
                      {action.remarks && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {action.remarks}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(action.performedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER & ACTIONS */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          {/* Status Transitions for HR / Admin / Manager */}
          <div className="flex items-center space-x-2">
            {isHrOrAdmin && !review.isClosed && (
              <>
                <button
                  onClick={() => setShowStatusModal('RETURNED')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return for Re-calibration</span>
                </button>
                <button
                  onClick={() => setShowStatusModal('HR_COMPLETED')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center space-x-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve & Calibrate (HR)</span>
                </button>
                <button
                  onClick={() => setShowStatusModal('CLOSED')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close & Lock Review</span>
                </button>
              </>
            )}
          </div>

          {/* Primary Scoring Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            {canEdit && (
              <>
                <button
                  disabled={saving}
                  onClick={() => handleSaveScores(true)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  disabled={saving}
                  onClick={() => handleSaveScores(false)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Evaluation</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* STATUS REMARKS MODAL OVERLAY */}
        {showStatusModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                <span>Confirm Transition to {showStatusModal}</span>
              </h4>
              <p className="text-xs text-slate-600">
                Provide audit remarks or specific instructions for this lifecycle state change:
              </p>
              <textarea
                rows={3}
                value={statusModalRemarks}
                onChange={(e) => setStatusModalRemarks(e.target.value)}
                placeholder="e.g. Scores aligned with cohort distribution. Approved for appraisal processing..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowStatusModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={() => handleStatusTransition(showStatusModal)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Confirm Transition
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
