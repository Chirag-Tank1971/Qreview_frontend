import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Heart,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Target,
  Users,
  Send,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Filter,
  Layers,
  Flame,
  ArrowUpRight,
  BookOpen,
  UserCheck,
  HelpCircle,
  Clock,
  ThumbsUp,
  MessageSquare,
  Compass,
  FileText,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import {
  User,
  Employee,
  FeedbackEntry,
  PipRecord,
  TalentRecord,
  AiReviewSynthesisResult,
  AiBiasCheckResult,
  AiGrowthPlanResult,
  AiTalentInsightsResult,
  KudosBadgeCategory,
  FeedbackType,
} from '../types';

interface AiPerformanceHubProps {
  currentUser: User;
}

export const AiPerformanceHub: React.FC<AiPerformanceHubProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'bias' | 'feedback_wall' | 'nine_box_pip' | 'growth_plan'>('synthesis');

  // Common data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);

  // 1. AI Review Synthesizer State
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [synthesisResult, setSynthesisResult] = useState<AiReviewSynthesisResult | null>(null);
  const [synthesisPerspective, setSynthesisPerspective] = useState<'manager' | 'self' | 'executive'>('manager');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // 2. AI Tone & Bias Harmonizer State
  const [biasInputText, setBiasInputText] = useState<string>(
    'Rohan always performs well but sometimes he is too quiet in meetings. Needs to be more like a rockstar communicator and show better aggression in quarterly planning.'
  );
  const [biasRatingScore, setBiasRatingScore] = useState<number>(4.2);
  const [analyzingBias, setAnalyzingBias] = useState<boolean>(false);
  const [biasResult, setBiasResult] = useState<AiBiasCheckResult | null>(null);

  // 3. Continuous 360 Feedback State
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [feedbackFilterType, setFeedbackFilterType] = useState<string>('ALL');
  const [feedbackRecipientId, setFeedbackRecipientId] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('kudos');
  const [badgeCategory, setBadgeCategory] = useState<KudosBadgeCategory>('technical_excellence');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isPublicFeedback, setIsPublicFeedback] = useState<boolean>(true);
  const [sendingFeedback, setSendingFeedback] = useState<boolean>(false);
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState<string | null>(null);

  // 4. 9-Box & PIP State
  const [talentRecords, setTalentRecords] = useState<TalentRecord[]>([]);
  const [pips, setPips] = useState<PipRecord[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TalentRecord | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState<boolean>(false);
  const [talentInsights, setTalentInsights] = useState<AiTalentInsightsResult | null>(null);
  const [activePipModal, setActivePipModal] = useState<PipRecord | null>(null);
  const [newCheckinNotes, setNewCheckinNotes] = useState<string>('');
  const [newCheckinRating, setNewCheckinRating] = useState<number>(3.5);
  const [newCheckinActions, setNewCheckinActions] = useState<string>('');
  const [savingCheckin, setSavingCheckin] = useState<boolean>(false);

  // 5. Growth Plan State
  const [growthTargetRole, setGrowthTargetRole] = useState<string>('Staff / Lead Systems Architect');
  const [generatingGrowthPlan, setGeneratingGrowthPlan] = useState<boolean>(false);
  const [growthPlanResult, setGrowthPlanResult] = useState<AiGrowthPlanResult | null>(null);

  const isNormalEmployee = currentUser.role === 'EMPLOYEE';

  // Load initial data
  useEffect(() => {
    loadBaseData();
  }, [currentUser]);

  const loadBaseData = async () => {
    setLoadingEmployees(true);
    try {
      const [empResult, fbResult, pipResult, talentResult] = await Promise.allSettled([
        api.getEmployees(),
        api.getFeedback(),
        api.getPips(),
        api.getTalentRecords(),
      ]);

      const empData = empResult.status === 'fulfilled' ? empResult.value : [];
      const fbData = fbResult.status === 'fulfilled' ? fbResult.value : [];
      const pipData = pipResult.status === 'fulfilled' ? pipResult.value : [];
      const talentData = talentResult.status === 'fulfilled' ? talentResult.value : [];

      let accessibleEmployees = empData || [];
      if (isNormalEmployee) {
        // If current user is a normal employee, match by employeeId or email/name
        const myEmp = accessibleEmployees.find(
          (e) => e.id === currentUser.employeeId || e.email?.toLowerCase() === currentUser.email?.toLowerCase() || e.name?.toLowerCase() === currentUser.name?.toLowerCase()
        );
        if (myEmp) {
          accessibleEmployees = [myEmp];
          setSelectedEmployeeId(myEmp.id);
        } else if (accessibleEmployees.length > 0) {
          accessibleEmployees = [accessibleEmployees[0]];
          setSelectedEmployeeId(accessibleEmployees[0].id);
        }
      }

      setEmployees(accessibleEmployees);
      if (!isNormalEmployee && accessibleEmployees.length > 0) {
        setSelectedEmployeeId(accessibleEmployees[0].id);
        setFeedbackRecipientId(empData?.[1]?.id || accessibleEmployees[0].id);
      } else if (isNormalEmployee && accessibleEmployees.length > 0) {
        setSelectedEmployeeId(accessibleEmployees[0].id);
        setFeedbackRecipientId(accessibleEmployees[0].id);
      }

      setFeedbackList(fbData || []);
      setPips(pipData || []);
      setTalentRecords(talentData || []);
      if (talentData && talentData.length > 0) {
        setSelectedTalent(talentData[0]);
      }
    } catch (err) {
      console.error('Failed to load base AI data', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // 1. Trigger Review Synthesis
  const handleRunSynthesis = async () => {
    if (!selectedEmployee) return;
    setSynthesizing(true);
    setSynthesisResult(null);

    try {
      const payload = {
        employeeName: selectedEmployee.name,
        designation: selectedEmployee.designationName || selectedEmployee.designationId || 'Senior Specialist',
        department: selectedEmployee.departmentName || selectedEmployee.departmentId || 'Engineering & Technology',
        quarterlyScores: [
          { quarter: 'Q1', score: 4.4, reviewNotes: 'Completed core database migration on schedule.' },
          { quarter: 'Q2', score: 4.7, reviewNotes: 'Led multi-tenant performance refactor, exceeding latency targets.' },
          { quarter: 'Q3', score: 4.5, reviewNotes: 'Proactive mentor for 2 new engineers on microservice deployment.' },
          { quarter: 'Q4', score: 4.6, reviewNotes: 'Delivered high-impact architectural roadmap with zero regressions.' },
        ],
        annualScore: 4.55,
        kraSummary: [
          { title: 'Core Deliverables & Architecture', weightage: 40, target: '>=99.9% uptime and zero high-severity bugs' },
          { title: 'Code Review & Team Velocity', weightage: 30, target: '24-hour turnaround on PR reviews' },
          { title: 'Innovation & Documentation', weightage: 30, target: 'Publish 4 technical RFCs and optimization docs' },
        ],
        kudosReceived: feedbackList
          .filter((f) => f.toEmployeeId === selectedEmployee.id)
          .map((f) => ({ category: f.badgeCategory, text: f.message })),
        perspective: synthesisPerspective,
      };

      const res = await api.generateAiReviewSynthesis(payload);
      if (res.success && res.data) {
        setSynthesisResult(res.data);
      }
    } catch (err: any) {
      console.error('Synthesis error:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  // 2. Trigger Bias & Tone Analysis
  const handleRunBiasAnalysis = async () => {
    if (!biasInputText.trim()) return;
    setAnalyzingBias(true);
    try {
      const res = await api.analyzeAiBiasAndTone({
        reviewText: biasInputText,
        employeeName: selectedEmployee ? selectedEmployee.name : 'Employee',
        ratingScore: biasRatingScore,
      });
      if (res.success && res.data) {
        setBiasResult(res.data);
      }
    } catch (err: any) {
      console.error('Bias check error:', err);
    } finally {
      setAnalyzingBias(false);
    }
  };

  // 3. Send 360 Feedback
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackRecipientId || !feedbackMessage.trim()) return;
    setSendingFeedback(true);

    try {
      const recipient = employees.find((emp) => emp.id === feedbackRecipientId);
      const newEntry = await api.sendFeedback({
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        fromUserRole: currentUser.role,
        toEmployeeId: feedbackRecipientId,
        toEmployeeName: recipient ? recipient.name : 'Team Member',
        toDepartment: recipient?.departmentName || recipient?.departmentId || 'General',
        type: feedbackType,
        badgeCategory,
        message: feedbackMessage,
        isPublic: isPublicFeedback,
      });

      setFeedbackList([newEntry, ...feedbackList]);
      setFeedbackMessage('');
      setFeedbackSuccessNotice('Recognition successfully posted to the Continuous Feedback stream!');
      setTimeout(() => setFeedbackSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Feedback submit error:', err);
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleLikeFeedback = async (feedbackId: string) => {
    try {
      const updated = await api.reactToFeedback(feedbackId, currentUser.id);
      setFeedbackList((prev) => prev.map((f) => (f.id === feedbackId ? updated : f)));
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // 4. Generate Strategic Talent Insights
  const handleRunTalentInsights = async () => {
    setGeneratingInsights(true);
    try {
      const highPerformers = talentRecords.filter((t) => t.performanceLevel === 'high').length;
      const coreCount = talentRecords.filter((t) => t.performanceLevel === 'medium').length;
      const underCount = talentRecords.filter((t) => t.performanceLevel === 'low').length;
      const flightRiskCount = talentRecords.filter((t) => t.flightRisk === 'high' || t.flightRisk === 'medium').length;

      const res = await api.generateAiTalentInsights({
        department: 'All Departments (Executive Rollup)',
        cycleName: 'Annual Calibration Cycle F (Sep)',
        talentPoolSummary: {
          totalEmployees: talentRecords.length,
          highPerformersCount: highPerformers,
          coreCount,
          underperformersCount: underCount,
          highRiskAttritionCount: flightRiskCount,
        },
      });

      if (res.success && res.data) {
        setTalentInsights(res.data);
      }
    } catch (err: any) {
      console.error('Talent insights error:', err);
    } finally {
      setGeneratingInsights(false);
    }
  };

  // 5. Generate Career Growth Plan
  const handleRunGrowthPlan = async () => {
    if (!selectedEmployee) return;
    setGeneratingGrowthPlan(true);
    try {
      const res = await api.generateAiGrowthPlan({
        employeeName: selectedEmployee.name,
        designation: selectedEmployee.designationName || selectedEmployee.designationId || 'Specialist',
        department: selectedEmployee.departmentName || selectedEmployee.departmentId || 'Engineering',
        currentScore: 4.5,
        strengths: ['High architectural rigor', 'Fast milestone delivery', 'Strong code quality'],
        weaknesses: ['Cross-functional executive communication', 'Broader system capacity planning'],
        aspirationalRole: growthTargetRole,
      });

      if (res.success && res.data) {
        setGrowthPlanResult(res.data);
      }
    } catch (err) {
      console.error('Growth plan error:', err);
    } finally {
      setGeneratingGrowthPlan(false);
    }
  };

  // Add PIP Check-in
  const handleSavePipCheckin = async () => {
    if (!activePipModal || !newCheckinNotes.trim()) return;
    setSavingCheckin(true);
    try {
      const updated = await api.addPipCheckin(activePipModal.id, {
        managerNotes: newCheckinNotes,
        ratingOutOf5: newCheckinRating,
        actionItems: newCheckinActions,
        employeeComments: 'Employee acknowledged feedback and agreed to priority action items.',
      });

      setPips((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setActivePipModal(updated);
      setNewCheckinNotes('');
      setNewCheckinActions('');
    } catch (err) {
      console.error('Checkin save error:', err);
    } finally {
      setSavingCheckin(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const filteredFeedbacks = feedbackList.filter((f) => {
    if (feedbackFilterType === 'ALL') return true;
    return f.type === feedbackFilterType;
  });

  const getBadgeIcon = (cat: KudosBadgeCategory) => {
    switch (cat) {
      case 'leadership':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'customer_first':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'technical_excellence':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'team_collaboration':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'innovation':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'speed_execution':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default:
        return <Award className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getBadgeLabel = (cat: KudosBadgeCategory) => {
    return cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div id="ai_performance_hub_container" className="space-y-6">
      {/* Top Header Card */}
      <div id="ai_hub_header" className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI-Assisted Intelligence Suite
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8 Flash Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Performance & Continuous Feedback Hub</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Harmonize annual appraisal narratives, perform bias checks, facilitate real-time peer recognitions, and optimize talent mobility using Google GenAI models.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh_data_btn"
              onClick={loadBaseData}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div id="ai_hub_tabs" className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl px-4 pt-3 overflow-x-auto gap-2">
        <button
          id="tab_btn_synthesis"
          onClick={() => setActiveTab('synthesis')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'synthesis'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Review Narrative Synthesizer
        </button>

        <button
          id="tab_btn_bias"
          onClick={() => setActiveTab('bias')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'bias'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Tone & Bias Harmonizer
        </button>

        <button
          id="tab_btn_feedback"
          onClick={() => setActiveTab('feedback_wall')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'feedback_wall'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Continuous 360° Kudos Wall
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            {feedbackList.length}
          </span>
        </button>

        <button
          id="tab_btn_nine_box"
          onClick={() => setActiveTab('nine_box_pip')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'nine_box_pip'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          9-Box Matrix & PIP Tracker
        </button>

        <button
          id="tab_btn_growth"
          onClick={() => setActiveTab('growth_plan')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'growth_plan'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          Career Growth & Upskilling
        </button>
      </div>

      {/* TAB 1: AI REVIEW NARRATIVE SYNTHESIZER */}
      {activeTab === 'synthesis' && (
        <div id="tab_content_synthesis" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls Column */}
              <div className="space-y-5 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Target Employee
                  </label>
                  <select
                    id="select_synthesis_employee"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Appraisal Perspective
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['manager', 'self', 'executive'] as const).map((p) => (
                      <button
                        key={p}
                        id={`perspective_btn_${p}`}
                        onClick={() => setSynthesisPerspective(p)}
                        className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                          synthesisPerspective === p
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      {selectedEmployee.name}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Code: <span className="font-mono text-slate-800 dark:text-slate-200">{selectedEmployee.employeeCode}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Dept: <span className="font-medium text-slate-800 dark:text-slate-200">{selectedEmployee.departmentName || selectedEmployee.departmentId}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Rolling 4-Quarter Rollup Score:{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                        4.55 / 5.00 (Outstanding)
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Peer Kudos Count:{' '}
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">
                        {feedbackList.filter((f) => f.toEmployeeId === selectedEmployee.id).length} recognitions
                      </span>
                    </div>
                  </div>
                )}

                <button
                  id="btn_run_synthesis"
                  onClick={handleRunSynthesis}
                  disabled={synthesizing || !selectedEmployee}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {synthesizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Synthesizing with Gemini 3.7...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Synthesize Full Review & Narrative
                    </>
                  )}
                </button>
              </div>

              {/* Output Display Column */}
              <div className="lg:col-span-2 space-y-4">
                {!synthesisResult && !synthesizing && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl min-h-[360px]">
                    <Sparkles className="w-12 h-12 text-indigo-300 dark:text-indigo-500 mb-3" />
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Ready to Draft Executive Appraisals</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                      Click the button on the left to invoke Gemini 3.7. The AI models analyze the 4-quarter KRA performance rollup, peer recognitions, and weighted milestone metrics to craft publication-ready review statements.
                    </p>
                  </div>
                )}

                {synthesizing && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl min-h-[360px]">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin mb-4" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Synthesizing Performance Narrative</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Correlating Q1-Q4 ratings, feedback badges, and KRA weights...
                    </p>
                  </div>
                )}

                {synthesisResult && !synthesizing && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Executive Summary Card */}
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          Executive Summary
                        </span>
                        <button
                          onClick={() => copyToClipboard(synthesisResult.executiveSummary, 'exec')}
                          className="text-xs text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 flex items-center gap-1"
                        >
                          {copiedSection === 'exec' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSection === 'exec' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-serif">
                        {synthesisResult.executiveSummary}
                      </p>
                    </div>

                    {/* Strengths & Growth Areas Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Key Strengths & Differentiators
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {synthesisResult.topStrengths.map((str, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 rounded-xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                          <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Growth & Development Opportunities
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {synthesisResult.growthAreas.map((ga, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                              <span>{ga}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Manager & Self Narrative Drafts */}
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          Suggested Manager Appraisal Narrative
                        </span>
                        <button
                          onClick={() => copyToClipboard(synthesisResult.suggestedManagerNarrative, 'narrative')}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 font-medium"
                        >
                          {copiedSection === 'narrative' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSection === 'narrative' ? 'Copied to Clipboard' : 'Copy Narrative'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 leading-relaxed font-sans">
                        "{synthesisResult.suggestedManagerNarrative}"
                      </p>
                    </div>

                    {/* Recommended Development Goals */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Next Cycle Recommended Milestones
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {synthesisResult.recommendedDevelopmentGoals.map((g, i) => (
                          <div key={i} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {i + 1}
                            </span>
                            <span>{g}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TONE & BIAS HARMONIZER */}
      {activeTab === 'bias' && (
        <div id="tab_content_bias" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Review Feedback Draft to Audit
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Unconscious Bias & Tone Audit</span>
                </div>

                <textarea
                  id="textarea_bias_input"
                  rows={6}
                  value={biasInputText}
                  onChange={(e) => setBiasInputText(e.target.value)}
                  placeholder="Paste or type performance feedback comments here to audit for vague language, recency bias, or subjective phrasing..."
                  className="w-full p-3.5 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Assigned Performance Rating
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={biasRatingScore}
                        onChange={(e) => setBiasRatingScore(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                      <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 rounded-lg min-w-[50px] text-center">
                        {biasRatingScore} / 5
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn_audit_bias"
                    onClick={handleRunBiasAnalysis}
                    disabled={analyzingBias || !biasInputText.trim()}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition-all"
                  >
                    {analyzingBias ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Auditing Tone...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Audit Tone & Bias
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Analysis Result Panel */}
              <div className="space-y-4">
                {!biasResult && !analyzingBias && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl min-h-[300px]">
                    <ShieldCheck className="w-10 h-10 text-indigo-300 dark:text-indigo-500 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Bias & Tone Evaluation</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                      Analyze review narratives to flag ambiguous words, emotional bias, and receive a compliant, objective rewrite instantly.
                    </p>
                  </div>
                )}

                {biasResult && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Compliance & Bias Score Header */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Compliance Assessment</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 capitalize flex items-center gap-2">
                          {biasResult.complianceRating === 'COMPLIANT' && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Compliant & Objective
                            </span>
                          )}
                          {biasResult.complianceRating === 'NEEDS_REVISION' && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Revision Suggested
                            </span>
                          )}
                          {biasResult.complianceRating === 'FLAGGED' && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Flagged for Bias
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bias Risk Index</div>
                        <div className={`text-xl font-extrabold ${biasResult.biasScore > 35 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {biasResult.biasScore} / 100
                        </div>
                      </div>
                    </div>

                    {/* Detected Issues */}
                    {biasResult.detectedIssues.length > 0 && (
                      <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Detected Ambiguities / Subjective Phrases
                        </div>
                        <div className="space-y-2">
                          {biasResult.detectedIssues.map((iss, idx) => (
                            <div key={idx} className="text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-800/60">
                              <div className="font-semibold text-rose-700 dark:text-rose-400">"{iss.phrase}"</div>
                              <div className="text-slate-600 dark:text-slate-300 mt-0.5">{iss.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliant Rewrite Card */}
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          AI Suggested Objective Rewrite
                        </span>
                        <button
                          onClick={() => {
                            setBiasInputText(biasResult.suggestedRevisedText);
                            copyToClipboard(biasResult.suggestedRevisedText, 'rewrite');
                          }}
                          className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 font-semibold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Apply & Copy
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50 font-serif leading-relaxed">
                        "{biasResult.suggestedRevisedText}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTINUOUS 360° KUDOS & RECOGNITION WALL */}
      {activeTab === 'feedback_wall' && (
        <div id="tab_content_feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Give Recognition Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Send 360° Feedback / Kudos</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Recognize peer contributions and link to KRA milestones</p>
                </div>
              </div>

              {feedbackSuccessNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {feedbackSuccessNotice}
                </div>
              )}

              <form onSubmit={handleSendFeedback} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recipient</label>
                  <select
                    id="select_kudos_recipient"
                    value={feedbackRecipientId}
                    onChange={(e) => setFeedbackRecipientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {emp.name} ({emp.departmentName || emp.departmentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback Category</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'technical_excellence', label: 'Tech Excellence', icon: Sparkles },
                      { id: 'team_collaboration', label: 'Team Collaboration', icon: Users },
                      { id: 'customer_first', label: 'Customer First', icon: Heart },
                      { id: 'leadership', label: 'Leadership', icon: Award },
                      { id: 'innovation', label: 'Innovation', icon: Flame },
                      { id: 'speed_execution', label: 'Speed & Execution', icon: TrendingUp },
                    ].map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        id={`badge_select_${b.id}`}
                        onClick={() => setBadgeCategory(b.id as KudosBadgeCategory)}
                        className={`p-2 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all text-left ${
                          badgeCategory === b.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <b.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recognition Message</label>
                  <textarea
                    id="input_feedback_message"
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Highlight specific milestone accomplishments, impact on project deadlines, or peer coaching..."
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublicFeedback}
                      onChange={(e) => setIsPublicFeedback(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Post to Company Kudos Wall</span>
                  </label>

                  <button
                    type="submit"
                    id="submit_feedback_btn"
                    disabled={sendingFeedback || !feedbackMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    {sendingFeedback ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post Recognition
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Live Stream */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filter bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Feed Stream
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Filter:</span>
                  <select
                    id="filter_feedback_type"
                    value={feedbackFilterType}
                    onChange={(e) => setFeedbackFilterType(e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Recognitions</option>
                    <option value="kudos" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Kudos Only</option>
                    <option value="growth_suggestion" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Growth Suggestions</option>
                    <option value="peer_review" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Peer Reviews</option>
                  </select>
                </div>
              </div>

              {/* Kudos Stream Items */}
              <div className="space-y-3">
                {filteredFeedbacks.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">No recognitions found matching this filter.</div>
                  </div>
                )}

                {filteredFeedbacks.map((item) => (
                  <div
                    key={item.id}
                    id={`feedback_card_${item.id}`}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {item.fromUserName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{item.fromUserName}</span>
                            <span className="text-slate-400 font-normal">→</span>
                            <span className="text-indigo-700 dark:text-indigo-400">{item.toEmployeeName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {item.toDepartment} • {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {getBadgeIcon(item.badgeCategory)}
                        <span className="text-[11px] font-semibold">{getBadgeLabel(item.badgeCategory)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pl-11 font-serif">
                      "{item.message}"
                    </p>

                    {item.linkedKraTitle && (
                      <div className="ml-11 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-md border border-slate-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                        <span>Linked KRA: {item.linkedKraTitle}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 pl-11 text-xs">
                      <button
                        onClick={() => handleLikeFeedback(item.id)}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                          item.likedBy?.includes(currentUser.id)
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{item.likesCount || 0} {item.likesCount === 1 ? 'High-Five' : 'High-Fives'}</span>
                      </button>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Quarter {item.quarter || 'Q2'} Cycle
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 9-BOX TALENT MATRIX & PIP TRACKER */}
      {activeTab === 'nine_box_pip' && (
        <div id="tab_content_nine_box" className="space-y-6">
          {/* Executive Insights Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                9-Box Succession & Performance Improvement (PIP) Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Strategic workforce stratification mapping rolling quarterly performance against future leadership potential.
              </p>
            </div>

            <button
              id="btn_run_talent_insights"
              onClick={handleRunTalentInsights}
              disabled={generatingInsights}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
            >
              {generatingInsights ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Talent Matrix...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Succession Insights
                </>
              )}
            </button>
          </div>

          {/* AI Insights Card (if generated) */}
          {talentInsights && (
            <div className="bg-indigo-950 text-white rounded-xl p-5 border border-indigo-900 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Executive Talent Health & Retention Strategy
                  </span>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-indigo-800 rounded-full text-indigo-200">
                  Department Health Score: {talentInsights.departmentHealthScore}/100
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-indigo-900/40 rounded-lg border border-indigo-800/60 space-y-2">
                  <div className="font-bold text-indigo-300">Strategic Observations</div>
                  <ul className="space-y-1 text-slate-300">
                    {talentInsights.strategicObservations.map((obs, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-indigo-400">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-indigo-900/40 rounded-lg border border-indigo-800/60 space-y-2">
                  <div className="font-bold text-emerald-300">Retention & Merit Accelerators</div>
                  <ul className="space-y-1 text-slate-300">
                    {talentInsights.retentionRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-emerald-400">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-indigo-900/40 rounded-lg border border-indigo-800/60 space-y-2">
                  <div className="font-bold text-amber-300">Succession & Immediate Action</div>
                  <ul className="space-y-1 text-slate-300">
                    {talentInsights.leadershipSuccessionPipelines.map((succ, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-400">•</span>
                        <span>{succ}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 9-Box Grid & PIP Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 9-Box Matrix Visualizer (2 Cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Interactive 9-Box Talent Grid
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    X-Axis: Performance Rollup • Y-Axis: Leadership Potential
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {talentRecords.length} Assessed Employees
                </span>
              </div>

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Top Row: High Potential */}
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 min-h-[105px]">
                  <div className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase">Untapped Enigma</div>
                  <div className="text-[9px] text-amber-700 dark:text-amber-400">Low Perf • High Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'low' && t.potentialLevel === 'high')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-amber-200 dark:border-amber-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-amber-500 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 min-h-[105px]">
                  <div className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">Growth Driver</div>
                  <div className="text-[9px] text-emerald-700 dark:text-emerald-400">Med Perf • High Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'medium' && t.potentialLevel === 'high')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-emerald-500 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-500 min-h-[105px] shadow-sm">
                  <div className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase flex items-center justify-between">
                    <span>Star Leader</span>
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-[9px] text-indigo-700 dark:text-indigo-400">High Perf • High Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'high' && t.potentialLevel === 'high')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-indigo-200 dark:border-indigo-700 text-slate-800 dark:text-slate-100 font-bold cursor-pointer text-[11px] hover:border-indigo-600 shadow-2xs flex items-center justify-between"
                        >
                          <span>{t.employeeName}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">{t.currentScore}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Middle Row: Medium Potential */}
                <div className="p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 min-h-[105px]">
                  <div className="text-[10px] font-bold text-rose-900 dark:text-rose-300 uppercase">Inconsistent Dilemma</div>
                  <div className="text-[9px] text-rose-700 dark:text-rose-400">Low Perf • Med Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'low' && t.potentialLevel === 'medium')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-rose-200 dark:border-rose-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-rose-500 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[105px]">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">Core Contributor</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Med Perf • Med Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'medium' && t.potentialLevel === 'medium')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-slate-400 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 min-h-[105px]">
                  <div className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">Key Asset</div>
                  <div className="text-[9px] text-emerald-700 dark:text-emerald-400">High Perf • Med Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'high' && t.potentialLevel === 'medium')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-emerald-500 shadow-2xs flex items-center justify-between"
                        >
                          <span>{t.employeeName}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{t.currentScore}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Bottom Row: Low Potential */}
                <div className="p-3 rounded-lg bg-rose-100/50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 min-h-[105px]">
                  <div className="text-[10px] font-bold text-rose-950 dark:text-rose-300 uppercase">Talent Risk / Action</div>
                  <div className="text-[9px] text-rose-800 dark:text-rose-400">Low Perf • Low Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'low' && t.potentialLevel === 'low')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-rose-300 dark:border-rose-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-rose-600 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[105px]">
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase">Effective Steady</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Med Perf • Low Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'medium' && t.potentialLevel === 'low')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-slate-400 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 min-h-[105px]">
                  <div className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase">Trusted Professional</div>
                  <div className="text-[9px] text-blue-700 dark:text-blue-400">High Perf • Low Pot</div>
                  <div className="mt-2 space-y-1">
                    {talentRecords
                      .filter((t) => t.performanceLevel === 'high' && t.potentialLevel === 'low')
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTalent(t)}
                          className="p-1.5 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-700 text-slate-800 dark:text-slate-100 font-medium cursor-pointer text-[11px] hover:border-blue-500 shadow-2xs"
                        >
                          {t.employeeName}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Talent Assessment Details Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Talent Profile & Mobility
              </h4>

              {selectedTalent ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedTalent.employeeName}</div>
                    <div className="text-slate-500 dark:text-slate-400">{selectedTalent.designation} • {selectedTalent.department}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Rollup Rating:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTalent.currentScore} / 5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">9-Box Quadrant:</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 capitalize">
                        {selectedTalent.nineBoxCategory.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Succession Ready:</span>
                      <span className={`font-bold ${selectedTalent.successionReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {selectedTalent.successionReady ? '✓ Ready for Next Role' : 'Developing'}
                      </span>
                    </div>
                    {selectedTalent.targetNextRole && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Target Role:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{selectedTalent.targetNextRole}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Recommended Talent Actions:</div>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-2">
                      {selectedTalent.recommendedActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500">Assessed: {selectedTalent.lastAssessedDate}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      Flight Risk: {selectedTalent.flightRisk.toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                  Click any employee in the 9-box grid to view succession profile.
                </div>
              )}
            </div>
          </div>

          {/* Performance Improvement Plan (PIP) Active Cases */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Active Performance Improvement Plans (PIP) & Check-ins
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Structured coaching milestones, SLA adherence tracking, and bi-weekly manager check-in reviews.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                {pips.length} Active Plan
              </span>
            </div>

            <div className="space-y-3">
              {pips.map((pip) => (
                <div
                  key={pip.id}
                  id={`pip_row_${pip.id}`}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{pip.employeeName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({pip.employeeCode})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                          {pip.durationDays}-Day Plan
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Manager: {pip.managerName} • Target Completion: {pip.targetEndDate}
                      </div>
                    </div>

                    <button
                      id={`btn_manage_pip_${pip.id}`}
                      onClick={() => setActivePipModal(pip)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Check-in & Review
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Milestone Progression</span>
                      <span className="text-indigo-700 dark:text-indigo-400">{pip.overallProgress}% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pip.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Chips */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {pip.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${
                          m.status === 'met'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[11px]">{m.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Target: {m.targetMetric}</div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            m.status === 'met'
                              ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Checkin History */}
                  {pip.checkins.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">
                        Latest Bi-Weekly Check-in:
                      </div>
                      <div className="text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Week {pip.checkins[pip.checkins.length - 1].weekNumber} ({pip.checkins[pip.checkins.length - 1].date}):
                        </span>{' '}
                        {pip.checkins[pip.checkins.length - 1].managerNotes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAREER GROWTH & UPSKILLING ROADMAP */}
      {activeTab === 'growth_plan' && (
        <div id="tab_content_growth" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Column */}
              <div className="space-y-4 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Employee Profile
                  </label>
                  <select
                    id="select_growth_employee"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designationName || emp.designationId || 'Specialist'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Aspirational Target Role
                  </label>
                  <input
                    type="text"
                    id="input_growth_role"
                    value={growthTargetRole}
                    onChange={(e) => setGrowthTargetRole(e.target.value)}
                    placeholder="e.g. Principal Architect / Engineering Director"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  id="btn_generate_growth_plan"
                  onClick={handleRunGrowthPlan}
                  disabled={generatingGrowthPlan || !selectedEmployee}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  {generatingGrowthPlan ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Generating Career Roadmap...
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      Generate 6-Month Growth Roadmap
                    </>
                  )}
                </button>
              </div>

              {/* Roadmap Output Column */}
              <div className="lg:col-span-2 space-y-4">
                {!growthPlanResult && !generatingGrowthPlan && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl min-h-[300px]">
                    <Compass className="w-10 h-10 text-indigo-300 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Upskilling & Progression Planner</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                      Synthesize a chronological milestone roadmap, recommended executive certifications, and high-visibility stretch projects tailored to the employee's current performance score.
                    </p>
                  </div>
                )}

                {growthPlanResult && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">Recommended Track</div>
                        <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                          {growthPlanResult.recommendedTrack}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs font-bold text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                        {growthPlanResult.timeframe}
                      </span>
                    </div>

                    {/* Milestones timeline */}
                    <div className="space-y-3">
                      {growthPlanResult.milestones.map((m, idx) => (
                        <div key={idx} className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-transparent dark:border-indigo-800">
                              {m.month}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.focusArea}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {m.actionableTask}
                          </p>
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Course/Cert: {m.recommendedCertificationOrCourse}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stretch Project & Mentor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-indigo-600" />
                          Matched Mentor Profile
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{growthPlanResult.mentorProfileMatch}</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-600" />
                          Recommended Stretch Project
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{growthPlanResult.stretchProjectIdea}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIP Check-in Modal */}
      {activePipModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record PIP Milestone Check-in
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activePipModal.employeeName} ({activePipModal.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setActivePipModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Progress Notes & Feedback
                </label>
                <textarea
                  rows={3}
                  value={newCheckinNotes}
                  onChange={(e) => setNewCheckinNotes(e.target.value)}
                  placeholder="Summarize improvements observed during the last bi-weekly period..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bi-Weekly Coaching Rating (1 - 5)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={newCheckinRating}
                    onChange={(e) => setNewCheckinRating(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-900 min-w-[50px] text-center">
                    {newCheckinRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Action Items for Next Period
                </label>
                <input
                  type="text"
                  value={newCheckinActions}
                  onChange={(e) => setNewCheckinActions(e.target.value)}
                  placeholder="e.g. Apply MEDDIC criteria to top 10 enterprise deals"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActivePipModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePipCheckin}
                disabled={savingCheckin || !newCheckinNotes.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                {savingCheckin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
