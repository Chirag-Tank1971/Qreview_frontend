import {
  User,
  Employee,
  Department,
  Designation,
  Cycle,
  Kra,
  KraTemplate,
  ReviewPeriod,
  EmployeeReview,
  ReviewSummaryStats,
  ReviewKraSnapshot,
  ReviewStatus,
  Appraisal,
  AppraisalSummaryStats,
  DbStatus,
  FeedbackEntry,
  PipRecord,
  TalentRecord,
  AiReviewSynthesisRequest,
  AiReviewSynthesisResult,
  AiBiasCheckRequest,
  AiBiasCheckResult,
  AiGrowthPlanRequest,
  AiGrowthPlanResult,
  AiTalentInsightsRequest,
  AiTalentInsightsResult,
} from '../types';

// Point directly to backend port 3000 if running locally or use VITE_API_BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : 'http://localhost:3000/api';
  
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('review_app_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth & Session
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User; employeeProfile?: Employee; permissions: string[] }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Session expired or invalid token');
    }
    return res.json();
  },

  async switchRole(role?: string, userId?: string) {
    const res = await fetch(`${API_BASE}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Role switch failed' }));
      throw new Error(err.error || 'Failed to switch role');
    }
    return res.json();
  },

  async getDemoUsers() {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    if (!res.ok) throw new Error('Failed to fetch demo users');
    return res.json();
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('review_app_token');
  },

  async getDbStatus(): Promise<DbStatus> {
    const res = await fetch(`${API_BASE}/system/db-status`);
    if (!res.ok) throw new Error('Failed to fetch DB status');
    return res.json();
  },

  // Employees API
  async getEmployees(params?: { departmentId?: string; cycleId?: string; status?: string; search?: string }): Promise<Employee[]> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.cycleId) query.append('cycleId', params.cycleId);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/employees?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch employee records');
    return res.json();
  },

  async getEmployeeById(id: string): Promise<Employee> {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch employee');
    return res.json();
  },

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create employee' }));
      throw new Error(err.error || 'Failed to create employee');
    }
    return res.json();
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update employee' }));
      throw new Error(err.error || 'Failed to update employee');
    }
    return res.json();
  },

  // Departments API
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async createDepartment(data: { name: string; code: string; hodId?: string; hodName?: string }): Promise<Department> {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create department' }));
      throw new Error(err.error || 'Failed to create department');
    }
    return res.json();
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update department' }));
      throw new Error(err.error || 'Failed to update department');
    }
    return res.json();
  },

  // Designations API
  async getDesignations(): Promise<Designation[]> {
    const res = await fetch(`${API_BASE}/designations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch designations');
    return res.json();
  },

  async createDesignation(data: { name: string; departmentId: string; level: number }): Promise<Designation> {
    const res = await fetch(`${API_BASE}/designations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create designation' }));
      throw new Error(err.error || 'Failed to create designation');
    }
    return res.json();
  },

  // Cycles API
  async getCycles(): Promise<Cycle[]> {
    const res = await fetch(`${API_BASE}/cycles`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch cycles');
    return res.json();
  },

  async updateCycle(id: string, data: Partial<Cycle>): Promise<Cycle> {
    const res = await fetch(`${API_BASE}/cycles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update cycle' }));
      throw new Error(err.error || 'Failed to update cycle');
    }
    return res.json();
  },

  // KRA Master Library API
  async getKras(params?: { departmentId?: string; search?: string }): Promise<Kra[]> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/kras?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch KRA library items');
    return res.json();
  },

  async createKra(data: Partial<Kra>): Promise<Kra> {
    const res = await fetch(`${API_BASE}/kras`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create KRA' }));
      throw new Error(err.error || 'Failed to create KRA');
    }
    return res.json();
  },

  async updateKra(id: string, data: Partial<Kra>): Promise<Kra> {
    const res = await fetch(`${API_BASE}/kras/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update KRA' }));
      throw new Error(err.error || 'Failed to update KRA');
    }
    return res.json();
  },

  // KRA Templates API
  async getKraTemplates(params?: { departmentId?: string; designationId?: string; search?: string }): Promise<KraTemplate[]> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.designationId) query.append('designationId', params.designationId);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/kra-templates?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch KRA templates');
    return res.json();
  },

  async getKraTemplateById(id: string): Promise<KraTemplate> {
    const res = await fetch(`${API_BASE}/kra-templates/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch KRA template');
    return res.json();
  },

  async createKraTemplate(data: Partial<KraTemplate>): Promise<KraTemplate> {
    const res = await fetch(`${API_BASE}/kra-templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create KRA template' }));
      throw new Error(err.error || 'Failed to create KRA template');
    }
    return res.json();
  },

  async updateKraTemplate(id: string, data: Partial<KraTemplate>): Promise<KraTemplate> {
    const res = await fetch(`${API_BASE}/kra-templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update KRA template' }));
      throw new Error(err.error || 'Failed to update KRA template');
    }
    return res.json();
  },

  // ==========================================
  // PHASE 4: REVIEW PERIODS & REVIEWS API
  // ==========================================

  async getReviewPeriods(): Promise<ReviewPeriod[]> {
    const res = await fetch(`${API_BASE}/review-periods`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch review periods');
    return res.json();
  },

  async createReviewPeriod(data: Partial<ReviewPeriod>): Promise<ReviewPeriod> {
    const res = await fetch(`${API_BASE}/review-periods`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create review period' }));
      throw new Error(err.error || 'Failed to create review period');
    }
    return res.json();
  },

  async updateReviewPeriod(id: string, data: Partial<ReviewPeriod>): Promise<ReviewPeriod> {
    const res = await fetch(`${API_BASE}/review-periods/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update review period' }));
      throw new Error(err.error || 'Failed to update review period');
    }
    return res.json();
  },

  async getReviews(params?: {
    periodId?: string;
    departmentId?: string;
    managerId?: string;
    employeeId?: string;
    status?: string;
    search?: string;
    onlyMine?: boolean;
  }): Promise<EmployeeReview[]> {
    const query = new URLSearchParams();
    if (params?.periodId) query.append('periodId', params.periodId);
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.managerId) query.append('managerId', params.managerId);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.onlyMine) query.append('onlyMine', 'true');

    const res = await fetch(`${API_BASE}/reviews?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async getReviewById(id: string): Promise<EmployeeReview> {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch review');
    return res.json();
  },

  async getReviewStats(params?: { periodId?: string; departmentId?: string }): Promise<ReviewSummaryStats> {
    const query = new URLSearchParams();
    if (params?.periodId) query.append('periodId', params.periodId);
    if (params?.departmentId) query.append('departmentId', params.departmentId);

    const res = await fetch(`${API_BASE}/reviews/stats?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch review stats');
    return res.json();
  },

  async generateBatchReviews(data: {
    reviewPeriodId: string;
    departmentId?: string;
    cycleId?: string;
    overrideExisting?: boolean;
  }): Promise<{ message: string; createdCount: number; skippedCount: number; periodName: string }> {
    const res = await fetch(`${API_BASE}/reviews/generate-batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate reviews' }));
      throw new Error(err.error || 'Failed to generate reviews');
    }
    return res.json();
  },

  async scoreReview(
    id: string,
    data: {
      kraSnapshot: ReviewKraSnapshot[];
      strengths?: string;
      improvements?: string;
      managerOverallComments?: string;
      employeeComments?: string;
      hrComments?: string;
      isDraft?: boolean;
    }
  ): Promise<EmployeeReview> {
    const res = await fetch(`${API_BASE}/reviews/${id}/score`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit review scores' }));
      throw new Error(err.error || 'Failed to submit review scores');
    }
    return res.json();
  },

  async updateReviewStatus(
    id: string,
    data: {
      status: ReviewStatus;
      remarks?: string;
    }
  ): Promise<EmployeeReview> {
    const res = await fetch(`${API_BASE}/reviews/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update review status' }));
      throw new Error(err.error || 'Failed to update review status');
    }
    return res.json();
  },

  // Annual Appraisal & Salary Increment API (Phase 5)
  async getAppraisals(params?: {
    cycleId?: string;
    year?: number;
    month?: number;
    departmentId?: string;
    status?: string;
    search?: string;
    onlyMine?: boolean;
    managerId?: string;
  }): Promise<Appraisal[]> {
    const query = new URLSearchParams();
    if (params?.cycleId) query.append('cycleId', params.cycleId);
    if (params?.year) query.append('year', params.year.toString());
    if (params?.month) query.append('month', params.month.toString());
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.onlyMine) query.append('onlyMine', 'true');
    if (params?.managerId) query.append('managerId', params.managerId);

    const res = await fetch(`${API_BASE}/appraisals?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch appraisals');
    return res.json();
  },

  async getAppraisal(id: string): Promise<Appraisal> {
    const res = await fetch(`${API_BASE}/appraisals/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch appraisal details');
    return res.json();
  },

  async getAppraisalStats(params?: { cycleId?: string; year?: number; departmentId?: string }): Promise<AppraisalSummaryStats> {
    const query = new URLSearchParams();
    if (params?.cycleId) query.append('cycleId', params.cycleId);
    if (params?.year) query.append('year', params.year.toString());
    if (params?.departmentId) query.append('departmentId', params.departmentId);

    const res = await fetch(`${API_BASE}/appraisals/stats?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch appraisal stats');
    return res.json();
  },

  async initiateAppraisalCycle(data: {
    cycleId: string;
    appraisalYear?: number;
    overrideExisting?: boolean;
  }): Promise<{ message: string; cycleName: string; createdCount: number; updatedCount: number; totalEligible: number }> {
    const res = await fetch(`${API_BASE}/appraisals/initiate-cycle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to initiate appraisal cycle' }));
      throw new Error(err.error || 'Failed to initiate appraisal cycle');
    }
    return res.json();
  },

  async submitManagerRecommendation(
    id: string,
    data: {
      suggestedIncrementPercent: number;
      promotionRecommended: boolean;
      promotionDesignationId?: string;
      promotionDesignationName?: string;
      justification: string;
      strengthsSummary?: string;
    }
  ): Promise<Appraisal> {
    const res = await fetch(`${API_BASE}/appraisals/${id}/manager-recommend`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit manager recommendation' }));
      throw new Error(err.error || 'Failed to submit manager recommendation');
    }
    return res.json();
  },

  async submitHodCalibration(
    id: string,
    data: {
      calibratedIncrementPercent: number;
      promotionApproved: boolean;
      calibratedRating?: string;
      notes: string;
    }
  ): Promise<Appraisal> {
    const res = await fetch(`${API_BASE}/appraisals/${id}/hod-calibrate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit HOD calibration' }));
      throw new Error(err.error || 'Failed to submit HOD calibration');
    }
    return res.json();
  },

  async submitHrApproval(
    id: string,
    data: {
      finalIncrementPercent: number;
      finalRating: string;
      revisedCtc?: number;
      effectiveDate: string;
      notes?: string;
    }
  ): Promise<Appraisal> {
    const res = await fetch(`${API_BASE}/appraisals/${id}/hr-approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to approve appraisal' }));
      throw new Error(err.error || 'Failed to approve appraisal');
    }
    return res.json();
  },

  async lockAppraisal(id: string): Promise<Appraisal> {
    const res = await fetch(`${API_BASE}/appraisals/${id}/lock`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to lock appraisal' }));
      throw new Error(err.error || 'Failed to lock appraisal');
    }
    return res.json();
  },

  async acknowledgeAppraisal(id: string, comments?: string): Promise<Appraisal> {
    const res = await fetch(`${API_BASE}/appraisals/${id}/acknowledge`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to acknowledge appraisal' }));
      throw new Error(err.error || 'Failed to acknowledge appraisal');
    }
    return res.json();
  },

  async getAppraisalLetter(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/appraisals/${id}/letter`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate appraisal letter');
    return res.json();
  },

  // Employee Self-Service (ESS) & Quarterly Self-Assessment (Phase 3)
  async submitSelfAssessment(
    reviewId: string,
    data: {
      kraSnapshot: ReviewKraSnapshot[];
      selfStrengths?: string;
      selfImprovements?: string;
      selfObstacles?: string;
      isDraft?: boolean;
    }
  ): Promise<EmployeeReview> {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}/self-assess`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit self assessment' }));
      throw new Error(err.error || 'Failed to submit self assessment');
    }
    return res.json();
  },

  async getEssOverview(employeeId?: string): Promise<any> {
    const endpoint = employeeId ? `${API_BASE}/ess/overview/${employeeId}` : `${API_BASE}/ess/overview/me`;
    const res = await fetch(endpoint, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch ESS overview' }));
      throw new Error(err.error || 'Failed to fetch ESS overview');
    }
    return res.json();
  },

  // Executive Analytics, Bell Curve Normalization & Budget Pools (Phase 4)
  async getExecutiveAnalytics(params?: { cycleId?: string; year?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.cycleId) query.append('cycleId', params.cycleId);
    if (params?.year) query.append('year', String(params.year));

    const res = await fetch(`${API_BASE}/appraisals/analytics/executive?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch executive analytics' }));
      throw new Error(err.error || 'Failed to fetch executive analytics');
    }
    return res.json();
  },

  // Automated Notifications & Workflow Hub (Phase 5)
  async getNotifications(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async deleteNotification(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return res.json();
  },

  async completeNotification(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete notification');
    return res.json();
  },

  // Dedicated Reports Center (Section 16 Specification)
  async getQuarterlyStatusReport(params?: { periodId?: string; departmentId?: string; cycleId?: string; status?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.periodId) q.append('periodId', params.periodId);
    if (params?.departmentId) q.append('departmentId', params.departmentId);
    if (params?.cycleId) q.append('cycleId', params.cycleId);
    if (params?.status) q.append('status', params.status);
    const res = await fetch(`${API_BASE}/reports/quarterly-status?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch quarterly status report');
    return res.json();
  },

  async getPendingOverdueReport(params?: { departmentId?: string; cycleId?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.departmentId) q.append('departmentId', params.departmentId);
    if (params?.cycleId) q.append('cycleId', params.cycleId);
    const res = await fetch(`${API_BASE}/reports/pending-overdue?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch pending/overdue report');
    return res.json();
  },

  async getEmployeeHistoryReport(params?: { departmentId?: string; cycleId?: string; search?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.departmentId) q.append('departmentId', params.departmentId);
    if (params?.cycleId) q.append('cycleId', params.cycleId);
    if (params?.search) q.append('search', params.search);
    const res = await fetch(`${API_BASE}/reports/employee-history?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch employee history report');
    return res.json();
  },

  async getDepartmentPerformanceReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/department-performance`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch department performance report');
    return res.json();
  },

  async getManagerCompletionReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/manager-completion`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch manager completion report');
    return res.json();
  },

  async getAppraisalDueReport(params?: { cycleId?: string; year?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.cycleId) q.append('cycleId', params.cycleId);
    if (params?.year) q.append('year', String(params.year));
    const res = await fetch(`${API_BASE}/reports/appraisal-due?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch appraisal due report');
    return res.json();
  },

  async getRatingTrendReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/rating-trend`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch rating trend report');
    return res.json();
  },

  async getKraPerformanceReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/kra-performance`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch KRA performance report');
    return res.json();
  },

  async getAuditTrailReport(params?: { module?: string; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.module) q.append('module', params.module);
    if (params?.limit) q.append('limit', String(params.limit));
    const res = await fetch(`${API_BASE}/reports/audit-trail?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit trail report');
    return res.json();
  },

  // ==========================================
  // Bulk Excel/CSV Import & Export Engine (Phase 7)
  // ==========================================
  async getBulkTemplate(datasetType: string): Promise<{ datasetType: string; columns: any[]; sampleData: any[] }> {
    const res = await fetch(`${API_BASE}/bulk/templates/${datasetType}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bulk template schema');
    return res.json();
  },

  async validateBulkRows(datasetType: string, rows: any[], allowUpdateExisting = true): Promise<any> {
    const res = await fetch(`${API_BASE}/bulk/validate/${datasetType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rows, allowUpdateExisting }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Validation failed' }));
      throw new Error(err.error || 'Failed to validate uploaded file data');
    }
    return res.json();
  },

  async executeBulkImport(
    datasetType: string,
    rows: any[],
    options?: { skipInvalid?: boolean; allowUpdateExisting?: boolean; fileName?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/bulk/import/${datasetType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        rows,
        skipInvalid: options?.skipInvalid ?? true,
        allowUpdateExisting: options?.allowUpdateExisting ?? true,
        fileName: options?.fileName || 'upload.xlsx',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(err.error || 'Failed to execute bulk import');
    }
    return res.json();
  },

  async getBulkExportData(datasetType: string, filters?: { cycleId?: string; departmentId?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (filters?.cycleId) q.append('cycleId', filters.cycleId);
    if (filters?.departmentId) q.append('departmentId', filters.departmentId);
    const res = await fetch(`${API_BASE}/bulk/export/${datasetType}?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to generate export dataset');
    return res.json();
  },

  async getBulkImportHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/bulk/history`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bulk import audit history');
    return res.json();
  },

  // ==========================================
  // PHASE 8: AUDIT TRAIL & COMPLIANCE TIMELINE API
  // ==========================================
  async getAuditLogs(params?: {
    searchTerm?: string;
    module?: string;
    actionType?: string;
    severity?: string;
    employeeId?: string;
    actorId?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    isFlaggedOnly?: boolean;
  }): Promise<{ success: boolean; totalCount: number; logs: any[] }> {
    const q = new URLSearchParams();
    if (params?.searchTerm) q.append('searchTerm', params.searchTerm);
    if (params?.module && params.module !== 'ALL') q.append('module', params.module);
    if (params?.actionType && params.actionType !== 'ALL') q.append('actionType', params.actionType);
    if (params?.severity && params.severity !== 'ALL') q.append('severity', params.severity);
    if (params?.employeeId) q.append('employeeId', params.employeeId);
    if (params?.actorId) q.append('actorId', params.actorId);
    if (params?.department && params.department !== 'ALL') q.append('department', params.department);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.isFlaggedOnly) q.append('isFlaggedOnly', 'true');

    const res = await fetch(`${API_BASE}/audit/logs?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getAuditSummary(): Promise<{ success: boolean; metrics: any }> {
    const res = await fetch(`${API_BASE}/audit/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit summary metrics');
    return res.json();
  },

  async getEmployeeAuditTimeline(employeeId: string): Promise<{ success: boolean; employee: any; timeline: any[] }> {
    const res = await fetch(`${API_BASE}/audit/timeline/${employeeId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch employee audit timeline');
    return res.json();
  },

  async getComplianceHealthReport(): Promise<{ success: boolean; report: any }> {
    const res = await fetch(`${API_BASE}/audit/compliance-health`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch compliance health report');
    return res.json();
  },

  async resolveComplianceFlag(flagId: string, resolutionNote: string): Promise<{ success: boolean; flag: any }> {
    const res = await fetch(`${API_BASE}/audit/flags/${flagId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolutionNote }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to resolve flag' }));
      throw new Error(err.error || 'Failed to resolve compliance flag');
    }
    return res.json();
  },

  async recordAuditEvent(data: Record<string, any>): Promise<any> {
    const res = await fetch(`${API_BASE}/audit/log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record audit event');
    return res.json();
  },

  async exportAuditReport(params?: { module?: string; format?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.module) q.append('module', params.module);
    if (params?.format) q.append('format', params.format);
    const res = await fetch(`${API_BASE}/audit/export?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to export audit report');
    return res.json();
  },

  // ==========================================
  // PHASE 9: AI & CONTINUOUS 360 FEEDBACK API
  // ==========================================

  // Continuous 360 Feedback & Kudos
  async getFeedback(params?: { employeeId?: string; department?: string; type?: string }): Promise<FeedbackEntry[]> {
    const q = new URLSearchParams();
    if (params?.employeeId) q.append('employeeId', params.employeeId);
    if (params?.department) q.append('department', params.department);
    if (params?.type) q.append('type', params.type);

    const res = await fetch(`${API_BASE}/feedback?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch feedback stream');
    return res.json();
  },

  async sendFeedback(data: Partial<FeedbackEntry>): Promise<FeedbackEntry> {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit feedback' }));
      throw new Error(err.error || 'Failed to submit feedback');
    }
    return res.json();
  },

  async reactToFeedback(id: string, userId: string): Promise<FeedbackEntry> {
    const res = await fetch(`${API_BASE}/feedback/${id}/react`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to react to feedback');
    return res.json();
  },

  // Performance Improvement Plans (PIPs)
  async getPips(params?: { employeeId?: string; status?: string }): Promise<PipRecord[]> {
    const q = new URLSearchParams();
    if (params?.employeeId) q.append('employeeId', params.employeeId);
    if (params?.status) q.append('status', params.status);

    const res = await fetch(`${API_BASE}/pips?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch PIP records');
    return res.json();
  },

  async createPip(data: Partial<PipRecord>): Promise<PipRecord> {
    const res = await fetch(`${API_BASE}/pips`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create PIP' }));
      throw new Error(err.error || 'Failed to create PIP');
    }
    return res.json();
  },

  async updatePip(id: string, data: Partial<PipRecord>): Promise<PipRecord> {
    const res = await fetch(`${API_BASE}/pips/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update PIP' }));
      throw new Error(err.error || 'Failed to update PIP');
    }
    return res.json();
  },

  async addPipCheckin(id: string, checkinData: { date?: string; weekNumber?: number; managerNotes: string; ratingOutOf5: number; actionItems: string; employeeComments?: string }): Promise<PipRecord> {
    const res = await fetch(`${API_BASE}/pips/${id}/checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(checkinData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record PIP check-in' }));
      throw new Error(err.error || 'Failed to record PIP check-in');
    }
    return res.json();
  },

  // 9-Box Talent Matrix
  async getTalentRecords(): Promise<TalentRecord[]> {
    const res = await fetch(`${API_BASE}/talent-records`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch 9-box talent records');
    return res.json();
  },

  async updateTalentRecord(id: string, data: Partial<TalentRecord>): Promise<TalentRecord> {
    const res = await fetch(`${API_BASE}/talent-records/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update talent record' }));
      throw new Error(err.error || 'Failed to update talent record');
    }
    return res.json();
  },

  // Gemini AI Operations
  async generateAiReviewSynthesis(payload: AiReviewSynthesisRequest): Promise<{ success: boolean; data: AiReviewSynthesisResult; engine: string }> {
    const res = await fetch(`${API_BASE}/gemini/generate-review-narrative`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      let errMessage = 'Failed to synthesize review';
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) errMessage = errJson.error;
      } catch {
        if (text.includes('<!doctype') || text.includes('<html')) {
          errMessage = 'Server error or gateway timeout. Please check backend status.';
        } else if (text) {
          errMessage = text;
        }
      }
      throw new Error(errMessage);
    }
    try {
      if (text.trim().startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to synthesize review');
    }
  },

  async analyzeAiBiasAndTone(payload: AiBiasCheckRequest): Promise<{ success: boolean; data: AiBiasCheckResult; engine: string }> {
    const res = await fetch(`${API_BASE}/gemini/analyze-bias-and-tone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      let errMessage = 'Failed to analyze tone and bias';
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) errMessage = errJson.error;
      } catch {
        if (text.includes('<!doctype') || text.includes('<html')) {
          errMessage = 'Server error or gateway timeout. Please check backend status.';
        } else if (text) {
          errMessage = text;
        }
      }
      throw new Error(errMessage);
    }
    try {
      if (text.trim().startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to analyze tone and bias');
    }
  },

  async generateAiGrowthPlan(payload: AiGrowthPlanRequest): Promise<{ success: boolean; data: AiGrowthPlanResult; engine: string }> {
    const res = await fetch(`${API_BASE}/gemini/generate-growth-plan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      let errMessage = 'Failed to generate growth plan';
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) errMessage = errJson.error;
      } catch {
        if (text.includes('<!doctype') || text.includes('<html')) {
          errMessage = 'Server error or gateway timeout. Please check backend status.';
        } else if (text) {
          errMessage = text;
        }
      }
      throw new Error(errMessage);
    }
    try {
      if (text.trim().startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to generate growth plan');
    }
  },

  async generateAiTalentInsights(payload: AiTalentInsightsRequest): Promise<{ success: boolean; data: AiTalentInsightsResult; engine: string }> {
    const res = await fetch(`${API_BASE}/gemini/talent-insights-summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      let errMessage = 'Failed to generate talent insights';
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) errMessage = errJson.error;
      } catch {
        if (text.includes('<!doctype') || text.includes('<html')) {
          errMessage = 'Server error or gateway timeout. Please check backend status.';
        } else if (text) {
          errMessage = text;
        }
      }
      throw new Error(errMessage);
    }
    try {
      if (text.trim().startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to generate talent insights');
    }
  },
};
