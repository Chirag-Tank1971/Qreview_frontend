import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ReviewKraSnapshot } from '../../../types';
import { RATING_RUBRIC } from './Step2ManagerSection';

interface Step3HodScoringSectionProps {
  snapshots: ReviewKraSnapshot[];
  canHodScore: boolean;
  onKraChange: (index: number, field: keyof ReviewKraSnapshot, value: any) => void;
  hodOverallComments: string;
  setHodOverallComments: (val: string) => void;
}

/**
 * HOD's own independent KRA-by-KRA scoring pass — mirrors Step2ManagerSection's layout but
 * writes exclusively to the hod* fields on each snapshot item. The Manager's own rating is
 * shown read-only for context; it is never editable or overwritten from here.
 */
export const Step3HodScoringSection: React.FC<Step3HodScoringSectionProps> = ({
  snapshots,
  canHodScore,
  onKraChange,
  hodOverallComments,
  setHodOverallComments,
}) => {
  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-violet-50/60 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/60 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-950 dark:text-violet-200">
            Step 3: HOD Independent Scoring (1 to 5 Scale)
          </h3>
          <p className="text-xs text-violet-800/80 dark:text-violet-300/80 mt-0.5">
            Give your own rating for each KRA. This is independent of the Manager's score (shown for reference) —
            the final score is the average of both.
          </p>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="space-y-4">
        {snapshots.map((item, idx) => {
          const itemContribution = ((item.hodRating || 0) * (item.weight || 0)) / 100;
          return (
            <div
              key={item.id || idx}
              className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.kraName || item.title}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      Weight: {item.weight}%
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60">
                      Manager Rated: {item.rating || 0} ★
                    </span>
                    {(!item.hodRating || item.hodRating === 0) ? (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        Not Yet Evaluated
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        HOD Rated: {item.hodRating} ★
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
                    {(!item.hodRating || item.hodRating === 0) ? (
                      <span className="text-xs font-normal text-slate-400 italic">Pending</span>
                    ) : (
                      `+${itemContribution.toFixed(2)} pts`
                    )}
                  </div>
                </div>
              </div>

              {/* Manager's notes, read-only for context */}
              {(item.achievement || item.comments) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                  {item.achievement && (
                    <div>
                      <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                        Manager's Deliverables Note
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5">{item.achievement}</p>
                    </div>
                  )}
                  {item.comments && (
                    <div>
                      <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                        Manager's Feedback
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{item.comments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 1-5 Rubric Rating Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  HOD Performance Rating (1 to 5 Scale)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {RATING_RUBRIC.map((rubric) => {
                    const isSelected = item.hodRating === rubric.value;
                    return (
                      <button
                        type="button"
                        key={rubric.value}
                        disabled={!canHodScore}
                        onClick={() => onKraChange(idx, 'hodRating', rubric.value)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? `${rubric.color} ring-2 ring-violet-500 font-bold shadow-xs`
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                        } ${!canHodScore ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{rubric.value} ★</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                        </div>
                        <div className="text-[11px] font-semibold mt-1 leading-tight">{rubric.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HOD Deliverables / Quantifiable Achievements
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canHodScore}
                    value={item.hodAchievement || ''}
                    onChange={(e) => onKraChange(idx, 'hodAchievement', e.target.value)}
                    placeholder="Independent observation of milestones and outcomes..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HOD Notes & Qualitative Feedback
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canHodScore}
                    value={item.hodComments || ''}
                    onChange={(e) => onKraChange(idx, 'hodComments', e.target.value)}
                    placeholder="Independent observations on execution, ownership, and impact..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HOD Overall Comments */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs">
        <label className="block text-xs font-bold text-violet-950 dark:text-violet-200 mb-1.5">
          HOD Overall Comments
        </label>
        <textarea
          rows={3}
          disabled={!canHodScore}
          value={hodOverallComments}
          onChange={(e) => setHodOverallComments(e.target.value)}
          placeholder="Overall calibration remarks before forwarding to HR..."
          className="w-full text-xs p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
        />
      </div>
    </div>
  );
};
