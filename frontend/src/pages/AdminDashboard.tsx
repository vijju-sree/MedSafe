import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Users,
  ShieldCheck,
  Building,
  BookOpen,
  Activity,
  Search,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  DollarSign,
  KeyRound,
  Sparkles,
  Edit,
  BarChart3,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SubscriptionPlan, OrganizationLicense, UsageRecord } from '../types';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [drugReferences, setDrugReferences] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [diagnosticOrders, setDiagnosticOrders] = useState<any[]>([]);
  const [diagnosticReports, setDiagnosticReports] = useState<any[]>([]);
  const [billingData, setBillingData] = useState<any>({ bills: [], payments: [], summary: {} });
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [licenses, setLicenses] = useState<OrganizationLicense[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);

  const [activeTab, setActiveTab] = useState<
    'metrics' | 'verifications' | 'diagnostics' | 'billing' | 'plans' | 'licenses' | 'usage' | 'users' | 'audit' | 'drugs' | 'orgs'
  >('metrics');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [assignLicenseModalOpen, setAssignLicenseModalOpen] = useState<boolean>(false);
  const [recordUsageModalOpen, setRecordUsageModalOpen] = useState<boolean>(false);
  const [licenseFilter, setLicenseFilter] = useState<string>('ALL');

  const [newLicenseForm, setNewLicenseForm] = useState({
    organizationId: 'org-1',
    tier: 'CLINIC_STANDARD',
    daysValid: 365,
    maxDoctors: 10,
    maxPatients: 500,
    features: ['PATIENT_PORTAL', 'E_PRESCRIBING', 'TELECONSULTATION']
  });

  const [newUsageForm, setNewUsageForm] = useState({
    organizationId: 'org-1',
    metric: 'prescriptionsGenerated',
    incrementBy: 10
  });
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState<string>('');


  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const fetchAllData = async () => {
    try {
      const [mRes, uRes, aRes, dRes, oRes, vRes, diagRes, billRes, plansRes, licRes, usageRes] = await Promise.all([
        api.getAdminMetrics().catch(() => ({ metrics: null })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getAdminAuditLogs(searchLog).catch(() => ({ logs: [] })),
        api.getDrugReferences().catch(() => ({ references: [] })),
        api.getOrganizations().catch(() => ({ organizations: [], clinics: [] })),
        api.getAdminVerifications().catch(() => ({ verifications: [] })),
        api.getAdminDiagnosticOrders().catch(() => ({ orders: [], reports: [] })),
        api.getAdminBillingSummary().catch(() => ({ bills: [], payments: [], summary: {} })),
        api.getSubscriptionPlans().catch(() => ({ plans: [] })),
        api.getAdminLicenses().catch(() => ({ licenses: [] })),
        api.getAdminUsage().catch(() => ({ usageRecords: [] }))
      ]);

      setMetrics(mRes.metrics);
      setUsers(uRes.users);
      setAuditLogs(aRes.logs);
      setDrugReferences(dRes.references);
      setOrganizations(oRes.organizations);
      setClinics(oRes.clinics);
      setVerifications(vRes.verifications);
      setDiagnosticOrders(diagRes.orders || []);
      setDiagnosticReports(diagRes.reports || []);
      setBillingData(billRes);
      setSubscriptionPlans(plansRes.plans || []);
      setLicenses(licRes.licenses || []);
      setUsageRecords(usageRes.usageRecords || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [searchLog]);

  const handleUpdateVerification = async (userId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    try {
      await api.updateAdminVerification({ userId, status, reason });
      showToast(`Verification status updated to ${status}`);
      const vRes = await api.getAdminVerifications();
      setVerifications(vRes.verifications);
      const uRes = await api.getAdminUsers();
      setUsers(uRes.users);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await api.updateSubscriptionPlan(editingPlan.id, {
        name: editingPlan.name,
        description: editingPlan.description,
        priceMonthly: Number(editingPlan.priceMonthly),
        priceYearly: Number(editingPlan.priceYearly),
        maxPatients: Number(editingPlan.maxPatients) || 0,
        maxDoctors: Number(editingPlan.maxDoctors) || 0,
        isActive: editingPlan.isActive
      });
      showToast(`Subscription plan '${editingPlan.name}' updated successfully in database.`);
      setEditingPlan(null);
      const pRes = await api.getSubscriptionPlans();
      setSubscriptionPlans(pRes.plans || []);
    } catch (err: any) {
      showToast(`Error updating plan: ${err.message}`);
    }
  };

  const handleUpdateLicenseStatus = async (licenseId: string, status: any) => {
    try {
      await api.updateAdminLicenseStatus(licenseId, { status });
      showToast(`Organization license status set to ${status}`);
      const lRes = await api.getAdminLicenses();
      setLicenses(lRes.licenses || []);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleAssignLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignAdminLicense({
        organizationId: newLicenseForm.organizationId,
        tier: newLicenseForm.tier,
        daysValid: Number(newLicenseForm.daysValid),
        maxDoctors: Number(newLicenseForm.maxDoctors),
        maxPatients: Number(newLicenseForm.maxPatients),
        features: newLicenseForm.features
      });
      showToast('New organization license issued successfully!');
      setAssignLicenseModalOpen(false);
      const lRes = await api.getAdminLicenses();
      setLicenses(lRes.licenses || []);
    } catch (err: any) {
      showToast(`Error assigning license: ${err.message}`);
    }
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordAdminUsage({
        organizationId: newUsageForm.organizationId,
        metric: newUsageForm.metric,
        incrementBy: Number(newUsageForm.incrementBy)
      });
      showToast(`Metered + ${newUsageForm.incrementBy} ${newUsageForm.metric} consumption event recorded.`);
      setRecordUsageModalOpen(false);
      const uRes = await api.getAdminUsage();
      setUsageRecords(uRes.usageRecords || []);
    } catch (err: any) {
      showToast(`Error recording usage: ${err.message}`);
    }
  };


  const filteredVerifications = verifications.filter((v) => {
    if (verificationFilter === 'ALL') return true;
    return v.verificationStatus === verificationFilter;
  });

  const pendingCount = verifications.filter((v) => v.verificationStatus === 'PENDING').length;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">System Administration & Coordination Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global healthcare metrics, professional credentials verification, diagnostic pipelines, and billing oversight
          </p>
        </div>

        {/* Tab Navigator */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'metrics', label: 'Metrics', icon: Activity },
            { id: 'verifications', label: `Verifications${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: ShieldCheck },
            { id: 'diagnostics', label: 'Diagnostic Orders', icon: FileText },
            { id: 'billing', label: 'Billing Oversight', icon: CreditCard },
            { id: 'plans', label: 'Subscription Plans', icon: DollarSign },
            { id: 'licenses', label: 'Org Licenses', icon: KeyRound },
            { id: 'usage', label: 'Usage Billing', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'audit', label: 'Audit Logs', icon: FileSpreadsheet },
            { id: 'drugs', label: 'Safety References', icon: BookOpen },
            { id: 'orgs', label: 'Organizations', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold rounded-2xl flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-purple-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Tab 1: System Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Patients</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{metrics?.totalPatients || 0}</div>
              <div className="text-[11px] text-sky-600 mt-1 font-medium">Enrolled & Active</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Registered Doctors</div>
              <div className="text-3xl font-black text-indigo-600 mt-1">{metrics?.totalDoctors || 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Licensed Clinicians</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Authorized Caregivers</div>
              <div className="text-3xl font-black text-teal-600 mt-1">{metrics?.totalCaregivers || 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Active Consent Links</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">System Adherence Avg</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">{metrics?.overallAdherence || 85}%</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">High Adherence Index</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Active Medications</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics?.activeMedications || 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Under current treatment</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Active Prescriptions</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{metrics?.activePrescriptions || 0}</div>
              <div className="text-[11px] text-amber-600 mt-1">{metrics?.expiringPrescriptions || 0} Expiring Soon</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Diagnostic Tests Prescribed</div>
              <div className="text-2xl font-black text-cyan-600 mt-1">{diagnosticOrders.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">{diagnosticReports.length} Reports Generated</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Billed Volume</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">₹{billingData?.summary?.totalAmount || 0}</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">₹{billingData?.summary?.totalPaid || 0} Settled</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Professional & Organization Verifications */}
      {activeTab === 'verifications' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Healthcare Professional & Organization Verification Queue</h2>
              <p className="text-xs text-slate-500">
                Verify medical licenses, council registration IDs, and clinical accreditations before granting prescribing/lab capabilities
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setVerificationFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    verificationFilter === st
                      ? 'bg-white text-purple-700 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">User / Professional</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">License / Council ID</th>
                  <th className="p-3">Email & Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                      No verification entries match the filter '{verificationFilter}'.
                    </td>
                  </tr>
                ) : (
                  filteredVerifications.map((item) => {
                    const isPending = item.verificationStatus === 'PENDING';
                    const isVerified = item.verificationStatus === 'VERIFIED';
                    const isRejected = item.verificationStatus === 'REJECTED';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">ID: {item.id}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {item.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-700">
                          {item.licenseNumber || 'MCI-REG-PROVISIONAL'}
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-slate-600">{item.email}</div>
                          <div className="text-[11px] text-slate-400">{item.phone || 'No phone'}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.verificationStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleUpdateVerification(item.id, 'VERIFIED')}
                                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Verify</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateVerification(item.id, 'REJECTED', 'Credentials could not be verified with council registry')}
                                  className="flex items-center space-x-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all border border-rose-200"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            {isVerified && (
                              <button
                                onClick={() => handleUpdateVerification(item.id, 'REJECTED', 'Suspended by admin')}
                                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                            {isRejected && (
                              <button
                                onClick={() => handleUpdateVerification(item.id, 'VERIFIED')}
                                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                              >
                                Re-instate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Diagnostic Test Orders Oversight */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Diagnostic Orders & Investigation Pipeline</h2>
              <p className="text-xs text-slate-500">Cross-institutional monitoring of lab orders, specimen collection, and issued reports</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {diagnosticOrders.length} Total Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Test Name & Category</th>
                  <th className="p-3">Prescribing Doctor</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diagnosticOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-900">{ord.id}</td>
                    <td className="p-3 font-mono text-slate-700">{ord.patientId}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{ord.testName}</div>
                      <div className="text-[10px] text-slate-400">{ord.category || 'Diagnostic'}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{ord.doctorId || 'DOC10001'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          ord.priority === 'STAT'
                            ? 'bg-rose-100 text-rose-800'
                            : ord.priority === 'URGENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.priority || 'ROUTINE'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'IN_PROGRESS'
                            ? 'bg-indigo-100 text-indigo-800'
                            : ord.status === 'SAMPLE_COLLECTED'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-black text-slate-900">₹{ord.cost || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Itemized Billing Oversight */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Gross Billed Revenue</div>
              <div className="text-3xl font-black text-slate-900 mt-1">₹{billingData?.summary?.totalAmount || 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">{billingData?.bills?.length || 0} itemized bills</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Settled</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">₹{billingData?.summary?.totalPaid || 0}</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">{billingData?.summary?.paidCount || 0} bills cleared</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Outstanding Balance</div>
              <div className="text-3xl font-black text-amber-600 mt-1">₹{billingData?.summary?.totalPending || 0}</div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">{billingData?.summary?.pendingCount || 0} pending payment</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Receipts Issued</div>
              <div className="text-3xl font-black text-indigo-600 mt-1">{billingData?.payments?.length || 0}</div>
              <div className="text-[11px] text-indigo-700 mt-1 font-medium">Digital payment receipts</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Itemized Patient Bills & Settlement Status</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Bill ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Items / Services</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(billingData?.bills || []).map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="p-3 font-mono text-slate-700">{b.patientId}</td>
                      <td className="p-3">
                        <div className="text-slate-800 font-medium">
                          {b.items?.map((item: any) => item.description).join(', ') || 'Medical service'}
                        </div>
                        <div className="text-[10px] text-slate-400">{b.items?.length || 1} line item(s)</div>
                      </td>
                      <td className="p-3 font-black text-slate-900">₹{b.totalAmount}</td>
                      <td className="p-3 text-slate-500">{new Date(b.dueDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {b.paymentReference ? (
                          <span className="text-emerald-700 font-semibold">{b.paymentReference}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subscription Plans Management */}
      {activeTab === 'plans' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-black text-slate-900">Database Subscription Plans & Pricing</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized subscription plans stored in database. Frontends read these dynamically; zero hardcoded prices.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPlan({
                  id: `plan-${Date.now()}`,
                  name: 'New Custom Tier',
                  description: 'Configured healthcare tier',
                  tier: 'CLINIC_STANDARD',
                  customerType: 'PATIENT',
                  priceMonthly: 199,
                  priceYearly: 1999,
                  features: ['Medication Tracking', 'Smart Reminders', 'Adherence Export'],
                  maxPatients: 1,
                  maxDoctors: 3,
                  isActive: true,
                  createdAt: new Date().toISOString()
                } as any);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Configure New Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subscriptionPlans.map((plan) => {
              const isPatient = plan.customerType === 'PATIENT';
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between shadow-xs relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPatient ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {plan.customerType} • {plan.tier}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-slate-900">₹{plan.priceMonthly}</span>
                        <span className="text-xs text-slate-400 font-semibold">/ month</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        ₹{plan.priceYearly} billed annually
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Entitlements:</div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Max Patients:</span>
                        <span className="font-bold text-slate-800">{plan.maxPatients || 'Unlimited'}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Max Doctors:</span>
                        <span className="font-bold text-slate-800">{plan.maxDoctors || 'Unlimited'}</span>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1.5">Included Features:</div>
                      <ul className="space-y-1">
                        {plan.features?.map((f, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Pricing & Quotas</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Organization Licensing */}
      {activeTab === 'licenses' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-black text-slate-900">Multi-Tenant Organization Licensing</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue and manage commercial operational licenses for Clinics, Hospitals, Labs, and Pharmacies.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLicenseFilter(st)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      licenseFilter === st
                        ? 'bg-white text-purple-700 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setAssignLicenseModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Issue License</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Governance Boundary Note:</strong> Platform administrators control institutional operational licensing, multi-tenant billing, and API quotas only. Administrators have zero access to clinical prescribing or medical records.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Organization</th>
                  <th className="p-3">License Key</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Validity Window</th>
                  <th className="p-3">Quotas</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {licenses
                  .filter((l) => licenseFilter === 'ALL' || l.status === licenseFilter)
                  .map((lic) => {
                    const isAct = lic.status === 'ACTIVE';
                    const isExpiring = lic.status === 'EXPIRING_SOON';
                    const isExpired = lic.status === 'EXPIRED';
                    const isSuspended = lic.status === 'SUSPENDED';

                    return (
                      <tr key={lic.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{lic.organizationName}</div>
                          <div className="text-[11px] font-mono text-slate-400">ID: {lic.organizationId}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {lic.licenseKey}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                            {lic.tier}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>Issued: {new Date(lic.issuedAt || lic.licenseStartDate || Date.now()).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-400">Expires: {new Date(lic.expiresAt || lic.licenseEndDate || Date.now()).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>Docs: <strong>{lic.maxDoctors || 'Unlimited'}</strong></div>
                          <div>Patients: <strong>{lic.maxPatients || 'Unlimited'}</strong></div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isAct
                                ? 'bg-emerald-100 text-emerald-800'
                                : isExpiring
                                ? 'bg-amber-100 text-amber-800'
                                : isSuspended
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {lic.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {lic.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleUpdateLicenseStatus(lic.id, 'ACTIVE')}
                                className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 text-[11px]"
                              >
                                Activate
                              </button>
                            )}
                            {lic.status !== 'EXPIRING_SOON' && (
                              <button
                                onClick={() => handleUpdateLicenseStatus(lic.id, 'EXPIRING_SOON')}
                                className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 text-[11px]"
                              >
                                Flag Expiring
                              </button>
                            )}
                            {lic.status !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleUpdateLicenseStatus(lic.id, 'SUSPENDED')}
                                className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 text-[11px]"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Usage-Based Billing Oversight */}
      {activeTab === 'usage' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-black text-slate-900">Institutional Metered Usage & Overage Billing</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track live clinical and operational volume across authorized facilities with dynamic billable tier overages.
              </p>
            </div>

            <button
              onClick={() => setRecordUsageModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Simulate / Record Consumption</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Metered Institutions</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{usageRecords.length}</div>
              <span className="text-[11px] text-purple-600 font-medium">Billing Period: Active Month</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Prescriptions Metered</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {usageRecords.reduce((sum, r) => sum + (r.prescriptionsGenerated || 0), 0)}
              </div>
              <span className="text-[11px] text-slate-400">Electronic orders logged</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Diagnostic Assays Metered</span>
              <div className="text-2xl font-black text-cyan-600 mt-1">
                {usageRecords.reduce((sum, r) => sum + (r.testOrdersCreated || 0), 0)}
              </div>
              <span className="text-[11px] text-slate-400">Lab & investigation dispatches</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Accumulated Overages</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ₹{usageRecords.reduce((sum, r) => sum + (r.totalOverageFee || 0), 0)}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Auto-calculated surplus</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Patients Metered</th>
                  <th className="p-3">Prescriptions</th>
                  <th className="p-3">Tests & Reports</th>
                  <th className="p-3">SMS / Alerts</th>
                  <th className="p-3">Overage Fee</th>
                  <th className="p-3 text-right">Invoice Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usageRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">
                      {organizations.find((o) => o.id === rec.organizationId)?.name || rec.organizationId}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{rec.periodMonth}</td>
                    <td className="p-3 text-slate-800">
                      <strong>{rec.activePatientsCount}</strong> / {rec.allowedPatientsQuota || 'Unlimited'}
                    </td>
                    <td className="p-3 text-indigo-700 font-bold">{rec.prescriptionsGenerated}</td>
                    <td className="p-3 text-slate-600">
                      {rec.testOrdersCreated} tests / {rec.reportsUploaded} reports
                    </td>
                    <td className="p-3 text-slate-500">{rec.notificationsSent}</td>
                    <td className="p-3 font-black text-emerald-700">
                      {rec.totalOverageFee ? `₹${rec.totalOverageFee}` : '₹0'}
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        INVOICED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">User Access Management</h2>
            <span className="text-xs text-slate-500 font-medium">{users.length} Registered Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3 font-mono text-slate-700">
                      {u.patientId || u.doctorId || u.caregiverId || u.pharmacistId || u.labId || '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.verificationStatus || 'VERIFIED'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinical & System Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable ledger of sensitive operations and status changes</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{log.userName}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-purple-700 font-bold">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.resource}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Drug Reference Catalog */}
      {activeTab === 'drugs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Medication Reference & Drug Conflict Rules</h2>
              <p className="text-xs text-slate-500">Configured safety tables used by rule-based conflict detector (Read-Only)</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              Read-Only Clinical Reference
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Clinical Governance Policy:</strong> Medications and prescriptions are prescribed exclusively through licensed Doctor workflows. Platform administrators cannot add medicines or alter clinical plans.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drugReferences.map((drug) => (
              <div key={drug.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{drug.drugName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {drug.category}
                  </span>
                </div>
                <div className="text-slate-600">Generic: <strong>{drug.genericName}</strong></div>
                <div className="text-slate-600">Dosage Range: {drug.standardDosageRange}</div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-800">
                  <strong>Known Conflicts: </strong>
                  <span>{drug.conflictingDrugs?.join(', ') || 'None specified'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Organizations & Clinics */}
      {activeTab === 'orgs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Healthcare Organizations & Connected Clinics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{org.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                    {org.type}
                  </span>
                </div>
                <div className="text-slate-500">{org.address}</div>
                <div className="text-slate-500 font-mono">{org.phone}</div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-bold text-slate-800 pt-4">Registered Clinical Units:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinics.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{c.name}</div>
                <div className="text-slate-500">{c.location} • Phone: {c.phone}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal: Edit Subscription Plan */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Configure Subscription Plan</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Display Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.priceMonthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.priceYearly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Patients (0 = Unlimited)</label>
                  <input
                    type="number"
                    value={editingPlan.maxPatients || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxPatients: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Doctors (0 = Unlimited)</label>
                  <input
                    type="number"
                    value={editingPlan.maxDoctors || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxDoctors: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingPlan.isActive}
                  onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-800">
                  Plan is currently active & purchasable by customers
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Plan to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign License */}
      {assignLicenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Issue Organization License</h3>
              <button onClick={() => setAssignLicenseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignLicense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Healthcare Organization</label>
                <select
                  value={newLicenseForm.organizationId}
                  onChange={(e) => setNewLicenseForm({ ...newLicenseForm, organizationId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Licensing Tier</label>
                <select
                  value={newLicenseForm.tier}
                  onChange={(e) => setNewLicenseForm({ ...newLicenseForm, tier: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="CLINIC_STANDARD">CLINIC_STANDARD</option>
                  <option value="CLINIC_PREMIUM">CLINIC_PREMIUM</option>
                  <option value="HOSPITAL_ENTERPRISE">HOSPITAL_ENTERPRISE</option>
                  <option value="LAB_ENTERPRISE">LAB_ENTERPRISE</option>
                  <option value="PHARMACY_NETWORK">PHARMACY_NETWORK</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={newLicenseForm.daysValid}
                    onChange={(e) => setNewLicenseForm({ ...newLicenseForm, daysValid: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Clinicians</label>
                  <input
                    type="number"
                    value={newLicenseForm.maxDoctors}
                    onChange={(e) => setNewLicenseForm({ ...newLicenseForm, maxDoctors: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Enrolled Patients</label>
                <input
                  type="number"
                  value={newLicenseForm.maxPatients}
                  onChange={(e) => setNewLicenseForm({ ...newLicenseForm, maxPatients: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignLicenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Generate & Activate License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Usage Consumption */}
      {recordUsageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Record Metered Usage Consumption</h3>
              <button onClick={() => setRecordUsageModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordUsage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Organization</label>
                <select
                  value={newUsageForm.organizationId}
                  onChange={(e) => setNewUsageForm({ ...newUsageForm, organizationId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Billable Metering Metric</label>
                <select
                  value={newUsageForm.metric}
                  onChange={(e) => setNewUsageForm({ ...newUsageForm, metric: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="prescriptionsGenerated">Prescriptions Generated</option>
                  <option value="testOrdersCreated">Test Orders Dispatched</option>
                  <option value="reportsUploaded">Diagnostic Reports Uploaded</option>
                  <option value="notificationsSent">Automated Notifications / SMS</option>
                  <option value="activePatientsCount">Active Patient Volume</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Increment Count</label>
                <input
                  type="number"
                  min="1"
                  value={newUsageForm.incrementBy}
                  onChange={(e) => setNewUsageForm({ ...newUsageForm, incrementBy: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordUsageModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Post Usage Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
