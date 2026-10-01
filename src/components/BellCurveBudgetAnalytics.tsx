import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Award,
  Users,
  Building2,
  CheckCircle2,
  Sliders,
  Shield,
  Briefcase,
  Layers,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart2,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ExecutiveAnalyticsData,
  DepartmentBudgetPool,
  DepartmentBellCurve,
  Department,
  Cycle,
} from '../types';
import { api } from '../services/api';
import { PieChart } from './ui/PieChart';

interface BellCurveBudgetAnalyticsProps {
  departments: Department[];
  cycles: Cycle[];
  onOpenCalibrationModal?: (departmentId?: string) => void;
}

export const BellCurveBudgetAnalytics: React.FC<BellCurveBudgetAnalyticsProps> = ({
  departments,
  cycles,
  onOpenCalibrationModal,
}) => {
  const [data, setData] = useState<ExecutiveAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<'bellCurve' | 'budgets' | 'attrition' | 'cycles'>('bellCurve');
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getExecutiveAnalytics({
        cycleId: selectedCycleId,
        year: selectedYear,
      });
      setData(res);
      if (res.departmentBellCurves && res.departmentBellCurves.length > 0 && !expandedDeptId) {
        setExpandedDeptId(res.departmentBellCurves[0].departmentId);
      }
    } catch (err) {
      console.error('Failed to load executive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedCycleId, selectedYear]);

  const currencySymbol = '₹';

  return (
    <div className="space-y-6">
      {/* Header Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shadow-2xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bell Curve Calibration & Budget Pools Hub
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase">
                Executive & HOD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Departmental forced distribution normalization, increment budget cap tracking, and high-performer retention flight risk metrics
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Cycles</option>
            {cycles.filter((c) => c.active !== false).map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={2026} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">FY 2026</option>
            <option value={2025} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">FY 2025</option>
          </select>
        </div>
      </div>

      {/* Sub Module Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bellCurve')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bellCurve'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Departmental Bell Curve Normalization</span>
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'budgets'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Department Budget Pools & Caps</span>
        </button>

        <button
          onClick={() => setActiveTab('attrition')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'attrition'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>High-Performer Retention & Flight Risk</span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'cycles'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Cycle Cross Comparison</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Calculating Bell Curve normalizations and department budget pool telemetry...
        </div>
      ) : (
        <>
          {/* TAB 1: BELL CURVE NORMALIZATION */}
          {activeTab === 'bellCurve' && (
            <div className="space-y-6">
              {/* Overall Bell Curve Target Benchmark Card */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Standard Forced Distribution Normalization (10 - 25 - 45 - 20)</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Target organizational distribution guidelines vs. actual active cohort performance distribution.
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-semibold border border-white/20">
                    Cohort Headcount: {data.cohortSummary.totalActiveAppraisals}
                  </div>
                </div>

                {/* Visual Comparative Distribution Charts */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Organizational Distribution Comparison</span>
                    <span>Target vs Actual %</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PieChart
                      title="Target Distribution"
                      subtitle="Standard organizational guideline"
                      centerLabel="Target"
                      centerValue="100%"
                      formatValue={(v) => `${v}%`}
                      showShare={false}
                      data={[
                        { label: 'Outstanding (4.50 - 5.00)', value: 10, color: '#34d399' },
                        { label: 'Exceeds (3.80 - 4.49)', value: 25, color: '#60a5fa' },
                        { label: 'Meets Expectations (2.80 - 3.79)', value: 45, color: '#818cf8' },
                        { label: 'Needs Improvement (< 2.80)', value: 20, color: '#fbbf24' },
                      ]}
                    />
                    <PieChart
                      title="Actual Distribution"
                      subtitle={
                        (data.cohortSummary.unratedAppraisals ?? 0) > 0
                          ? `Of ${data.cohortSummary.ratedAppraisals ?? 0} rated appraisals · ${data.cohortSummary.unratedAppraisals} not yet scored`
                          : 'Active cohort performance distribution'
                      }
                      centerLabel="Rated"
                      centerValue={data.cohortSummary.ratedAppraisals ?? data.cohortSummary.totalActiveAppraisals}
                      formatValue={(v) => `${v}%`}
                      showShare={false}
                      data={[
                        {
                          label: `Outstanding (${data.bellCurveDistribution.actualCount.outstanding} emp)`,
                          value: data.bellCurveDistribution.actual.outstanding,
                          color: '#34d399',
                        },
                        {
                          label: `Exceeds (${data.bellCurveDistribution.actualCount.exceeds} emp)`,
                          value: data.bellCurveDistribution.actual.exceeds,
                          color: '#60a5fa',
                        },
                        {
                          label: `Meets Expectations (${data.bellCurveDistribution.actualCount.meets} emp)`,
                          value: data.bellCurveDistribution.actual.meets,
                          color: '#818cf8',
                        },
                        {
                          label: `Needs Improvement (${data.bellCurveDistribution.actualCount.needsImprovement} emp)`,
                          value: data.bellCurveDistribution.actual.needsImprovement,
                          color: '#fbbf24',
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Departmental Bell Curve Breakdown Cards with Forced Alerts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Departmental Distribution Curves & HOD Forced Alerts</span>
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {data.departmentBellCurves.length} Departments Calibrated
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {data.departmentBellCurves.map((deptCurve) => {
                    const isExpanded = expandedDeptId === deptCurve.departmentId;

                    return (
                      <div
                        key={deptCurve.departmentId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4"
                      >
                        <div
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                          onClick={() => setExpandedDeptId(isExpanded ? null : deptCurve.departmentId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                              {deptCurve.departmentName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white">{deptCurve.departmentName}</h5>
                                {deptCurve.departmentCode && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {deptCurve.departmentCode}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {deptCurve.totalEmployees} Active Appraisals
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {(deptCurve.unratedEmployees ?? 0) > 0 && (
                                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                                    {deptCurve.unratedEmployees} not yet scored ·{' '}
                                  </span>
                                )}
                                Click to {isExpanded ? 'collapse' : 'expand'} distribution details
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {deptCurve.skewAlert && (
                              <div
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                  deptCurve.skewSeverity === 'CRITICAL'
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{deptCurve.skewAlert}</span>
                              </div>
                            )}

                            <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg cursor-pointer">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Distribution Visual Chart */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {/* 4-bucket Distribution Donut */}
                          {deptCurve.totalEmployees === 0 ? (
                            <div className="h-7 w-full rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-500 gap-1.5 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>No active appraisals calibrated in selected cycle/year</span>
                            </div>
                          ) : (deptCurve.ratedEmployees ?? deptCurve.totalEmployees) === 0 ? (
                            <div className="h-7 w-full rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-[11px] text-amber-700 dark:text-amber-400 gap-1.5 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>None of the {deptCurve.totalEmployees} appraisals have an evaluated quarter yet — no distribution to show</span>
                            </div>
                          ) : (
                            <PieChart
                              size={140}
                              donutThickness={16}
                              legendPosition="right"
                              centerLabel="Rated"
                              centerValue={deptCurve.ratedEmployees ?? deptCurve.totalEmployees}
                              formatValue={(v) => `${v}%`}
                              showShare={false}
                              data={deptCurve.buckets.map((b) => ({
                                label: `${b.label} (${b.actualCount} emp)`,
                                value: b.actualPercent,
                                color: b.color,
                              }))}
                            />
                          )}

                          {/* Bucket Stats Breakdown */}
                          {isExpanded && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 animate-in fade-in duration-150">
                              {deptCurve.buckets.map((b) => (
                                <div
                                  key={b.ratingBand}
                                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{b.label}</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        b.status === 'SURPLUS'
                                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                          : b.status === 'DEFICIT'
                                          ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </div>
                                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                                    {b.actualPercent}%{' '}
                                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                      ({b.actualCount} emp)
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                    <span>Target: {b.targetPercent}%</span>
                                    <span
                                      className={`font-mono font-semibold ${
                                        b.deltaPercent > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      {b.deltaPercent > 0 ? `+${b.deltaPercent}%` : `${b.deltaPercent}%`}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENT BUDGET POOLS & SPEND GAUGES */}
          {activeTab === 'budgets' && (
            <div className="space-y-6">
              {/* Overall Payroll & Budget Overview Card */}
              {(() => {
                const overallCapPercent = data.cohortSummary.totalPayrollPre > 0
                  ? ((data.cohortSummary.totalBudgetCap / data.cohortSummary.totalPayrollPre) * 100).toFixed(1)
                  : '12.0';

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Current Payroll (Pre)</span>
                        <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {currencySymbol}{(data.cohortSummary.totalPayrollPre / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Total base CTC annualized</div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Allocated Budget Cap ({overallCapPercent}%)</span>
                        <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 font-mono">
                        {currencySymbol}{(data.cohortSummary.totalBudgetCap / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Approved organizational budget limit</div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Actual Spent Increment</span>
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {currencySymbol}{(data.cohortSummary.totalBudgetSpent / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {data.cohortSummary.totalPayrollPre > 0
                          ? `+${((data.cohortSummary.totalBudgetSpent / data.cohortSummary.totalPayrollPre) * 100).toFixed(2)}% of payroll`
                          : '+0% of payroll'}
                        {' · '}
                        {(data.cohortSummary.committedAppraisals ?? 0) > 0
                          ? `avg +${data.cohortSummary.committedAverageIncrementPercent}% across ${data.cohortSummary.committedAppraisals} committed`
                          : 'no increments committed yet'}
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Remaining Budget Reserve</span>
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono">
                        {currencySymbol}{((data.cohortSummary.totalBudgetCap - data.cohortSummary.totalBudgetSpent) / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Cap not yet committed to increments</div>
                    </div>
                  </div>
                );
              })()}

              {/* Departmental Pool Cards */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Real-Time Department Increment Pool Tracking</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.departmentBudgets.filter((pool) => pool.inCohort !== false).map((pool) => {
                    const spendPercentage = pool.allocatedBudgetAmount > 0
                      ? Math.min(150, Math.round((pool.actualSpentAmount / pool.allocatedBudgetAmount) * 100))
                      : 0;

                    return (
                      <div
                        key={pool.departmentId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{pool.departmentName}</h5>
                              {pool.departmentCode && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {pool.departmentCode}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  pool.status === 'EXCEEDED'
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    : pool.status === 'NEAR_CAP'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {pool.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {pool.headcount} Employees • Base CTC: {currencySymbol}{((pool.totalCurrentCtc ?? 0) / 100000).toFixed(2)}L
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                              +{pool.actualSpentPercent}%
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">Actual pool spend rate</div>
                          </div>
                        </div>

                        {/* Spend Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Spent vs Budget Cap ({pool.budgetCapPercent}%)</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{spendPercentage}% of Cap</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pool.isOverBudget
                                  ? 'bg-rose-600 dark:bg-rose-500'
                                  : pool.status === 'NEAR_CAP'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600 dark:bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, spendPercentage)}%` }}
                            />
                          </div>
                        </div>

                        {/* Metric Tiles */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Budget Cap</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                              {currencySymbol}{(pool.allocatedBudgetAmount / 100000).toFixed(2)}L
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Actual Spent</div>
                            <div className={`text-sm font-bold font-mono ${pool.isOverBudget ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                              {currencySymbol}{(pool.actualSpentAmount / 100000).toFixed(2)}L
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Remaining Pool</div>
                            <div className={`text-sm font-bold font-mono ${pool.remainingBudgetAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400'}`}>
                              {currencySymbol}{(pool.remainingBudgetAmount / 100000).toFixed(2)}L
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Departments with no appraisals in the selected cohort get no pool */}
                {data.departmentBudgets.some((pool) => pool.inCohort === false) && (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                    <div className="font-semibold text-slate-600 dark:text-slate-300">Not in this cohort — no budget pool allocated</div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.departmentBudgets
                        .filter((pool) => pool.inCohort === false)
                        .map((pool) => (
                          <span
                            key={pool.departmentId}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          >
                            {pool.departmentName}
                            {pool.departmentCode ? ` (${pool.departmentCode})` : ''} · {pool.employeeHeadcount ?? 0} employees · {pool.budgetCapPercent}% cap
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HIGH PERFORMER RETENTION & ATTRITION RISKS */}
          {activeTab === 'attrition' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Top-Performer Retention & Attrition Flight Risk Insights</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Employees with a rolling score of 4.20 or above. Risk compares each person's increment with the
                    guideline band for their score and with other top performers in this cohort — internal data only,
                    no external market benchmark.
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold">
                  {data.attritionRiskInsights.length} High Performers Identified
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Employee & Role</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">4-Qtr Score</th>
                        <th className="px-4 py-3">Increment</th>
                        <th className="px-4 py-3">Guideline Band</th>
                        <th className="px-4 py-3">Flight Risk</th>
                        <th className="px-4 py-3">Risk Diagnostic & Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.attritionRiskInsights.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
                            No employees in this cohort have a rolling score of 4.20 or above yet.
                          </td>
                        </tr>
                      )}
                      {data.attritionRiskInsights.map((risk) => (
                        <tr key={risk.employeeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            <div>{risk.employeeName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{risk.employeeCode} • {risk.designationName}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{risk.departmentName}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
                              {risk.score.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            +{risk.incrementPercent}%
                            {risk.isSystemDefaultIncrement && (
                              <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500">system default</div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                            {risk.guidelineMinPercent}–{risk.guidelineMaxPercent}%
                            {risk.peerAverageIncrementPercent !== null && risk.peerAverageIncrementPercent !== undefined && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">peer avg {risk.peerAverageIncrementPercent}%</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                risk.flightRisk === 'HIGH'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : risk.flightRisk === 'MEDIUM'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {risk.flightRisk} Risk
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs space-y-0.5">
                            <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">{risk.riskReason}</div>
                            <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">{risk.recommendedRetentionAction}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CYCLE CROSS COMPARISON */}
          {activeTab === 'cycles' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>June/September Annual Execution & Completion Benchmarks</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.cycleProgressComparison.map((cycleItem) => (
                  <div
                    key={cycleItem.cycleCode}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                          {cycleItem.cycleCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{cycleItem.cycleName}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          cycleItem.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : cycleItem.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cycleItem.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Appraisal Month</span>
                        <strong className="text-slate-800 dark:text-slate-200">{cycleItem.appraisalMonthName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Headcount</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{cycleItem.headcount} emp</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Avg Increment</span>
                        <strong className="font-mono text-emerald-700 dark:text-emerald-400">+{cycleItem.avgIncrement}%</strong>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Completion Rate</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{cycleItem.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full"
                          style={{ width: `${cycleItem.completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
