import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { EmployeeReview, ReviewKraSnapshot } from '../../../types';

interface Step1SelfSectionProps {
  review: EmployeeReview;
  snapshots: ReviewKraSnapshot[];
}

export const Step1SelfSection: React.FC<Step1SelfSectionProps> = ({
  review,
  snapshots,
}) => {
  return (
    <div className="space-y-5">
      {/* Step Banner */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
            Step 1: Review Employee Self-Assessment
          </h3>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
            Carefully review the employee's self-evaluations, achievements, and challenges before scoring in Step 2.
          </p>
        </div>
      </div>

      {/* Submission Status Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Self-Evaluation Status:
            </span>
            {review.selfSubmittedAt ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submitted on {new Date(review.selfSubmittedAt).toLocaleDateString()}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Employee Submission</span>
              </span>
            )}
          </div>

          {review.selfScore ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">Self-Rating:</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {review.selfScore.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">/ 5.00</span>
            </div>
          ) : null}
        </div>

        {/* Qualitative Self Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Accomplishments & Strengths
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {review.selfStrengths || 'No specific strengths self-reported.'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Growth Areas & Learnings
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {review.selfImprovements || 'No specific growth areas self-reported.'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Obstacles & Support Needed
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {review.selfObstacles || 'No major blockers reported.'}
            </p>
          </div>
        </div>
      </div>

      {/* Per-KRA Self Ratings */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Goal-by-Goal Self-Assessment ({snapshots.length} KRAs)
        </h4>
        <div className="space-y-3">
          {snapshots.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{item.kraName || item.title}</h5>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                    Weight: {item.weight}%
                  </span>
                </div>
                {item.selfRating ? (
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                    Employee Self-Score: {item.selfRating} ★
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No self-score</span>
                )}
              </div>

              {item.selfAchievement && (
                <div className="text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Employee Note: </span>
                  <span>{item.selfAchievement}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
