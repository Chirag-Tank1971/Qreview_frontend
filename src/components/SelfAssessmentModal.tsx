import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Sparkles,
  HelpCircle,
  Award,
  Layers,
  FileText,
} from 'lucide-react';
import { EmployeeReview, ReviewKraSnapshot } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

interface SelfAssessmentModalProps {
  review: EmployeeReview;
  onClose: () => void;
  onSuccess: (updatedReview: EmployeeReview) => void;
}

const RATING_DESCRIPTIONS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: 'Unsatisfactory', desc: 'Did not meet core deliverables; significant gaps.', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  2: { title: 'Needs Development', desc: 'Partially met targets; needs closer mentoring/support.', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  3: { title: 'Meets Expectations', desc: 'Consistently achieved committed sprint and quality goals.', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  4: { title: 'Exceeds Expectations', desc: 'Frequently surpassed targets; high quality and initiative.', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  5: { title: 'Outstanding Outperformer', desc: 'Exceptional strategic impact; sets organizational benchmark.', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

export const SelfAssessmentModal: React.FC<SelfAssessmentModalProps> = ({
  review,
  onClose,
  onSuccess,
}) => {
  const [kraStates, setKraStates] = useState<
    Array<{
      id: string;
      kraId?: string;
      kraName: string;
      title?: string;
      description?: string;
      targetSnapshot: string;
      measurementCriteria?: string;
      weight: number;
      selfRating: number;
      selfAchievement: string;
      selfComments: string;
      rating?: number;
      achievement?: string;
      comments?: string;
    }>
  >(() => {
    return (review.kraSnapshot || []).map((k) => ({
      id: k.id,
      kraId: k.kraId,
      kraName: k.kraName || k.title || 'Assigned KRA',
      title: k.title || k.kraName,
      description: k.description,
      targetSnapshot: k.targetSnapshot || 'Meet assigned quarterly milestone',
      measurementCriteria: k.measurementCriteria,
      weight: k.weight || 0,
      selfRating: k.selfRating || (k.rating ? k.rating : 3),
      selfAchievement: k.selfAchievement || k.achievement || '',
      selfComments: k.selfComments || '',
      rating: k.rating,
      achievement: k.achievement,
      comments: k.comments,
    }));
  });

  const [selfStrengths, setSelfStrengths] = useState(review.selfStrengths || '');
  const [selfImprovements, setSelfImprovements] = useState(review.selfImprovements || '');
  const [selfObstacles, setSelfObstacles] = useState(review.selfObstacles || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClosed = review.isClosed;
  const isAlreadySubmitted = review.isSelfSubmitted;

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Calculate live weighted self score
  const calculatedSelfScore = Number(
    kraStates
      .reduce((sum, item) => sum + (item.selfRating * (item.weight || 0)) / 100, 0)
      .toFixed(2)
  );

  const handleRatingChange = (id: string, newRating: number) => {
    if (isClosed) return;
    setKraStates((prev) =>
      prev.map((k) => (k.id === id ? { ...k, selfRating: newRating } : k))
    );
  };

  const handleAchievementChange = (id: string, text: string) => {
    if (isClosed) return;
    setKraStates((prev) =>
      prev.map((k) => (k.id === id ? { ...k, selfAchievement: text } : k))
    );
  };

  const handleCommentsChange = (id: string, text: string) => {
    if (isClosed) return;
    setKraStates((prev) =>
      prev.map((k) => (k.id === id ? { ...k, selfComments: text } : k))
    );
  };

  const handleSubmit = async (isDraft: boolean) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validation if submitting
      if (!isDraft) {
        const unratedKra = kraStates.find((k) => !k.selfRating || k.selfRating < 1);
        if (unratedKra) {
          const warnMsg = `Please provide a self-rating for "${unratedKra.kraName || unratedKra.title}".`;
          setError(warnMsg);
          toast.warning(warnMsg, 'Self-Rating Required');
          setIsSubmitting(false);
          return;
        }
      }

      const updated = await api.submitSelfAssessment(review.id, {
        kraSnapshot: kraStates as ReviewKraSnapshot[],
        selfStrengths,
        selfImprovements,
        selfObstacles,
        isDraft,
      });

      if (isDraft) {
        toast.info('Self-assessment draft saved.', 'Draft Saved');
      } else {
        toast.success('Self-assessment submitted to your manager!', 'Evaluation Submitted');
      }

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Error submitting self evaluation:', err);
      const errMsg = err.message || 'Failed to submit self-assessment.';
      setError(errMsg);
      toast.error(errMsg, 'Submission Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Quarterly Self-Evaluation
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  {review.reviewPeriodName}
                </span>
                {isAlreadySubmitted && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    ✓ Submitted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {review.employeeName} ({review.employeeCode}) • {review.designationName} • {review.departmentName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Score Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-950 dark:to-indigo-950 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-800">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Live Self-Assessment Score
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight font-mono">
                  {calculatedSelfScore.toFixed(2)}
                </span>
                <span className="text-sm text-indigo-300">/ 5.00</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-800/80 text-indigo-200 border border-indigo-600/50 font-semibold ml-2">
                  {calculatedSelfScore >= 4.5
                    ? 'Outstanding'
                    : calculatedSelfScore >= 3.75
                    ? 'Exceeds Expectations'
                    : calculatedSelfScore >= 2.75
                    ? 'Meets Expectations'
                    : 'Needs Improvement'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculated weighted composite from {kraStates.length} assigned KRAs ({kraStates.reduce((acc, k) => acc + (k.weight || 0), 0)}% total weight)
              </p>
            </div>

            {review.finalScore && (
              <div className="p-3 bg-white/10 dark:bg-white/5 rounded-xl border border-white/10 text-center sm:text-right">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block">
                  Manager Evaluated Score
                </span>
                <span className="text-xl font-bold font-mono text-emerald-300">
                  {review.finalScore.toFixed(2)} <span className="text-xs text-slate-300">/ 5.00</span>
                </span>
              </div>
            )}
          </div>

          {/* KRAs Self-Evaluation List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Assigned KRAs & Self-Ratings</span>
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {kraStates.length} Key Result Areas
              </span>
            </div>

            {kraStates.map((kra, index) => {
              const currentDesc = RATING_DESCRIPTIONS[kra.selfRating] || RATING_DESCRIPTIONS[3];

              return (
                <div
                  key={kra.id || index}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5 shadow-2xs"
                >
                  {/* KRA Title & Weight Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {kra.kraName || kra.title}
                        </h5>
                      </div>
                      {kra.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">{kra.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start pl-7 sm:pl-0">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
                        Weight: {kra.weight}%
                      </span>
                    </div>
                  </div>

                  {/* Target and Rubric Details */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-start gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Target Metric:</span>
                      <span className="text-slate-600 dark:text-slate-400">{kra.targetSnapshot}</span>
                    </div>
                    {kra.measurementCriteria && (
                      <div className="flex items-start gap-1.5 pt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Rubric:</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">{kra.measurementCriteria}</span>
                      </div>
                    )}
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Your Self-Rating:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono">{kra.selfRating} / 5</span>
                      </label>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentDesc.color}`}>
                        {currentDesc.title}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((ratingVal) => {
                        const isSelected = kra.selfRating === ratingVal;
                        return (
                          <button
                            key={ratingVal}
                            type="button"
                            disabled={isClosed}
                            onClick={() => handleRatingChange(kra.id, ratingVal)}
                            className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-102'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-0.5 mb-0.5">
                              <Star className={`w-3 h-3 ${isSelected ? 'fill-white text-white' : 'text-slate-400'}`} />
                              <span>{ratingVal}</span>
                            </div>
                            <div className={`text-[9px] truncate hidden sm:block ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {RATING_DESCRIPTIONS[ratingVal].title.split(' ')[0]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Self Achievement Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Key Deliverables & Milestones Achieved (Self-Reflection):
                    </label>
                    <textarea
                      disabled={isClosed}
                      value={kra.selfAchievement}
                      onChange={(e) => handleAchievementChange(kra.id, e.target.value)}
                      placeholder="e.g. Successfully shipped sprint modules on time; resolved 12 P1 bugs; automated test runs to 92% coverage..."
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  {/* Manager comparison if available */}
                  {kra.rating !== undefined && (
                    <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-indigo-950 dark:text-indigo-200">
                        <span>Manager Calibrated Score: {kra.rating} / 5</span>
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-mono">
                          Variance: {kra.selfRating - kra.rating > 0 ? `+${(kra.selfRating - kra.rating).toFixed(1)}` : (kra.selfRating - kra.rating).toFixed(1)}
                        </span>
                      </div>
                      {kra.comments && (
                        <p className="text-[11px] text-indigo-800 dark:text-indigo-300 italic">"{kra.comments}"</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Qualitative Reflection */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Strategic Self-Reflection & Growth</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Key Strengths & Major Accomplishments:
                </label>
                <textarea
                  disabled={isClosed}
                  value={selfStrengths}
                  onChange={(e) => setSelfStrengths(e.target.value)}
                  placeholder="What went particularly well this quarter? What are you most proud of?"
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Areas for Growth & Skill Acquisition:
                </label>
                <textarea
                  disabled={isClosed}
                  value={selfImprovements}
                  onChange={(e) => setSelfImprovements(e.target.value)}
                  placeholder="What skills, technical competencies, or processes do you aim to enhance?"
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Blockers, Dependencies & Manager Support Needed:
              </label>
              <textarea
                disabled={isClosed}
                value={selfObstacles}
                onChange={(e) => setSelfObstacles(e.target.value)}
                placeholder="What tooling, architectural clarity, or managerial support would help you unlock greater velocity next quarter?"
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Submitting moves the review to your manager for evaluation.</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!isClosed && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit to Manager'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
