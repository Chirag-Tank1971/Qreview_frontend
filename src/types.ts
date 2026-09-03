/**
 * Types & Data Models for Employee Quarterly Review & Appraisal Management System
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'HR'
  | 'MANAGER'
  | 'HOD'
  | 'EMPLOYEE'
  | 'MANAGEMENT';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'NOTICE';

export type ReviewStatus =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'MANAGER_PENDING'
  | 'MANAGER_COMPLETED'
  | 'HR_PENDING'
  | 'RETURNED'
  | 'HR_COMPLETED'
  | 'CLOSED';

export type AppraisalStatus =
  | 'PENDING'
  | 'MANAGER_RECOMMENDED'
  | 'HOD_CALIBRATED'
  | 'HR_APPROVED'
  | 'COMPLETED'
  | 'LOCKED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export interface User {
  id: string;
  employeeId?: string;
  email: string;
  name: string;
  role: UserRole;
  roleId: string;
  active: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  roleName: UserRole;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hodId?: string;
  hodName?: string;
  active: boolean;
  createdAt: string;
}

export interface Designation {
  id: string;
  name: string;
  departmentId: string;
  departmentName?: string;
  level: number;
  active: boolean;
}

export interface Cycle {
  id: string;
  code: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
  name: string;
  appraisalMonth: number; // 1 - 12 (Jan - Dec)
  colorHex: string;
  description?: string;
  active: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationName?: string;
  joiningDate: string;
  managerId?: string;
  managerName?: string;
  hodId?: string;
  hodName?: string;
  cycleId: string;
  cycleCode?: string;
  cycleName?: string;
  cycleColor?: string;
  currentKraTemplateId?: string;
  currentCtc?: number; // Annual CTC in currency
  currency?: string; // '₹' | '$'
  lastAppraisalDate?: string;
  status: EmployeeStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface Kra {
  id: string;
  title: string;
  description: string;
  category: string; // e.g. 'Delivery & Execution', 'Quality & Reliability', 'Leadership & Team', 'Innovation'
  metricType: 'PERCENTAGE' | 'TARGET_NUMERIC' | 'RATING_SCALE' | 'MILESTONE' | 'BOOLEAN';
  targetUnit?: string; // e.g. '%', 'bugs', 'ms', 'deals', 'ARR'
  departmentId?: string;
  departmentName?: string;
  active: boolean;
  createdAt: string;
}

export interface KraItem {
  id: string;
  kraId?: string;
  kraName?: string; // legacy support
  title: string;
  description: string;
  target: string;
  weight: number; // Percentage, sum must be 100%
  measurementCriteria?: string;
}

export interface KraTemplate {
  id: string;
  name?: string; // legacy support
  title: string;
  departmentId: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  totalWeight: number;
  items: KraItem[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPeriod {
  id: string;
  name: string; // e.g. "2026-Q3 (Jul - Sep)"
  quarter: 1 | 2 | 3 | 4;
  year: number;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'LOCKED';
}

export interface ReviewKraSnapshot {
  id: string;
  kraId?: string;
  kraName: string;
  title?: string;
  description?: string;
  targetSnapshot: string;
  measurementCriteria?: string;
  weight: number;
  selfRating?: number; // 1 - 5 self rating
  selfAchievement?: string;
  selfComments?: string;
  achievement?: string;
  rating?: number; // 1 - 5 manager rating
  comments?: string;
  issueReason?: string;
}

export interface ReviewAction {
  id: string;
  reviewId: string;
  action: 'ASSIGNED' | 'DRAFT_SAVED' | 'SELF_SUBMITTED' | 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'CLOSED';
  performedBy: string;
  performedByName: string;
  performedByRole: UserRole;
  remarks?: string;
  performedAt: string;
}

export interface EmployeeReview {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  designationName: string;
  reviewPeriodId: string;
  reviewPeriodName: string;
  cycleId: string;
  cycleCode: string;
  cycleColor: string;
  isAppraisalMonthDue: boolean;
  managerId: string;
  managerName: string;
  hodId?: string;
  hodName?: string;
  hrId?: string;
  hrName?: string;
  status: ReviewStatus;
  finalScore?: number; // Calculated: sum(rating * weight) / 100
  selfScore?: number; // Calculated: sum(selfRating * weight) / 100
  selfStrengths?: string;
  selfImprovements?: string;
  selfObstacles?: string;
  selfSubmittedAt?: string;
  isSelfSubmitted?: boolean;
  kraSnapshot: ReviewKraSnapshot[];
  actionHistory?: ReviewAction[];
  strengths?: string;
  improvements?: string;
  managerOverallComments?: string;
  hrComments?: string;
  employeeComments?: string;
  isClosed: boolean;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewSummaryStats {
  total: number;
  draft: number;
  managerPending: number;
  managerCompleted: number;
  hrPending: number;
  closed: number;
  averageScore: number;
  completionRate: number;
  distribution: {
    outstanding: number; // 4.5 - 5.0
    exceeds: number; // 3.5 - 4.49
    meets: number; // 2.5 - 3.49
    needsImprovement: number; // < 2.5
    unscored: number;
  };
}

export interface AppraisalQuarterRecord {
  periodId?: string;
  periodName: string;
  score: number;
  reviewId?: string;
  strengths?: string;
  managerComments?: string;
  hrComments?: string;
}

export interface AppraisalManagerRecommendation {
  suggestedIncrementPercent: number;
  promotionRecommended: boolean;
  promotionDesignationId?: string;
  promotionDesignationName?: string;
  justification: string;
  strengthsSummary?: string;
  recommendedBy: string;
  recommendedByName: string;
  recommendedAt: string;
}

export interface AppraisalHodCalibration {
  calibratedIncrementPercent: number;
  promotionApproved: boolean;
  calibratedRating?: string;
  notes: string;
  calibratedBy: string;
  calibratedByName: string;
  calibratedAt: string;
}

export interface AppraisalHrApproval {
  finalIncrementPercent: number;
  finalRating: string;
  revisedCtc: number;
  effectiveDate: string; // e.g. "2026-10-01"
  letterGenerated: boolean;
  letterGeneratedAt?: string;
  notes?: string;
  approvedBy: string;
  approvedByName: string;
  approvedAt: string;
}

export interface AppraisalAcknowledgement {
  acknowledged: boolean;
  acknowledgedAt: string;
  acknowledgedBy: string;
  acknowledgedByName: string;
  comments?: string;
  ipAddress?: string;
}

export interface Appraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentId?: string;
  departmentName: string;
  designationId?: string;
  designationName: string;
  managerId?: string;
  managerName?: string;
  hodId?: string;
  hodName?: string;
  cycleId: string;
  cycleCode: string;
  cycleName?: string;
  cycleColor?: string;
  appraisalYear: number;
  appraisalMonth: number;
  currentCtc: number; // e.g. 1500000
  currency: string; // e.g. '₹'
  quarterlyHistory: AppraisalQuarterRecord[];
  averageQuarterlyScore: number; // e.g. 4.45
  recommendedRating: string; // 'OUTSTANDING' | 'EXCEEDS_EXPECTATIONS' | 'MEETS_EXPECTATIONS' | 'NEEDS_IMPROVEMENT'
  suggestedIncrementMin: number;
  suggestedIncrementMax: number;
  finalRating: string;
  proposedIncrementPercentage: number;
  approvedIncrementPercentage: number;
  incrementAmount: number;
  revisedCtc: number;
  promotionRecommended: boolean;
  promotionDesignationId?: string;
  promotionDesignationName?: string;
  effectiveDate?: string;
  managerRecommendation?: AppraisalManagerRecommendation;
  hodCalibration?: AppraisalHodCalibration;
  hrApproval?: AppraisalHrApproval;
  employeeAcknowledgement?: AppraisalAcknowledgement;
  status: AppraisalStatus;
  remarks?: string;
  isLocked: boolean;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppraisalSummaryStats {
  total: number;
  pending: number;
  managerRecommended: number;
  hodCalibrated: number;
  hrApproved: number;
  locked: number;
  promotionsCount: number;
  averageScore: number;
  averageIncrement: number;
  totalCurrentPayroll: number;
  totalRevisedPayroll: number;
  totalIncrementBudgetImpact: number;
  ratingDistribution: {
    outstanding: number; // >= 4.5
    exceeds: number; // 3.8 - 4.49
    meets: number; // 2.8 - 3.79
    needsImprovement: number; // < 2.8
  };
}

export interface Notification {
  id: string;
  userId: string;
  userRole?: UserRole;
  type:
    | 'REVIEW_ASSIGNED'
    | 'DUE_SOON'
    | 'OVERDUE'
    | 'MANAGER_SUBMITTED'
    | 'RETURNED'
    | 'HR_COMPLETED'
    | 'APPRAISAL_DUE'
    | 'HOD_ACTION_REQUIRED'
    | 'BUDGET_ALERT'
    | 'CALIBRATION_WARNING'
    | 'LETTER_RELEASED'
    | 'LETTER_ACKNOWLEDGED';
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface DepartmentBudgetPool {
  departmentId: string;
  departmentName: string;
  headcount: number;
  totalCurrentCtc: number;
  budgetCapPercent: number; // e.g. 12% total departmental increment pool cap
  allocatedBudgetAmount: number;
  actualSpentAmount: number;
  remainingBudgetAmount: number;
  actualSpentPercent: number;
  isOverBudget: boolean;
  status: 'WITHIN_BUDGET' | 'NEAR_CAP' | 'EXCEEDED';
  averageScore: number;
  averageIncrement: number;
  promotionsCount: number;
}

export interface BellCurveBucket {
  ratingBand: 'OUTSTANDING' | 'EXCEEDS_EXPECTATIONS' | 'MEETS_EXPECTATIONS' | 'NEEDS_IMPROVEMENT';
  label: string;
  scoreRange: string;
  targetPercent: number; // e.g., 10%, 70% (meets+exceeds), 20%
  actualCount: number;
  actualPercent: number;
  deltaPercent: number; // actualPercent - targetPercent
  status: 'ALIGNED' | 'SURPLUS' | 'DEFICIT';
  color: string;
}

export interface DepartmentBellCurve {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  buckets: BellCurveBucket[];
  skewAlert?: string;
  skewSeverity?: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface ExecutiveAnalyticsData {
  cohortSummary: {
    totalEmployees: number;
    totalActiveAppraisals: number;
    averageScore: number;
    averageIncrementPercent: number;
    totalPayrollPre: number;
    totalPayrollPost: number;
    totalBudgetSpent: number;
    totalBudgetCap: number;
    promotionsCount: number;
  };
  bellCurveDistribution: {
    target: { outstanding: number; exceeds: number; meets: number; needsImprovement: number };
    actual: { outstanding: number; exceeds: number; meets: number; needsImprovement: number };
    actualCount: { outstanding: number; exceeds: number; meets: number; needsImprovement: number };
  };
  departmentBudgets: DepartmentBudgetPool[];
  departmentBellCurves: DepartmentBellCurve[];
  attritionRiskInsights: Array<{
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    departmentName: string;
    designationName: string;
    score: number;
    incrementPercent: number;
    rating: string;
    marketCompRatio: number; // e.g. 0.82 (underpaid)
    flightRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    riskReason: string;
    recommendedRetentionAction: string;
  }>;
  cycleProgressComparison: Array<{
    cycleCode: string;
    cycleName: string;
    appraisalMonthName: string;
    headcount: number;
    completionPercent: number;
    avgIncrement: number;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  }>;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  module: string;
  action: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  employeeProfile?: Employee;
  permissions: string[];
}

export interface DbStatus {
  connected: boolean;
  mode: 'MONGODB' | 'EMBEDDED_COMPATIBLE';
  uri?: string;
  databaseName: string;
  collections: {
    users: number;
    employees: number;
    departments: number;
    designations: number;
    cycles: number;
    kras?: number;
    kraTemplates: number;
    reviewPeriods: number;
    employeeReviews: number;
    appraisals: number;
    notifications: number;
    auditLogs: number;
  };
}

export type BulkDatasetType = 'employees' | 'kras' | 'quarterly-scores' | 'increment-matrix';

export interface BulkTemplateColumn {
  key: string;
  label: string;
  description: string;
  required: boolean;
  example: string;
  type: 'string' | 'number' | 'date' | 'enum';
  options?: string[];
}

export interface BulkValidationRowResult {
  rowNumber: number;
  data: Record<string, any>;
  isValid: boolean;
  status: 'VALID' | 'WARNING' | 'ERROR';
  errors: string[];
  warnings: string[];
  action: 'INSERT' | 'UPDATE' | 'SKIP';
}

export interface BulkValidationReport {
  datasetType: BulkDatasetType;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  canProceed: boolean;
  results: BulkValidationRowResult[];
  requiredFields: string[];
}

export interface BulkImportResult {
  success: boolean;
  datasetType: BulkDatasetType;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
  batchId: string;
  errors?: Array<{ row: number; reason: string }>;
}

export interface BulkImportHistory {
  id: string;
  fileName: string;
  datasetType: BulkDatasetType;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  importedBy: string;
  importedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  details?: string;
}

// ==========================================
// PHASE 8: AUDIT TRAIL & COMPLIANCE TIMELINE
// ==========================================

export type AuditActionType =
  | 'KRA_TEMPLATE_CREATED'
  | 'KRA_TEMPLATE_MODIFIED'
  | 'KRA_ASSIGNED'
  | 'QUARTERLY_EVALUATION_SUBMITTED'
  | 'SELF_ASSESSMENT_SUBMITTED'
  | 'MANAGER_RATING_SUBMITTED'
  | 'HOD_CALIBRATION_OVERRIDE'
  | 'INCREMENT_MATRIX_APPLIED'
  | 'BUDGET_POOL_REALLOCATED'
  | 'PROMOTION_APPROVED'
  | 'PIP_INITIATED'
  | 'PIP_CLOSED'
  | 'LETTER_GENERATED'
  | 'LETTER_PUBLISHED'
  | 'LETTER_ACKNOWLEDGED'
  | 'BULK_DATA_IMPORTED'
  | 'CYCLE_STAGE_CHANGED'
  | 'USER_LOGIN_SESSION'
  | 'SECURITY_ROLE_CHANGED';

export type AuditSeverity = 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL';

export type AuditModule =
  | 'KRA_MANAGEMENT'
  | 'QUARTERLY_REVIEW'
  | 'CALIBRATION'
  | 'BUDGET_INCREMENT'
  | 'LETTERS'
  | 'BULK_IMPORT'
  | 'SECURITY_AUTH'
  | 'CYCLE_ADMIN';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  module: AuditModule;
  severity: AuditSeverity;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorEmail?: string;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  targetDepartment?: string;
  cycleId?: string;
  cycleName?: string;
  description: string;
  previousValue?: Record<string, any> | string | number;
  newValue?: Record<string, any> | string | number;
  diffSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  isFlaggedCompliance?: boolean;
  metadata?: Record<string, any>;
}

export interface AuditTimelineEvent {
  id: string;
  stageName: string;
  stageKey: 'KRA_SETUP' | 'Q1_REVIEW' | 'Q2_REVIEW' | 'Q3_REVIEW' | 'Q4_REVIEW' | 'ANNUAL_APPRAISAL' | 'CALIBRATION' | 'INCREMENT_DECISION' | 'LETTER_RELEASE' | 'ACKNOWLEDGEMENT';
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'OVERRIDDEN' | 'FLAGGED';
  title: string;
  description: string;
  scoreBefore?: number;
  scoreAfter?: number;
  changeReason?: string;
  details?: Record<string, any>;
}

export interface ComplianceFlag {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  cycleId: string;
  flagType: 'LARGE_SCORE_OVERRIDE' | 'SUBMISSION_OVERDUE' | 'UNACKNOWLEDGED_LETTER' | 'BUDGET_OVERRUN' | 'MISSING_EVALUATION' | 'INSUFFICIENT_KRA_WEIGHT';
  severity: 'WARNING' | 'CRITICAL' | 'NOTICE';
  title: string;
  description: string;
  detectedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  impactMetric?: string;
}

export interface ComplianceRiskReport {
  overallRiskScore: number; // 0 - 100 (lower is better/safer)
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  totalActiveFlags: number;
  criticalFlagsCount: number;
  warningFlagsCount: number;
  overriddenScoresCount: number;
  unacknowledgedLettersCount: number;
  overdueSubmissionsCount: number;
  flags: ComplianceFlag[];
  departmentRiskBreakdown: Array<{
    department: string;
    riskScore: number;
    flagsCount: number;
  }>;
}

export interface AuditFilterParams {
  searchTerm?: string;
  module?: AuditModule | 'ALL';
  actionType?: AuditActionType | 'ALL';
  severity?: AuditSeverity | 'ALL';
  employeeId?: string;
  actorId?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  isFlaggedOnly?: boolean;
}

export interface AuditSummaryMetrics {
  totalLogs: number;
  todayLogsCount: number;
  calibrationsCount: number;
  letterAcknowledgementsCount: number;
  flaggedAnomaliesCount: number;
  complianceScore: number;
}

// ==========================================
// PHASE 9: AI PERFORMANCE & CONTINUOUS FEEDBACK
// ==========================================

export type KudosBadgeCategory =
  | 'leadership'
  | 'customer_first'
  | 'technical_excellence'
  | 'team_collaboration'
  | 'innovation'
  | 'speed_execution';

export type FeedbackType =
  | 'kudos'
  | 'peer_review'
  | 'constructive_feedback'
  | 'growth_suggestion';

export interface FeedbackEntry {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  fromDepartment?: string;
  toEmployeeId: string;
  toEmployeeName: string;
  toDepartment: string;
  type: FeedbackType;
  badgeCategory: KudosBadgeCategory;
  message: string;
  linkedKraTitle?: string;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  cycleId?: string;
  isPublic: boolean;
  likesCount: number;
  likedBy: string[]; // user IDs
  createdAt: string;
}

export type PipStatus =
  | 'active'
  | 'under_review'
  | 'completed_successfully'
  | 'escalated_action';

export interface PipMilestone {
  id: string;
  title: string;
  targetMetric: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'met' | 'unmet';
  notes?: string;
}

export interface PipCheckin {
  id: string;
  date: string;
  weekNumber: number;
  managerNotes: string;
  ratingOutOf5: number;
  actionItems: string;
  employeeComments?: string;
}

export interface PipRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  managerId: string;
  managerName: string;
  startDate: string;
  targetEndDate: string;
  durationDays: 30 | 60 | 90;
  status: PipStatus;
  overallProgress: number; // 0 - 100
  coreGaps: string[];
  milestones: PipMilestone[];
  checkins: PipCheckin[];
  finalOutcomeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TalentPotential = 'low' | 'medium' | 'high';
export type TalentPerformance = 'low' | 'medium' | 'high';

export type NineBoxCategory =
  | 'star_leader'
  | 'growth_driver'
  | 'untapped_enigma'
  | 'key_asset'
  | 'core_contributor'
  | 'inconsistent_dilemma'
  | 'trusted_professional'
  | 'effective_steady'
  | 'talent_risk';

export interface TalentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  currentScore: number;
  performanceLevel: TalentPerformance;
  potentialLevel: TalentPotential;
  nineBoxCategory: NineBoxCategory;
  flightRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendedActions: string[];
  successionReady: boolean;
  targetNextRole?: string;
  lastAssessedDate: string;
}

// AI Synthesizer & Generator Request/Response Models
export interface AiReviewSynthesisRequest {
  employeeName: string;
  designation: string;
  department: string;
  quarterlyScores: { quarter: string; score: number; reviewNotes?: string }[];
  annualScore: number;
  kraSummary: { title: string; weightage: number; target: string }[];
  kudosReceived?: { category: string; text: string }[];
  perspective: 'manager' | 'self' | 'executive';
}

export interface AiReviewSynthesisResult {
  executiveSummary: string;
  topStrengths: string[];
  growthAreas: string[];
  suggestedManagerNarrative: string;
  suggestedSelfAppraisalDraft: string;
  keyAchievements: string[];
  recommendedDevelopmentGoals: string[];
}

export interface AiBiasCheckRequest {
  reviewText: string;
  employeeName: string;
  ratingScore: number;
}

export interface AiBiasCheckResult {
  overallTone: 'objective_balanced' | 'constructive_neutral' | 'subjective_vague' | 'harsh_punitive' | 'overly_generous';
  biasScore: number; // 0 - 100 (0 = completely objective, 100 = highly biased)
  detectedIssues: Array<{
    phrase: string;
    issueType: 'subjective_bias' | 'vague_feedback' | 'recency_bias' | 'unsubstantiated_criticism';
    suggestion: string;
  }>;
  suggestedRevisedText: string;
  complianceRating: 'COMPLIANT' | 'NEEDS_REVISION' | 'FLAGGED';
}

export interface AiGrowthPlanRequest {
  employeeName: string;
  designation: string;
  department: string;
  currentScore: number;
  strengths: string[];
  weaknesses: string[];
  aspirationalRole?: string;
}

export interface AiGrowthPlanResult {
  recommendedTrack: string;
  timeframe: string;
  milestones: Array<{
    month: string;
    focusArea: string;
    actionableTask: string;
    recommendedCertificationOrCourse: string;
  }>;
  mentorProfileMatch: string;
  stretchProjectIdea: string;
}

export interface AiTalentInsightsRequest {
  department?: string;
  cycleName?: string;
  talentPoolSummary: {
    totalEmployees: number;
    highPerformersCount: number;
    coreCount: number;
    underperformersCount: number;
    highRiskAttritionCount: number;
  };
}

export interface AiTalentInsightsResult {
  departmentHealthScore: number;
  strategicObservations: string[];
  retentionRecommendations: string[];
  leadershipSuccessionPipelines: string[];
  immediateRiskMitigations: string[];
}

