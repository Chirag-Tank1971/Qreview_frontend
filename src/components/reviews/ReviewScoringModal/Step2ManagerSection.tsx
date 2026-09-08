import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { ReviewKraSnapshot } from '../../../types';

export const RATING_RUBRIC = [
  { value: 1, label: 'Needs Improvement', desc: 'Consistently below expectations / targets not achieved', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  { value: 2, label: 'Developing', desc: 'Partially meets expectations; inconsistent target achievement', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { value: 3, label: 'Meets Expectations', desc: 'Consistently achieves targets and meets key milestones', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { value: 4, label: 'Exceeds Expectations', desc: 'Exceeds targets with high quality, speed, and ownership', color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  { value: 5, label: 'Outstanding', desc: 'Significantly outperforms, sets benchmarks, and displays leadership', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
];

interface Step2ManagerSectionProps {
  snapshots: ReviewKraSnapshot[];
  canEdit: boolean;
  isHodCompleted: boolean;
  isHrOrAdmin: boolean;
  onKraChange: (index: number, field: keyof ReviewKraSnapshot, value: any) => void;
}

export const Step2ManagerSection: React.FC<Step2ManagerSectionProps> = ({
  snapshots,
  canEdit,
  isHodCompleted,
  isHrOrAdmin,
  onKraChange,
}) => {
  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
            Step 2: Score Key Result Areas (1 to 5 Scale)
          </h3>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
            Rate each goal based on target delivery and achievement metrics. The final score updates dynamically.
          </p>
        </div>
      </div>

      {isHodCompleted && !isHrOrAdmin && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs p-3.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
          <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <div>
            <span className="font-bold">HOD Evaluation Completed (Read-Only)</span>
            <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
              This quarterly review has been calibrated by HOD and submitted to HR. Goal ratings are now locked for manager and HOD roles.
            </p>
          </div>
        </div>
      )}

      {/* Snapshot Cards */}
      <div className="space-y-4">
        {snapshots.map((item, idx) => {
          const itemContribution = ((item.rating || 0) * (item.weight || 0)) / 100;
          return (
            <div
              key={item.id || idx}
              className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.kraName || item.title}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      Weight: {item.weight}%
                    </span>
                    {item.selfRating && (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                        Self-Rated: {item.selfRating} ★
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                    Score Contribution
                  </span>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    +{itemContribution.toFixed(2)} pts
                  </div>
                </div>
              </div>

              {/* SLA & Rubric */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                    Target Expectation SLA
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{item.targetSnapshot || 'Quality execution within SLA'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                    Measurement Criteria / Rubric
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-mono text-[11px]">
                    {item.measurementCriteria || '1: Below SLA | 3: Meets SLA | 5: Exceeds SLA'}
                  </p>
                </div>
              </div>

              {/* 1-5 Rubric Rating Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Manager Performance Rating (1 to 5 Scale)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {RATING_RUBRIC.map((rubric) => {
                    const isSelected = item.rating === rubric.value;
                    return (
                      <button
                        type="button"
                        key={rubric.value}
                        disabled={!canEdit}
                        onClick={() => onKraChange(idx, 'rating', rubric.value)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? `${rubric.color} ring-2 ring-indigo-500 font-bold shadow-xs`
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                        } ${!canEdit ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{rubric.value} ★</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <div className="text-[11px] font-semibold mt-1 leading-tight">{rubric.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remarks & Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Deliverables / Quantifiable Achievements
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    value={item.achievement || ''}
                    onChange={(e) => onKraChange(idx, 'achievement', e.target.value)}
                    placeholder="Specific milestones completed, code releases, or metrics achieved..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manager Notes & Qualitative Feedback
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    value={item.comments || ''}
                    onChange={(e) => onKraChange(idx, 'comments', e.target.value)}
                    placeholder="Observations on velocity, code hygiene, and collaboration..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
