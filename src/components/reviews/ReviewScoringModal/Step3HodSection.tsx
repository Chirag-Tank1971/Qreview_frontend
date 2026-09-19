import React from 'react';
import { TrendingUp, Sparkles, Lock, UserCheck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EmployeeReview, ReviewStatus } from '../../../types';

interface Step3HodSectionProps {
  review: EmployeeReview;
  computedScore: number;
  strengths: string;
  setStrengths: (val: string) => void;
  improvements: string;
  setImprovements: (val: string) => void;
  managerComments: string;
  setManagerComments: (val: string) => void;
  hrComments: string;
  setHrComments: (val: string) => void;
  canEdit: boolean;
  isHrOrAdmin: boolean;
  canHodAct: boolean;
  hodComments: string;
  setHodComments: (val: string) => void;
  saving: boolean;
  aiLoading: boolean;
  aiSuccessNote: string;
  onAiDraftSummary: () => void;
  onOpenStatusModal: (status: ReviewStatus) => void;
}

export const Step3HodSection: React.FC<Step3HodSectionProps> = ({
  review,
  computedScore,
  strengths,
  setStrengths,
  improvements,
  setImprovements,
  managerComments,
  setManagerComments,
  hrComments,
  setHrComments,
  canEdit,
  isHrOrAdmin,
  canHodAct,
  hodComments,
  setHodComments,
  saving,
  aiLoading,
  aiSuccessNote,
  onAiDraftSummary,
  onOpenStatusModal,
}) => {
  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
              Step 3: Growth Feedback & Overall Recommendations
            </h3>
            <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
              Provide constructive growth remarks, recognize standout contributions, and generate an AI draft summary.
            </p>
          </div>
        </div>

        {/* AI Assist Action Button */}
        {canEdit && (
          <button
            type="button"
            disabled={aiLoading}
            onClick={onAiDraftSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 hover:bg-violet-200 dark:hover:bg-violet-900/60 border border-violet-300 dark:border-violet-700 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'Drafting...' : '✨ AI Draft Summary'}</span>
          </button>
        )}
      </div>

      {aiSuccessNote && (
        <div className="p-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-xs rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
          <span>{aiSuccessNote}</span>
        </div>
      )}

      {/* Main Feedback Form */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Key Strengths & Core Contributions
          </label>
          <textarea
            rows={3}
            disabled={!canEdit}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="Highlight technical depth, leadership qualities, mentorship, and extraordinary accomplishments..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Development Areas & Growth Opportunities
          </label>
          <textarea
            rows={3}
            disabled={!canEdit}
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="Identify specific skill gaps, system design areas, communication habits, or stretch goals for next quarter..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Manager Overall Summary & Appraisal Recommendations
            </label>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Overarching calibration note</span>
          </div>
          <textarea
            rows={3}
            disabled={!canEdit}
            value={managerComments}
            onChange={(e) => setManagerComments(e.target.value)}
            placeholder="Provide overarching narrative for HOD/HR calibration, promotion readiness, or increment alignment..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
          />
        </div>

        {isHrOrAdmin && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5">
              HR Calibration / Executive Management Remarks (Internal)
            </label>
            <textarea
              rows={2}
              value={hrComments}
              onChange={(e) => setHrComments(e.target.value)}
              placeholder="HR notes regarding cohort normalization, cycle appraisal recommendation, or increment approval..."
              className="w-full text-xs p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {(canHodAct || review.status === 'HOD_PENDING') && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <label className="block text-xs font-bold text-violet-950 dark:text-violet-200">
                HOD Observations
              </label>
            </div>
            <textarea
              rows={2}
              disabled={!canHodAct}
              value={hodComments}
              onChange={(e) => setHodComments(e.target.value)}
              placeholder="Optional notes on the manager's assessment before approving or returning..."
              className="w-full text-xs p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Current Stage: <span className="font-semibold text-violet-600 dark:text-violet-400">{review.status}</span> • Live Weighted Score: <span className="font-mono font-bold">{computedScore.toFixed(2)}/5.00</span>. Use the Approve / Return to Manager actions below to record your decision.
            </p>
          </div>
        )}

        {/* HR FINAL SIGN-OFF & LOCK ACTION CARD */}
        {isHrOrAdmin && !review.isClosed && (
          <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-700 shadow-md space-y-3 mt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    HR Final Sign-Off & Lock Actions
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Current Stage: <span className="font-semibold text-indigo-300">{review.status}</span> • Live Weighted Score: <span className="font-mono font-bold text-white">{computedScore.toFixed(2)}/5.00</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.status === 'HR_COMPLETED' ? (
                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ HR Approved</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onOpenStatusModal('HR_COMPLETED')}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve (HR)</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onOpenStatusModal('CLOSED')}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ring-2 ring-indigo-400/40"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Final Lock & Close</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800 pt-2.5">
              {review.status === 'HR_COMPLETED' ? (
                <>HR Calibration review has been approved. Click <strong>Final Lock & Close</strong> to complete this appraisal cycle, permanently lock all evaluations against further changes, and archive the quarterly record.</>
              ) : (
                <>Click <strong>Approve (HR)</strong> to approve calibration, or <strong>Final Lock & Close</strong> to permanently complete and archive this quarterly evaluation.</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
