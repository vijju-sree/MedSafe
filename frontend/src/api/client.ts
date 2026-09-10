const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('medsafe_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || `Request failed with status ${response.status}`, response.status);
  }

  return data.data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string; role?: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  registerPatient: (payload: any) =>
    request<{ token: string; user: any; patient: any; message: string }>('/auth/register-patient', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerProfessional: (payload: any) =>
    request<{ token: string; user: any; verificationStatus: string; message: string }>('/auth/register-professional', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => request<{ user: any }>('/auth/me'),

  demoSwitch: (payload: string | { role?: string; email?: string; hospitalId?: string }) =>
    request<{ token: string; user: any; message: string }>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { role: payload } : payload),
    }),

  // Consultations & Doctor Discovery
  searchDoctors: (query: string = '') =>
    request<{ doctors: any[] }>(`/consultations/search-doctors${query ? `?q=${encodeURIComponent(query)}` : ''}`),

  requestConsultation: (payload: { doctorId: string; reason?: string; patientId?: string }) =>
    request<{ request: any; message: string }>('/consultations/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPatientConsultations: (patientId: string) =>
    request<{ requests: any[] }>(`/consultations/patient/${patientId}`),

  getMyDoctors: (patientId: string) =>
    request<{ doctors: any[] }>(`/consultations/patient/${patientId}/my-doctors`),

  getMyClinics: (patientId: string) =>
    request<{ clinics: any[] }>(`/consultations/patient/${patientId}/my-clinics`),

  getDoctorConsultationRequests: () =>
    request<{ requests: any[] }>('/consultations/doctor/requests'),

  respondToConsultationRequest: (id: string, response: 'ACCEPTED' | 'REJECTED', notes?: string) =>
    request<{ request: any; message: string }>(`/consultations/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response, notes }),
    }),

  // Patient
  getPatientDashboard: (patientId: string) =>
    request<any>(`/patients/${patientId}/dashboard`),

  getPatientSchedule: (patientId: string, date?: string) =>
    request<{ date: string; schedules: any[] }>(`/patients/${patientId}/schedule${date ? `?date=${date}` : ''}`),

  getCaregivers: (patientId: string) =>
    request<{ consents: any[] }>(`/patients/${patientId}/caregivers`),

  addCaregiver: (patientId: string, payload: { name: string; email: string; relationship: string; accessScope?: string }) =>
    request<{ consent: any; message: string }>(`/patients/${patientId}/caregivers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  revokeCaregiver: (patientId: string, consentId: string) =>
    request<{ consent: any; message: string }>(`/patients/${patientId}/caregivers/${consentId}`, {
      method: 'DELETE',
    }),

  getNotifications: (patientId: string) =>
    request<{ notifications: any[]; userNotifications?: any[]; systemDispatches?: any[] }>(`/patients/${patientId}/notifications`),

  markNotificationRead: (patientId: string, notifId: string) =>
    request<{ notification: any }>(`/patients/${patientId}/notifications/${notifId}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsRead: (patientId: string) =>
    request<{ updatedCount: number; message: string }>(`/patients/${patientId}/notifications/read-all`, {
      method: 'PUT',
    }),

  clearNotification: (patientId: string, notifId: string) =>
    request<{ notification?: any; message: string }>(`/patients/${patientId}/notifications/${notifId}`, {
      method: 'DELETE',
    }),

  clearAllNotifications: (patientId: string) =>
    request<{ clearedCount: number; message: string }>(`/patients/${patientId}/notifications/clear-all`, {
      method: 'DELETE',
    }),

  getPatientFollowUps: (patientId: string) =>
    request<{ followUps: any[] }>(`/patients/${patientId}/follow-ups`),

  updateFollowUpStatus: (patientId: string, id: string, status: string, notes?: string) =>
    request<{ followUp: any; message: string }>(`/patients/${patientId}/follow-ups/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  requestMedicationRefill: (patientId: string, medicationId: string) =>
    request<{ medication: any; message: string }>(`/patients/${patientId}/medications/${medicationId}/refill`, {
      method: 'POST',
    }),

  // Medications
  getMedications: (patientId: string) =>
    request<{ medications: any[] }>(`/medications/patient/${patientId}`),

  getMedicationById: (id: string) =>
    request<{ medication: any; history: any[] }>(`/medications/${id}`),

  addMedication: (payload: any) =>
    request<any>('/medications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMedicationPlan: (id: string, payload: any) =>
    request<any>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  discontinueMedication: (id: string, reason: string) =>
    request<any>(`/medications/${id}/discontinue`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Prescriptions
  getPrescriptions: (patientId: string) =>
    request<{ prescriptions: any[] }>(`/prescriptions/patient/${patientId}`),

  createPrescription: (payload: any) =>
    request<any>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  renewPrescription: (id: string, payload: { additionalDays: number; notes: string }) =>
    request<any>(`/prescriptions/${id}/renew`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Adherence
  recordTaken: (payload: { scheduleId: string; actualTakenTime?: string }) =>
    request<{ schedule: any; status: string; adherencePercentage: number; message: string }>('/adherence/taken', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  recordSkipped: (payload: { scheduleId: string; reason?: string }) =>
    request<{ schedule: any; followUp: any; adherencePercentage: number; message: string }>('/adherence/skipped', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  recordMissed: (payload: { scheduleId: string; notes?: string }) =>
    request<{ schedule: any; adherencePercentage: number; guidance: string; message: string }>('/adherence/missed', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdherenceAnalytics: (patientId: string) =>
    request<{ analytics: any }>(`/adherence/${patientId}`),

  // Doctor
  getDoctorPatients: () =>
    request<{ patients: any[] }>('/doctor/patients'),

  searchDoctorPatients: (query: string) =>
    request<{ patients: any[] }>(`/doctor/patients/search?q=${encodeURIComponent(query)}`),

  getDoctorPatientDetail: (patientId: string) =>
    request<any>(`/doctor/patients/${patientId}`),

  addFollowUp: (payload: any) =>
    request<any>('/doctor/followups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resolveFollowUp: (id: string) =>
    request<any>(`/doctor/followups/${id}/resolve`, {
      method: 'PUT',
    }),

  // Caregiver
  getCaregiverPatients: () =>
    request<{ patients: any[] }>('/caregiver/patients'),

  getCaregiverPatientOverview: (patientId: string) =>
    request<any>(`/caregiver/patients/${patientId}`),

  // Pharmacist
  getPharmacistQueue: () =>
    request<{ queue: any[] }>('/pharmacist/queue'),

  recordRefill: (payload: { medicationId: string; quantity: number; notes?: string }) =>
    request<any>('/pharmacist/refill', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addPharmacistNotes: (payload: { prescriptionId?: string; patientId: string; notes: string }) =>
    request<any>('/pharmacist/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin
  getAdminMetrics: () =>
    request<{ metrics: any }>('/admin/metrics'),

  getAdminUsers: (q?: string) =>
    request<{ users: any[] }>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getAdminAuditLogs: (q?: string) =>
    request<{ logs: any[] }>(`/admin/audit-logs${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getDrugReferences: () =>
    request<{ references: any[] }>('/admin/drug-references'),

  addDrugReference: (payload: any) =>
    request<any>('/admin/drug-references', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrganizations: () =>
    request<{ organizations: any[]; clinics: any[] }>('/admin/organizations'),

  // Diagnostic Test Orders
  getTestCatalogue: () =>
    request<{ catalogue: Array<{ testName: string; category: string; cost: number }> }>('/test-orders/catalogue'),

  createTestOrder: (payload: {
    patientId: string;
    testName: string;
    testCategory?: string;
    reason?: string;
    priority?: string;
    labId?: string;
    customCost?: number;
    notes?: string;
  }) =>
    request<{ testOrder: any; bill: any; message: string }>('/test-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPatientTestOrders: (patientId: string) =>
    request<{ testOrders: any[] }>(`/test-orders/patient/${patientId}`),

  getAllTestOrders: (params: { status?: string; labId?: string; doctorId?: string; priority?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.labId) query.set('labId', params.labId);
    if (params.doctorId) query.set('doctorId', params.doctorId);
    if (params.priority) query.set('priority', params.priority);
    const qs = query.toString();
    return request<{ testOrders: any[] }>(`/test-orders${qs ? `?${qs}` : ''}`);
  },

  getTestOrderById: (id: string) =>
    request<{ testOrder: any }>(`/test-orders/${id}`),

  collectSample: (id: string) =>
    request<{ testOrder: any; message: string }>(`/test-orders/${id}/sample`, {
      method: 'PUT',
    }),

  updateTestOrderStatus: (id: string, status: string, notes?: string) =>
    request<{ testOrder: any }>(`/test-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  // Medical Reports
  uploadMedicalReport: (payload: {
    testOrderId: string;
    resultSummary: string;
    detailedFindings: string;
    referenceRange?: string;
    status?: string;
    performedBy?: string;
    fileData?: string;
    fileName?: string;
  }) =>
    request<{ report: any; message: string }>('/reports/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPatientMedicalReports: (patientId: string) =>
    request<{ reports: any[] }>(`/reports/patient/${patientId}`),

  getMedicalReportById: (id: string) =>
    request<{ report: any }>(`/reports/${id}`),

  getAllMedicalReports: () =>
    request<{ reports: any[] }>('/reports'),

  // Itemized Billing & Payments
  getPatientBills: (patientId: string) =>
    request<{ bills: any[]; summary: { totalPending: number; totalPaid: number; count: number; pendingCount: number } }>(
      `/bills/patient/${patientId}`
    ),

  getBillById: (id: string) =>
    request<{ bill: any; payment?: any }>(`/bills/${id}`),

  payBill: (
    id: string,
    payload: {
      paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH';
      payerDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        last4?: string;
        upiId?: string;
      };
    }
  ) =>
    request<{ payment: any; bill: any; receipt: any; message: string }>(`/bills/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getBillReceipt: (id: string) =>
    request<{ receipt: any; bill: any }>(`/bills/receipt/${id}`),

  getAllBills: (status?: string) =>
    request<{ bills: any[]; analytics: any }>(`/bills${status ? `?status=${status}` : ''}`),

  // Professional Verifications (Admin)
  getAdminVerifications: (status?: string) =>
    request<{ verifications: any[] }>(`/admin/verifications${status ? `?status=${status}` : ''}`),

  updateAdminVerification: (payload: { userId: string; status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'; reason?: string }) =>
    request<{ message: string; user: any }>('/admin/verifications', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getAdminDiagnosticOrders: () =>
    request<{ orders: any[]; reports: any[] }>('/admin/diagnostic-orders'),

  getAdminBillingSummary: () =>
    request<{ bills: any[]; payments: any[]; summary: any }>('/admin/billing-summary'),

  // Demo Triggers
  triggerTestReminder: (patientId?: string, medicationId?: string) =>
    request<any>('/demo/trigger-reminder', {
      method: 'POST',
      body: JSON.stringify({ patientId, medicationId }),
    }),

  simulateMissedDose: (patientId?: string) =>
    request<any>('/demo/simulate-missed', {
      method: 'POST',
      body: JSON.stringify({ patientId }),
    }),

  simulateSafetyConflict: (patientId?: string) =>
    request<any>('/demo/simulate-conflict', {
      method: 'POST',
      body: JSON.stringify({ patientId }),
    }),

  resetDatabase: () =>
    request<any>('/demo/reset-database', {
      method: 'POST',
    }),

  // Medical Supplies & Refills
  getMedicationSupplies: (patientId: string) =>
    request<{ supplies: any[] }>(`/patients/${patientId}/supplies`),

  getPatientRefills: (patientId: string) =>
    request<{ refillRequests: any[] }>(`/patients/${patientId}/refills`),

  submitRefillRequest: (patientId: string, payload: { medicationId: string; quantityRequested?: number; notes?: string }) =>
    request<{ refillRequest: any; message: string }>(`/patients/${patientId}/refills`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAllRefills: (params?: { doctorId?: string; patientId?: string; status?: string }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]).toString() : '';
    return request<{ refills: any[] }>(`/refills${query ? `?${query}` : ''}`);
  },

  updateRefillStatus: (id: string, payload: { status: string; notes?: string }) =>
    request<{ refill: any; message: string }>(`/refills/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Subscriptions & Monetization
  getSubscriptionPlans: (customerType?: string) =>
    request<{ plans: any[] }>(`/subscriptions/plans${customerType ? `?customerType=${customerType}` : ''}`),

  createSubscriptionPlan: (payload: any) =>
    request<{ plan: any; message: string }>('/subscriptions/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSubscriptionPlan: (id: string, payload: any) =>
    request<{ plan: any; message: string }>(`/subscriptions/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getMySubscription: (patientId?: string) =>
    request<{ subscription: any; activePlan: any; isFree: boolean }>(`/subscriptions/my${patientId ? `?patientId=${patientId}` : ''}`),

  subscribeToPlan: (payload: { planId: string; patientId?: string; organizationId?: string; billingCycle?: string }) =>
    request<{ subscription: any; plan: any; message: string }>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Organization Licensing & Usage (Admin)
  getAdminLicenses: () =>
    request<{ licenses: any[] }>('/admin/licenses'),

  assignAdminLicense: (payload: any) =>
    request<{ license: any; message: string }>('/admin/licenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdminLicenseStatus: (id: string, payload: any) =>
    request<{ license: any; message: string }>(`/admin/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getAdminUsage: (organizationId?: string) =>
    request<{ usageRecords: any[] }>(`/admin/usage${organizationId ? `?organizationId=${organizationId}` : ''}`),

  recordAdminUsage: (payload: any) =>
    request<{ usageRecord: any }>('/admin/usage/record', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Receptionist Portal
  getReceptionistDashboard: () =>
    request<any>('/receptionist/dashboard'),

  getReceptionistRequests: () =>
    request<{ requests: any[] }>('/receptionist/requests'),

  respondReceptionistRequest: (id: string, response: 'ACCEPTED' | 'REJECTED', notes?: string) =>
    request<{ request: any; message: string }>(`/receptionist/requests/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response, notes }),
    }),

  getReceptionistPatients: (search?: string) =>
    request<{ patients: any[] }>(`/receptionist/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  searchGlobalPatient: (query: string) =>
    request<{ patients: any[] }>(`/receptionist/patients/search-global?q=${encodeURIComponent(query)}`),

  linkPatientToHospital: (patientId: string, notes?: string) =>
    request<{ message: string; relationship: any }>('/receptionist/patients/link', {
      method: 'POST',
      body: JSON.stringify({ patientId, notes }),
    }),

  getReceptionistPatientDetail: (patientId: string) =>
    request<any>(`/receptionist/patients/${patientId}`),

  getReceptionistReports: () =>
    request<{ reports: any[] }>('/receptionist/reports'),

  getReceptionistReportDetail: (id: string) =>
    request<{ report: any; patient: any; doctor: any }>(`/receptionist/reports/${id}`),

  getReceptionistDoctors: () =>
    request<{ doctors: any[] }>('/receptionist/doctors'),

  // Razorpay Payment Gateway & SQLite Transactions
  getRazorpayConfig: () =>
    request<{ keyId: string; mode: string }>('/payments/razorpay/config'),

  createRazorpayOrder: (payload: {
    type: 'SUBSCRIPTION' | 'FAMILY_SUBSCRIPTION' | 'BILL' | 'ORGANIZATION_LICENSE' | 'ORGANIZATION_USAGE';
    referenceId: string;
    billingCycle?: string;
    organizationId?: string;
    organizationName?: string;
    usageAmount?: number;
  }) =>
    request<{ orderId: string; amount: number; amountInRupees: number; currency: string; keyId: string }>('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyRazorpayPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    type: 'SUBSCRIPTION' | 'FAMILY_SUBSCRIPTION' | 'BILL' | 'ORGANIZATION_LICENSE' | 'ORGANIZATION_USAGE';
    referenceId: string;
    billingCycle?: string;
    organizationId?: string;
    organizationName?: string;
  }) =>
    request<{ message: string; data: any }>('/payments/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSubscriptionPaymentHistory: (patientId?: string) =>
    request<{ payments: any[] }>(`/payments/history/subscriptions${patientId ? `?patientId=${patientId}` : ''}`),

  getBillPaymentHistory: (patientId?: string) =>
    request<{ payments: any[] }>(`/payments/history/bills${patientId ? `?patientId=${patientId}` : ''}`),

  getOrganizationPaymentHistory: (organizationId?: string) =>
    request<{ payments: any[] }>(`/payments/history/organization${organizationId ? `?organizationId=${organizationId}` : ''}`),

  getFamilyMembers: (patientId?: string) =>
    request<{ members: any[] }>(`/payments/family-members${patientId ? `?patientId=${patientId}` : ''}`),

  addFamilyMember: (payload: { name: string; relationship: string; phone?: string; email?: string }) =>
    request<{ message: string; data: { member: any } }>('/payments/family-members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
