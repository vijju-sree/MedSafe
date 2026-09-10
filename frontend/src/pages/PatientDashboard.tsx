import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  MedicationSchedule,
  TimeOfDay,
  SafetyAlert,
  FollowUpAction,
  Prescription,
  Consent,
  PatientSidebarTab,
  DoctorDiscoveryItem,
  TestOrder,
  MedicalReport,
  Bill,
  Payment,
  NotificationItem,
  MedicationSupply,
  RefillRequest,
  SubscriptionPlan,
  Subscription,
  SubscriptionPayment,
  BillPayment,
  FamilyMember,
  RazorpayOrder
} from '../types';
import { PatientSidebar } from '../components/PatientSidebar';
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';
import {
  Users,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  UserCheck,
  Building2,
  ShieldAlert,
  UserPlus,
  Trash2,
  FileText,
  Bell,
  CheckCheck,
  Radio,
  Layers,
  Activity,
  Search,
  PlusCircle,
  Stethoscope,
  KeyRound,
  User,
  HeartHandshake,
  BellRing,
  RefreshCw,
  Info,
  FlaskConical,
  FileCheck,
  Receipt,
  CreditCard,
  Download,
  Eye,
  History,
  Sparkles,
  Shield,
  TrendingUp,
  Printer
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PatientDashboardProps {
  patientId: string;
  onOpenReminderModal: (schedule: MedicationSchedule) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ patientId, onOpenReminderModal }) => {
  const [activeTab, setActiveTab] = useState<PatientSidebarTab>('dashboard');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // My Doctors & Discovery state
  const [myDoctors, setMyDoctors] = useState<any[]>([]);
  const [myClinics, setMyClinics] = useState<any[]>([]);
  const [showDoctorDiscovery, setShowDoctorDiscovery] = useState<boolean>(false);
  const [discoveryQuery, setDiscoveryQuery] = useState<string>('');
  const [discoveredDoctors, setDiscoveredDoctors] = useState<DoctorDiscoveryItem[]>([]);
  const [consultationReason, setConsultationReason] = useState<string>('General health review and routine medication plan');
  const [selectedDoctorForRequest, setSelectedDoctorForRequest] = useState<DoctorDiscoveryItem | null>(null);
  const [myConsultationRequests, setMyConsultationRequests] = useState<any[]>([]);

  // Diagnostics & Billing state
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billingSummary, setBillingSummary] = useState<any>({ totalPending: 0, totalPaid: 0 });
  const [selectedReportForView, setSelectedReportForView] = useState<MedicalReport | null>(null);

  // Sandbox Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'CASH'>('UPI');
  const [payerUpi, setPayerUpi] = useState('anjali@okaxis');
  const [paying, setPaying] = useState(false);
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<any | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Caregiver form state
  const [newCaregiverEmail, setNewCaregiverEmail] = useState<string>('');
  const [newCaregiverName, setNewCaregiverName] = useState<string>('');
  const [newCaregiverRel, setNewCaregiverRel] = useState<string>('Family Member');
  const [showAddCaregiver, setShowAddCaregiver] = useState<boolean>(false);

  // Notifications state
  const [patientNotifications, setPatientNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState<boolean>(false);

  // Follow-Up & History filter state
  const [patientFollowUps, setPatientFollowUps] = useState<FollowUpAction[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');

  // Prescriptions & Medications state
  const [patientMedications, setPatientMedications] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [patientSupplies, setPatientSupplies] = useState<MedicationSupply[]>([]);
  const [patientRefills, setPatientRefills] = useState<RefillRequest[]>([]);
  const [mySubscription, setMySubscription] = useState<any | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

  // Refill Modal state
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [selectedMedForRefill, setSelectedMedForRefill] = useState<any | null>(null);
  const [refillQty, setRefillQty] = useState(30);
  const [refillNotes, setRefillNotes] = useState('');
  const [submittingRefill, setSubmittingRefill] = useState(false);

  // Prescription View Modal state
  const [selectedPrescriptionForModal, setSelectedPrescriptionForModal] = useState<any | null>(null);

  // Subscription Upgrade Modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Razorpay Checkout Modal state
  const [razorpayModalOpen, setRazorpayModalOpen] = useState<boolean>(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);
  const [razorpayPaymentType, setRazorpayPaymentType] = useState<'SUBSCRIPTION' | 'BILL'>('SUBSCRIPTION');
  const [razorpayReferenceId, setRazorpayReferenceId] = useState<string>('');
  const [razorpayItemDescription, setRazorpayItemDescription] = useState<string>('');
  const [razorpayBillingCycle, setRazorpayBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [subscriptionBillingCycle, setSubscriptionBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Family Members state (for Family Plus subscription)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState<boolean>(false);
  const [newFamilyMember, setNewFamilyMember] = useState({
    name: '',
    relationship: 'Spouse',
    phone: '',
    email: ''
  });
  const [addingFamilyMember, setAddingFamilyMember] = useState<boolean>(false);

  // Payment Histories
  const [subscriptionPaymentHistory, setSubscriptionPaymentHistory] = useState<SubscriptionPayment[]>([]);
  const [billPaymentHistory, setBillPaymentHistory] = useState<BillPayment[]>([]);
  const [upgradingPlan, setUpgradingPlan] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [dashRes, docRes, clinRes, reqRes, ordersRes, reportsRes, billsRes, notifsRes, followUpsRes, medsRes, prescRes, suppliesRes, refillsRes, subRes, plansRes, subHistRes, billHistRes, famRes] = await Promise.all([
        api.getPatientDashboard(patientId),
        api.getMyDoctors(patientId).catch(() => ({ doctors: [] })),
        api.getMyClinics(patientId).catch(() => ({ clinics: [] })),
        api.getPatientConsultations(patientId).catch(() => ({ requests: [] })),
        api.getPatientTestOrders(patientId).catch(() => ({ testOrders: [] })),
        api.getPatientMedicalReports(patientId).catch(() => ({ reports: [] })),
        api.getPatientBills(patientId).catch(() => ({ bills: [], summary: { totalPending: 0, totalPaid: 0, count: 0, pendingCount: 0 } })),
        api.getNotifications(patientId).catch(() => ({ notifications: [] })),
        api.getPatientFollowUps(patientId).catch(() => ({ followUps: [] })),
        api.getMedications(patientId).catch(() => ({ medications: [] })),
        api.getPrescriptions(patientId).catch(() => ({ prescriptions: [] })),
        api.getMedicationSupplies(patientId).catch(() => ({ supplies: [] })),
        api.getPatientRefills(patientId).catch(() => ({ refillRequests: [] })),
        api.getMySubscription(patientId).catch(() => ({ subscription: null, activePlan: null })),
        api.getSubscriptionPlans('PATIENT').catch(() => ({ plans: [] })),
        api.getSubscriptionPaymentHistory(patientId).catch(() => ({ payments: [] })),
        api.getBillPaymentHistory(patientId).catch(() => ({ payments: [] })),
        api.getFamilyMembers(patientId).catch(() => ({ members: [] }))
      ]);
      setData(dashRes);
      setMyDoctors(docRes.doctors || []);
      setMyClinics(clinRes.clinics || []);
      setMyConsultationRequests(reqRes.requests || []);
      setTestOrders(ordersRes.testOrders || []);
      setMedicalReports(reportsRes.reports || []);
      setBills(billsRes.bills || []);
      if (billsRes.summary) setBillingSummary(billsRes.summary);
      setPatientNotifications(notifsRes.notifications || []);
      setPatientFollowUps(followUpsRes.followUps || []);
      setPatientMedications(medsRes.medications || dashRes.medications || []);
      setPatientPrescriptions(prescRes.prescriptions || dashRes.prescriptions || []);
      setPatientSupplies(suppliesRes.supplies || []);
      setPatientRefills(refillsRes.refillRequests || []);
      setMySubscription(subRes);
      setSubscriptionPlans(plansRes.plans || []);
      setSubscriptionPaymentHistory(subHistRes?.payments || []);
      setBillPaymentHistory(billHistRes?.payments || []);
      setFamilyMembers((famRes as any)?.members || []);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.markNotificationRead(patientId, id);
      setPatientNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readStatus: true, isRead: true } : n)
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    setNotifLoading(true);
    try {
      await api.markAllNotificationsRead(patientId);
      setPatientNotifications(prev =>
        prev.map(n => ({ ...n, readStatus: true, isRead: true }))
      );
      setFeedback('All active notifications marked as read.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleClearNotif = async (id: string) => {
    try {
      await api.clearNotification(patientId, id);
      setPatientNotifications(prev => prev.filter(n => n.id !== id));
      setFeedback('Notification cleared from active list.');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleClearAllNotifs = async () => {
    if (!confirm('Clear all active notifications?')) return;
    setNotifLoading(true);
    try {
      await api.clearAllNotifications(patientId);
      setPatientNotifications([]);
      setFeedback('All notifications cleared.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  const handleTaken = async (scheduleId: string) => {
    setActionLoading(scheduleId);
    try {
      const res = await api.recordTaken({ scheduleId });
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 3000);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error marking dose: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMissed = async (scheduleId: string) => {
    setActionLoading(scheduleId);
    try {
      await api.recordMissed({ scheduleId });
      setFeedback('Dose recorded as Missed.');
      setTimeout(() => setFeedback(null), 3000);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error marking missed dose: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (scheduleId: string, reason?: string) => {
    setActionLoading(scheduleId);
    try {
      await api.recordSkipped({
        scheduleId,
        reason: reason || 'Skipped by patient from portal.'
      });
      setFeedback('Dose marked as Skipped. Follow-up action recorded for clinical review.');
      setTimeout(() => setFeedback(null), 3500);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error recording skipped dose: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFollowUp = async (id: string, status: string) => {
    try {
      await api.updateFollowUpStatus(patientId, id, status);
      setFeedback(`Follow-up marked as ${status.toLowerCase().replace('_', ' ')}.`);
      setTimeout(() => setFeedback(null), 3000);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error updating follow-up: ${err.message}`);
    }
  };

  const handleOpenRefillModal = (med: any) => {
    setSelectedMedForRefill(med);
    const supp = supplies.find(s => s.medicationId === med.id);
    setRefillQty(supp?.initialQuantity || med.totalQuantity || 30);
    setRefillNotes('Regular scheduled refill request.');
    setRefillModalOpen(true);
  };

  const handleConfirmRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForRefill) return;
    setSubmittingRefill(true);
    try {
      const res = await api.submitRefillRequest(patientId, {
        medicationId: selectedMedForRefill.id,
        quantityRequested: refillQty,
        notes: refillNotes
      });
      setFeedback(res.message || 'Refill request submitted successfully.');
      setTimeout(() => setFeedback(null), 4000);
      setRefillModalOpen(false);
      setSelectedMedForRefill(null);
      await fetchDashboard();
    } catch (err: any) {
      alert('Error requesting refill: ' + err.message);
    } finally {
      setSubmittingRefill(false);
    }
  };

  const handleInitiateSubscriptionPayment = async (plan: SubscriptionPlan, cycle: 'MONTHLY' | 'YEARLY') => {
    try {
      setActionLoading(`sub-${plan.planId}`);
      const order = await api.createRazorpayOrder({
        type: 'SUBSCRIPTION',
        referenceId: plan.planId,
        billingCycle: cycle
      });
      setRazorpayOrder(order);
      setRazorpayPaymentType('SUBSCRIPTION');
      setRazorpayReferenceId(plan.planId);
      setRazorpayItemDescription(`${plan.planName} (${cycle})`);
      setRazorpayBillingCycle(cycle);
      setRazorpayModalOpen(true);
    } catch (err: any) {
      alert(`Razorpay order creation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInitiateBillPayment = async (bill: Bill) => {
    try {
      setActionLoading(`bill-${bill.billId || bill.id}`);
      const order = await api.createRazorpayOrder({
        type: 'BILL',
        referenceId: bill.billId || bill.id
      });
      setRazorpayOrder(order);
      setRazorpayPaymentType('BILL');
      setRazorpayReferenceId(bill.billId || bill.id);
      setRazorpayItemDescription(bill.items?.[0]?.description || (bill as any).testName || 'Diagnostic & Medical Investigation');
      setRazorpayModalOpen(true);
    } catch (err: any) {
      alert(`Razorpay order creation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRazorpaySuccess = async (paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    setRazorpayModalOpen(false);
    setFeedback(`Payment verified and recorded successfully! Razorpay Ref: ${paymentData.razorpay_payment_id}`);
    setTimeout(() => setFeedback(null), 5000);
    await fetchDashboard();
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyMember.name.trim()) return;
    setAddingFamilyMember(true);
    try {
      await api.addFamilyMember(newFamilyMember);
      setFeedback(`Family member ${newFamilyMember.name} successfully enrolled with full benefits!`);
      setShowAddFamilyModal(false);
      setNewFamilyMember({ name: '', relationship: 'Spouse', phone: '', email: '' });
      setTimeout(() => setFeedback(null), 4000);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Failed to enroll family member: ${err.message}`);
    } finally {
      setAddingFamilyMember(false);
    }
  };

  const handleUpgradeSubscription = async (planId: string) => {
    setUpgradingPlan(true);
    try {
      const res = await api.subscribeToPlan({
        planId,
        patientId,
        billingCycle: 'MONTHLY'
      });
      setFeedback(res.message || 'Subscription upgraded successfully!');
      setTimeout(() => setFeedback(null), 4000);
      setPlanModalOpen(false);
      await fetchDashboard();
    } catch (err: any) {
      alert('Error upgrading subscription: ' + err.message);
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handleRequestRefill = async (medicationId: string, medName: string) => {
    try {
      await api.requestMedicationRefill(patientId, medicationId);
      setFeedback(`Refill requested for ${medName}. Follow-up tracked.`);
      setTimeout(() => setFeedback(null), 3500);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error requesting refill: ${err.message}`);
    }
  };

  const handleSearchDiscovery = async (q: string = '') => {
    try {
      const res = await api.searchDoctors(q);
      setDiscoveredDoctors(res.doctors);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDiscovery = () => {
    setShowDoctorDiscovery(true);
    handleSearchDiscovery(discoveryQuery);
  };

  const handleSubmitConsultationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForRequest) return;
    try {
      const res = await api.requestConsultation({
        patientId,
        doctorId: selectedDoctorForRequest.doctorId,
        reason: consultationReason
      });
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 4000);
      setSelectedDoctorForRequest(null);
      setShowDoctorDiscovery(false);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error requesting consultation: ${err.message}`);
    }
  };

  const handleAddCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaregiverName || !newCaregiverEmail) return;
    try {
      await api.addCaregiver(patientId, {
        name: newCaregiverName,
        email: newCaregiverEmail,
        relationship: newCaregiverRel,
        accessScope: 'ALL'
      });
      setFeedback('Caregiver authorized successfully!');
      setTimeout(() => setFeedback(null), 3000);
      setNewCaregiverName('');
      setNewCaregiverEmail('');
      setShowAddCaregiver(false);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Error adding caregiver: ${err.message}`);
    }
  };

  const handleOpenPayModal = (bill: Bill) => {
    setSelectedBillForPay(bill);
    setPayerUpi('anjali@okaxis');
    setPaymentMethod('UPI');
    setPayModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;

    setPaying(true);
    try {
      const res = await api.payBill(selectedBillForPay.id, {
        paymentMethod,
        payerDetails: {
          name: patient?.name,
          email: patient?.email,
          phone: patient?.phone,
          upiId: paymentMethod === 'UPI' ? payerUpi : undefined,
          last4: paymentMethod === 'CARD' ? '4242' : undefined
        }
      });

      setLastPaymentReceipt(res.receipt);
      setPayModalOpen(false);
      setReceiptModalOpen(true);
      setFeedback(`Payment of ₹${selectedBillForPay.totalAmount} completed successfully in sandbox mode!`);
      setTimeout(() => setFeedback(null), 5000);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">Loading MedSafe Patient Portal...</p>
        </div>
      </div>
    );
  }

  const patient = data?.patient;
  const schedules = data?.schedulesToday || data?.todaySchedule || [];
  const groupedSchedule = data?.groupedSchedule || {};
  const medications = patientMedications.length > 0 ? patientMedications : (data?.medications || []);
  const prescriptions = patientPrescriptions.length > 0 ? patientPrescriptions : (data?.prescriptions || []);
  const supplies = patientSupplies;
  const refillRequests = patientRefills;
  const safetyAlerts = data?.safetyAlerts || [];
  const followUps = patientFollowUps.length > 0 ? patientFollowUps : (data?.followUps || []);
  const analytics = data?.analytics || {};
  const caregivers = data?.caregivers || [];
  const notifications = patientNotifications.length > 0 ? patientNotifications : (data?.notifications || []);

  const refillsDueCount = supplies.filter(s => s.refillStatus === 'REFILL_DUE' || s.refillStatus === 'DUE_SOON').length ||
    medications.filter((m: any) => (m.refillRemaining !== undefined && m.refillRemaining <= 7)).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Taken — On Time</span>;
      case 'LATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5 mr-1" />Taken — Late</span>;
      case 'MISSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5 mr-1" />Missed</span>;
      case 'SKIPPED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Skipped</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800"><Clock className="w-3.5 h-3.5 mr-1" />Upcoming</span>;
    }
  };

  const timeSectionTitles: Record<TimeOfDay, { label: string; icon: string }> = {
    MORNING: { label: 'Morning Doses (06:00 - 12:00)', icon: '🌅' },
    AFTERNOON: { label: 'Afternoon Doses (12:00 - 17:00)', icon: '☀️' },
    EVENING: { label: 'Evening Doses (17:00 - 20:00)', icon: '🌆' },
    NIGHT: { label: 'Night Doses (20:00 - 24:00)', icon: '🌙' }
  };

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Persistent Left Sidebar Navigation (18 Sections) */}
      <PatientSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        patientId={patient?.patientId || patientId}
        patientName={patient?.name || 'Patient'}
        unreadCount={notifications?.filter((n: any) => !n.readStatus).length || 0}
        safetyAlertCount={safetyAlerts?.length || 0}
        pendingBillsCount={bills.filter(b => b.status === 'PENDING').length}
        readyReportsCount={medicalReports.length}
      />

      {/* Main Content View Area */}
      <div className="flex-1 p-6 max-w-6xl mx-auto overflow-y-auto space-y-6">
        {/* Toast Feedback */}
        {feedback && (
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 1. VIEW: DASHBOARD (Overview) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Patient Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl font-black text-slate-900">Hello, {patient?.name}</h1>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                    {patient?.patientId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Connected Clinic: <strong className="text-slate-700">{myClinics[0]?.name || 'Apollo Health Center'}</strong> • Emergency Contact: {patient?.emergencyContact?.name} ({patient?.emergencyContact?.phone})
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleOpenDiscovery}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Find a Doctor</span>
                </button>
              </div>
            </div>

            {/* Top Quick Status Metric Cards (7 Clickable Navigation Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* 1. Prescribed Medications */}
              <div
                onClick={() => setActiveTab('medications')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View All Prescribed Medications"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-sky-600 transition-colors">
                    MEDICATIONS
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {medications.length}
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  {medications.length} Active →
                </span>
              </div>

              {/* 2. Today's Reminders */}
              <div
                onClick={() => setActiveTab('reminders')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View Today's Reminders"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-sky-600 transition-colors">
                    REMINDERS
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {schedules.length}
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  {schedules.length} Scheduled →
                </span>
              </div>

              {/* 3. Adherence */}
              <div
                onClick={() => setActiveTab('adherence')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View Adherence Analytics"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-emerald-600 transition-colors">
                    ADHERENCE
                  </span>
                  <div className="text-xl font-black text-emerald-600 mt-1">
                    {analytics?.adherencePercentage || 92}%
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {analytics?.adherencePercentage || 92}% Target →
                </span>
              </div>

              {/* 4. Refills Due */}
              <div
                onClick={() => setActiveTab('refills')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View Refills & Supply Tracking"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-amber-600 transition-colors">
                    REFILLS DUE
                  </span>
                  <div className={`text-xl font-black mt-1 ${refillsDueCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {refillsDueCount}
                  </div>
                </div>
                <span className={`mt-2 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  refillsDueCount > 0 ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-50 border-slate-200'
                }`}>
                  {refillsDueCount} Due →
                </span>
              </div>

              {/* 5. Pending Bills */}
              <div
                onClick={() => setActiveTab('bills-payments')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View Bills & Payments"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-rose-600 transition-colors">
                    PENDING BILLS
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-1">
                    ₹{billingSummary.totalPending || 0}
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  ₹{billingSummary.totalPending || 0} Due →
                </span>
              </div>

              {/* 6. Upcoming Tests */}
              <div
                onClick={() => setActiveTab('tests-investigations')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View Tests & Investigations"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-indigo-600 transition-colors">
                    UPCOMING TESTS
                  </span>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {testOrders.filter(t => t.status !== 'COMPLETED').length}
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {testOrders.filter(t => t.status !== 'COMPLETED').length} Active →
                </span>
              </div>

              {/* 7. Follow-Ups */}
              <div
                onClick={() => setActiveTab('safety-followup')}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                title="View Follow-Ups & Safety Alerts"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-purple-600 transition-colors">
                    FOLLOW-UPS
                  </span>
                  <div className="text-xl font-black text-purple-700 mt-1">
                    {followUps.filter((f: any) => f.status === 'PENDING').length}
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  {followUps.filter((f: any) => f.status === 'PENDING').length} Pending →
                </span>
              </div>
            </div>

{/* Quick Diagnostic / Lab Alert Card */}
            {testOrders.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-indigo-950">Diagnostic Investigations Active ({testOrders.length})</h4>
                    <p className="text-[11px] text-indigo-800">Latest: {testOrders[0].testName} ({testOrders[0].status})</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('tests-investigations')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                >
                  View Tests
                </button>
              </div>
            )}

            {/* Today's Schedule Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Today's Medication Intake</h3>
                  <p className="text-xs text-slate-500">Record when you take your medications to maintain accurate clinical adherence</p>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  Full Schedule →
                </button>
              </div>

              <div className="grid gap-3">
                {schedules.map((sch: any) => (
                  <div key={sch.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                        💊
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{sch.medicationName}</span>
                          <span className="font-mono text-xs text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            {sch.scheduledTime}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{sch.dosage} • {sch.instructions}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusBadge(sch.status)}
                      {sch.status === 'UPCOMING' && (
                        <>
                          <button
                            onClick={() => handleTaken(sch.id)}
                            disabled={actionLoading === sch.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                          >
                            Taken
                          </button>
                          <button
                            onClick={() => handleSkip(sch.id)}
                            disabled={actionLoading === sch.id}
                            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => handleMissed(sch.id)}
                            disabled={actionLoading === sch.id}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100"
                          >
                            Missed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. VIEW: MY MEDICATIONS */}
        {activeTab === 'medications' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Prescribed Medications</h2>
                <p className="text-xs text-slate-500 mt-1">Active medication portfolio with full clinical dosage metadata, duration, prescription references, and daily intake actions</p>
              </div>
              <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-bold text-xs">
                {medications.length} Prescribed Medications
              </span>
            </div>

            {medications.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                  💊
                </div>
                <h3 className="text-base font-bold text-slate-900">No prescribed medications yet.</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When your attending physician prescribes medications during your consultation, they will automatically appear here with complete clinical details and intake schedules.
                </p>
                <button
                  onClick={() => setActiveTab('my-doctors')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center space-x-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Connect with Doctor</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-5">
                {medications.map((med: any) => {
                  const todayDoses = schedules.filter((s: any) =>
                    s.medicationId === med.id || s.medicationName?.toLowerCase() === med.name?.toLowerCase()
                  );

                  // Find associated prescription
                  const associatedRx = prescriptions.find(
                    (p: any) => p.prescriptionId === med.prescriptionId || p.id === med.prescriptionId
                  );

                  // Calculate Duration in Days
                  let durationStr = '30 days';
                  if (med.startDate && med.endDate) {
                    const startMs = new Date(med.startDate).getTime();
                    const endMs = new Date(med.endDate).getTime();
                    const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
                    durationStr = `${diffDays} days`;
                  }

                  const rxDate = associatedRx?.prescriptionDate || med.startDate || '2026-08-15';

                  // Determine status
                  const isExpired = med.prescriptionStatus === 'EXPIRED';
                  const isExpiring = med.prescriptionStatus === 'EXPIRING';
                  const statusLabel = isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active';

                  return (
                    <div key={med.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg shrink-0">
                            💊
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-base">{med.name}</h4>
                              <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {med.genericName}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                                isExpired
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isExpiring
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-slate-500 mt-1">
                              Prescribed by: <strong className="text-slate-700">{med.doctorName || 'Dr. Ravi Kumar, MD'}</strong> • Prescription Ref: <strong className="text-sky-700 font-mono">#{med.prescriptionId || 'RX10001'}</strong> • Issued Date: {rxDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            onClick={() => {
                              if (associatedRx) {
                                setSelectedPrescriptionForModal(associatedRx);
                              } else {
                                setSelectedPrescriptionForModal({
                                  prescriptionId: med.prescriptionId || 'RX10001',
                                  patientId,
                                  doctorName: med.doctorName || 'Dr. Ravi Kumar, MD',
                                  clinicName: 'Apollo Internal Medicine Wing',
                                  prescriptionDate: rxDate,
                                  validFrom: med.startDate || '2026-08-01',
                                  validUntil: med.endDate || '2026-11-30',
                                  status: statusLabel.toUpperCase(),
                                  notes: `Prescription order for ${med.name} ${med.strength}`,
                                  medicationIds: [med.id]
                                });
                              }
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Prescription</span>
                          </button>
                          <span className="text-[10px] text-slate-400">Duration: <strong className="text-slate-700">{durationStr}</strong></span>
                        </div>
                      </div>

                      {/* Complete Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-slate-700">
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Medicine Name</strong> {med.name}</div>
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Dosage</strong> {med.dosageAmount} {med.dosageUnit} ({med.strength})</div>
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Frequency</strong> {med.frequency}</div>
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Route & Form</strong> {med.route} ({med.form})</div>
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Start Date</strong> {med.startDate || '2026-08-01'}</div>
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">End Date</strong> {med.endDate || '2026-11-30'}</div>
                        <div><strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Scheduled Times</strong> {med.scheduleTimes?.join(', ') || '08:00 AM'}</div>
                        <div>
                          <strong className="text-slate-900 block text-[10px] uppercase text-slate-400">Food Instruction</strong>
                          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                            {med.foodInstruction?.replace('_', ' ') || 'NO RESTRICTION'}
                          </span>
                        </div>
                      </div>

                      <div className="text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        <strong className="text-slate-900">Clinical Instructions: </strong>
                        <span>{med.instructions || 'Take as prescribed by doctor.'}</span>
                      </div>

                      {/* Scheduled Doses for Today & Direct Adherence Actions */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                            Today's Scheduled Intakes & Adherence
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {todayDoses.length} {todayDoses.length === 1 ? 'dose' : 'doses'} scheduled today
                          </span>
                        </div>

                        {todayDoses.length === 0 ? (
                          <p className="text-slate-400 italic text-[11px]">No pending doses scheduled for this medication today.</p>
                        ) : (
                          <div className="space-y-2">
                            {todayDoses.map((sch: any) => (
                              <div key={sch.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                                  <span className="font-mono font-bold text-slate-900">{sch.scheduledTime}</span>
                                  <span className="text-slate-500">• {sch.dosage}</span>
                                  {sch.notes && <span className="text-slate-500 italic">({sch.notes})</span>}
                                </div>

                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(sch.status)}
                                  {sch.status === 'UPCOMING' ? (
                                    <>
                                      <button
                                        onClick={() => handleTaken(sch.id)}
                                        disabled={actionLoading === sch.id}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                                      >
                                        Taken
                                      </button>
                                      <button
                                        onClick={() => handleSkip(sch.id)}
                                        disabled={actionLoading === sch.id}
                                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs transition-colors"
                                      >
                                        Skip
                                      </button>
                                      <button
                                        onClick={() => handleMissed(sch.id)}
                                        disabled={actionLoading === sch.id}
                                        className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold rounded-lg transition-colors"
                                      >
                                        Missed
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[11px] text-slate-500 font-medium">Recorded ✓</span>
                                  )}
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
            )}
          </div>
        )}

{/* 3. VIEW: TODAY'S SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Today's Detailed Medication Schedule</h2>
              <p className="text-xs text-slate-500 mt-1">Doses grouped by time intervals with real-time adherence marking</p>
            </div>

            {(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as TimeOfDay[]).map((timeOfDay) => {
              const list = groupedSchedule[timeOfDay] || [];
              if (list.length === 0) return null;
              const section = timeSectionTitles[timeOfDay];

              return (
                <div key={timeOfDay} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                    <span>{section.icon}</span>
                    <span>{section.label}</span>
                  </div>

                  <div className="space-y-2.5">
                    {list.map((sch: any) => (
                      <div key={sch.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{sch.medicationName}</span>
                            <span className="font-mono text-xs bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              {sch.scheduledTime}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5">{sch.dosage} • {sch.instructions}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusBadge(sch.status)}
                          {sch.status === 'UPCOMING' && (
                            <>
                              <button
                                onClick={() => handleTaken(sch.id)}
                                disabled={actionLoading === sch.id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Taken
                              </button>
                              <button
                                onClick={() => handleSkip(sch.id)}
                                disabled={actionLoading === sch.id}
                                className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100"
                              >
                                Skip
                              </button>
                              <button
                                onClick={() => handleMissed(sch.id)}
                                disabled={actionLoading === sch.id}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100"
                              >
                                Missed
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. VIEW: REMINDERS */}
        {activeTab === 'reminders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Medication Reminders</h2>
                <p className="text-xs text-slate-500 mt-1">Today's and upcoming dose reminder alerts with direct intake actions</p>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold flex items-center space-x-1.5">
                <BellRing className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Sound plays strictly once when reminder arrives. No repetitive beeping.</span>
              </div>
            </div>

            {/* Today's Reminders List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Today's Medication Reminders ({schedules.length})
                </h3>
              </div>

              <div className="grid gap-3">
                {schedules.map((sch: any) => (
                  <div key={sch.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-200 shrink-0">
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{sch.medicationName}</h4>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold border border-sky-200">
                            {sch.scheduledTime}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          Dosage: <strong className="text-slate-700">{sch.dosage}</strong> • Instructions: {sch.instructions || 'Take as prescribed'}
                        </p>
                        {sch.notes && (
                          <p className="text-amber-700 text-[11px] font-medium mt-0.5">Note: {sch.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      {getStatusBadge(sch.status)}

                      {sch.status === 'UPCOMING' ? (
                        <>
                          <button
                            onClick={() => handleTaken(sch.id)}
                            disabled={actionLoading === sch.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                          >
                            Taken
                          </button>
                          <button
                            onClick={() => handleSkip(sch.id)}
                            disabled={actionLoading === sch.id}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-colors"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => onOpenReminderModal(sch)}
                            className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-xl border border-sky-200"
                            title="Open Reminder Modal"
                          >
                            Open Alert Prompt
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onOpenReminderModal(sch)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] underline"
                        >
                          View Prompt Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. VIEW: ADHERENCE / TRACKING */}
        {activeTab === 'adherence' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Adherence & Compliance Tracking</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time clinical intake analytics across scheduled, taken, missed, and skipped doses</p>
            </div>

            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">OVERALL ADHERENCE</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.adherencePercentage || 92}%</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Routine intake rate</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">TAKEN ON TIME</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{analytics?.takenOnTime || 0}</div>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Within grace period</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">TAKEN LATE</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{analytics?.takenLate || 0}</div>
                <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Recorded past window</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">MISSED DOSES</span>
                <div className="text-2xl font-black text-rose-600 mt-1">{analytics?.missed || 0}</div>
                <p className="text-[10px] text-rose-700 font-semibold mt-0.5">Untaken doses</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SKIPPED DOSES</span>
                <div className="text-2xl font-black text-amber-500 mt-1">{analytics?.skipped || 0}</div>
                <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Follow-up tracked</p>
              </div>
            </div>

            {/* Daily History Chart */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Past 7 Days Intake Trends</h3>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-sky-600"></span><span>Taken</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-rose-600"></span><span>Missed</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span><span>Skipped</span></span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="taken" fill="#0284c7" name="Taken" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" fill="#e11d48" name="Missed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="skipped" fill="#f59e0b" name="Skipped" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Medication-wise Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Medication-Wise Compliance Breakdown</h3>
                <span className="text-xs text-slate-500">{medications.length} Regimens</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Medication</th>
                      <th className="p-3">Scheduled</th>
                      <th className="p-3">Taken</th>
                      <th className="p-3">Late</th>
                      <th className="p-3">Missed</th>
                      <th className="p-3">Skipped</th>
                      <th className="p-3">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(analytics?.medicationBreakdown || medications.map((m: any) => ({
                      medicationName: m.name,
                      scheduled: 30,
                      taken: 28,
                      late: 1,
                      missed: 1,
                      skipped: 0,
                      adherence: 93
                    }))).map((mb: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{mb.medicationName}</td>
                        <td className="p-3">{mb.scheduled}</td>
                        <td className="p-3 text-emerald-600 font-semibold">{mb.taken}</td>
                        <td className="p-3 text-amber-600">{mb.late}</td>
                        <td className="p-3 text-rose-600">{mb.missed}</td>
                        <td className="p-3 text-amber-500 font-semibold">{mb.skipped || 0}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            mb.adherence >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {mb.adherence}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. VIEW: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Official Doctor Prescriptions</h2>
              <p className="text-xs text-slate-500 mt-1">Authentic clinical prescriptions issued by your attending physicians</p>
            </div>

            <div className="grid gap-4">
              {prescriptions.map((rx: any) => (
                <div key={rx.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {rx.prescriptionId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">Issued by {rx.doctorName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {rx.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                    <div><strong>Clinic:</strong> {rx.clinicName}</div>
                    <div><strong>Issue Date:</strong> {rx.prescriptionDate}</div>
                    <div><strong>Valid From:</strong> {rx.validFrom}</div>
                    <div><strong>Valid Until:</strong> {rx.validUntil}</div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                    <strong>Clinician Notes:</strong> {rx.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. VIEW: TESTS & INVESTIGATIONS (Phase 2 Diagnostic Orders) */}
        {activeTab === 'tests-investigations' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Laboratory & Diagnostic Investigations</h2>
              <p className="text-xs text-slate-500 mt-1">Medical test orders prescribed by your clinicians with live lab accession tracking</p>
            </div>

            <div className="grid gap-4">
              {testOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                  No diagnostic tests currently prescribed.
                </div>
              ) : (
                testOrders.map(order => (
                  <div key={order.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {order.testOrderId}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{order.testName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {order.testCategory}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-slate-600">
                        <div><strong>Prescribed By:</strong> {order.doctorName}</div>
                        <div><strong>Diagnostic Center:</strong> {order.labName}</div>
                        <div><strong>Priority:</strong> <span className="font-bold text-indigo-700">{order.priority}</span></div>
                        <div><strong>Ordered On:</strong> {new Date(order.orderedAt).toLocaleDateString()}</div>
                        <div><strong>Investigation Fee:</strong> <span className="font-bold text-slate-900">₹{order.cost}</span></div>
                        <div><strong>Clinical Reason:</strong> {order.reason}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'SAMPLE_COLLECTED'
                          ? 'bg-sky-100 text-sky-800'
                          : order.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status === 'COMPLETED' ? 'Report Ready ✓' : order.status}
                      </span>

                      {order.status === 'COMPLETED' && (
                        <button
                          onClick={() => setActiveTab('medical-reports')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                          View Report
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 8. VIEW: MEDICAL REPORTS (Phase 2 Secure Reports) */}
        {activeTab === 'medical-reports' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Official Diagnostic Reports</h2>
              <p className="text-xs text-slate-500 mt-1">Validated laboratory and radiological investigation findings</p>
            </div>

            <div className="grid gap-4">
              {medicalReports.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                  No completed medical reports available yet. Reports will appear as soon as published by the diagnostic lab.
                </div>
              ) : (
                medicalReports.map(rep => (
                  <div key={rep.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {rep.reportId}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{rep.testName}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Facility: {rep.labName} • Prescribing Clinician: {rep.doctorName} • Date: {rep.testDate}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedReportForView(rep)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Findings</span>
                        </button>
                        <a
                          href={`/api/reports/${rep.reportId}/download`}
                          download
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Report</span>
                        </a>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">RESULT SUMMARY</span>
                      <p className="font-bold text-slate-800 mt-0.5">{rep.resultSummary}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-[10px] text-amber-900 flex items-start space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{rep.disclaimer}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 9. VIEW: BILLS & PAYMENTS (Phase 2 Itemized Billing + Sandbox Pay Now) */}
        {activeTab === 'bills-payments' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bills, Invoices & Sandbox Payments</h2>
                <p className="text-xs text-slate-500 mt-1">Itemized diagnostic and clinical billing with instant simulated checkout</p>
              </div>
            </div>

            {/* Billing Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">TOTAL DUE</span>
                <div className="text-2xl font-black text-rose-600 mt-1">₹{billingSummary.totalPending || 0}</div>
                <span className="text-[10px] text-slate-500">Unsettled medical charges</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SETTLED PAYMENTS</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹{billingSummary.totalPaid || 0}</div>
                <span className="text-[10px] text-emerald-600 font-semibold">Verified receipts</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">PAYMENT GATEWAY</span>
                <div className="text-sm font-bold text-indigo-600 mt-1">MedSafe Sandbox</div>
                <span className="text-[10px] text-slate-500">Simulated UPI & Card</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">DATA SECURITY</span>
                <div className="text-sm font-bold text-slate-800 mt-1">PCI-DSS Compliant</div>
                <span className="text-[10px] text-slate-500">Zero raw CVV/Card storage</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Itemized Invoices</h3>
                <span className="text-xs text-slate-500">{bills.length} total bills</span>
              </div>

              <div className="divide-y divide-slate-100">
                {bills.map(bill => (
                  <div key={bill.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {bill.billId}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {bill.items[0]?.description || 'Diagnostic Services'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {bill.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-slate-600">
                        <div><strong>Facility:</strong> {bill.labName || bill.clinicName}</div>
                        <div><strong>Billed Date:</strong> {bill.billDate}</div>
                        <div><strong>Due Date:</strong> {bill.dueDate}</div>
                        <div><strong>Tax (5% GST):</strong> ₹{bill.tax}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL AMOUNT</span>
                        <span className="text-lg font-black text-slate-900">₹{bill.totalAmount}</span>
                      </div>

                      {bill.status === 'PENDING' ? (
                        <button
                          onClick={() => handleInitiateBillPayment(bill)}
                          disabled={actionLoading === `bill-${bill.billId || bill.id}`}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{actionLoading === `bill-${bill.billId || bill.id}` ? 'Processing...' : 'Pay with Razorpay'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.getBillReceipt(bill.billId);
                              setLastPaymentReceipt(res.receipt);
                              setReceiptModalOpen(true);
                            } catch (e) {
                              alert('Could not retrieve receipt');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Razorpay Bill Payment History */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Razorpay Bill Payment History</h3>
                  <p className="text-slate-500 text-[11px]">Itemized medical and diagnostic payments processed via Razorpay</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {billPaymentHistory.length} Verified Payments
                </span>
              </div>

              {billPaymentHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No verified Razorpay healthcare payments recorded yet. Paid bills will appear here with printable receipts.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Bill ID</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Razorpay Payment ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billPaymentHistory.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-[11px] text-slate-600">{pay.razorpayOrderId}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{pay.billId}</td>
                          <td className="p-3 font-black text-slate-900">₹{pay.amount}</td>
                          <td className="p-3 text-slate-600">Razorpay ({pay.paymentMethod})</td>
                          <td className="p-3 font-mono text-[11px] text-indigo-600 font-semibold">{pay.razorpayPaymentId}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                              {pay.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{new Date(pay.paidAt || Date.now()).toLocaleDateString()}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setLastPaymentReceipt({
                                  receiptNumber: `RCP-${pay.billPaymentId}`,
                                  billId: pay.billId,
                                  amount: pay.amount,
                                  transactionRef: pay.razorpayPaymentId,
                                  gatewayMode: 'RAZORPAY',
                                  paidAt: pay.paidAt
                                });
                                setReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px]"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: MY SUBSCRIPTION & FAMILY PLAN */}
        {activeTab === 'subscriptions' && (() => {
          const currentPlan = mySubscription?.activePlan || {
            planId: 'PLAN_PATIENT_FREE',
            planName: 'Free Patient Plan',
            price: 0,
            billingCycle: 'MONTHLY',
            features: ['Core Medication Tracking', 'Daily Dosing Alerts', 'Single User Access']
          };
          const subscriptionData = mySubscription?.subscription;
          const isFamilyPlan = currentPlan.planId === 'PLAN_FAMILY_PLUS' || currentPlan.planName?.toLowerCase().includes('family');

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-black text-slate-900">My Subscription & Family Plan</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Powered by Razorpay. Seamlessly manage patient memberships, family health access, and verified renewal receipts.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] text-indigo-500 font-bold uppercase block">ACTIVE TIER</span>
                    <span className="font-extrabold text-indigo-900 text-sm">{currentPlan.planName}</span>
                  </div>
                </div>
              </div>

              {/* Current Active Plan Card */}
              <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-900 rounded-3xl text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-900 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping"></span>
                        <span>{subscriptionData?.status || 'ACTIVE'}</span>
                      </span>
                      {isFamilyPlan && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900">
                          Family Coverage Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black">{currentPlan.planName}</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      {isFamilyPlan
                        ? 'Includes primary patient plus up to 5 family members with zero additional payments.'
                        : 'Single patient digital health coordination & medication adherence platform.'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">PLAN PRICE</span>
                        <span className="font-bold text-white text-base">₹{currentPlan.price} / mo</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">BILLING CYCLE</span>
                        <span className="font-bold text-white">{subscriptionData?.billingCycle || 'MONTHLY'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">NEXT RENEWAL</span>
                        <span className="font-bold text-white">
                          {subscriptionData?.renewalDate
                            ? new Date(subscriptionData.renewalDate).toLocaleDateString()
                            : 'Continuous / Active'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">FAMILY SLOTS</span>
                        <span className="font-bold text-emerald-400">
                          {isFamilyPlan ? `${familyMembers.length} / 5 Enrolled` : '1 Patient Only'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block mb-1">Razorpay Verified ID</span>
                    <span className="font-mono text-xs text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl inline-block">
                      {subscriptionData?.razorpayPaymentId || 'MedSafe-Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* FAMILY MEMBERS MANAGEMENT SECTION (Family Plus Plan) */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-50/50 to-indigo-50/50">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                        <Users className="w-5 h-5" />
                      </span>
                      <h3 className="font-black text-slate-900 text-base">Family Members Coverage</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Primary patient pays for Family Plan. Up to 5 family members are enrolled and do <strong>NOT</strong> need to pay separately.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      Enrolled: <strong className="text-indigo-600">{familyMembers.length}</strong> / 5
                    </span>
                    <button
                      onClick={() => setShowAddFamilyModal(true)}
                      disabled={!isFamilyPlan || familyMembers.length >= 5}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{familyMembers.length >= 5 ? 'Max Members Reached (5)' : 'Add Family Member'}</span>
                    </button>
                  </div>
                </div>

                {!isFamilyPlan && (
                  <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Family member enrollment requires the <strong>Family Plus Plan</strong> (₹499/mo). Upgrade below to unlock 5 zero-cost member accounts.
                      </span>
                    </div>
                  </div>
                )}

                {familyMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No family members enrolled yet. Click 'Add Family Member' to add spouse, parents, or children under your Family Plus plan.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {familyMembers.map((member, idx) => (
                      <div key={member.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-black flex items-center justify-center text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-slate-900">{member.name}</h4>
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                                {member.relationship}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-slate-500 text-[11px] mt-0.5">
                              {member.phone && <span>📱 {member.phone}</span>}
                              {member.email && <span>✉️ {member.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                            <span>●</span>
                            <span>Active (Free Access - Paid by Primary)</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AVAILABLE SUBSCRIPTION PLANS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Select or Switch Subscription Plan</h3>
                    <p className="text-xs text-slate-500">Instant activation via Razorpay Payment Gateway with automatic renewal</p>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="p-1 bg-slate-100 rounded-2xl flex items-center space-x-1 w-fit">
                    <button
                      onClick={() => setSubscriptionBillingCycle('MONTHLY')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        subscriptionBillingCycle === 'MONTHLY'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      onClick={() => setSubscriptionBillingCycle('YEARLY')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        subscriptionBillingCycle === 'YEARLY'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Yearly (2 Months Free)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {subscriptionPlans.map((plan) => {
                    const isCurrent = currentPlan.planId === plan.planId;
                    const isFamily = plan.planId === 'PLAN_FAMILY_PLUS' || plan.planName.toLowerCase().includes('family');
                    const displayPrice = subscriptionBillingCycle === 'YEARLY' ? plan.price * 10 : plan.price;
                    const periodLabel = subscriptionBillingCycle === 'YEARLY' ? '/ year' : '/ month';

                    return (
                      <div
                        key={plan.id || plan.planId}
                        className={`p-6 bg-white rounded-3xl border transition-all relative flex flex-col justify-between ${
                          isFamily
                            ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                            : isCurrent
                            ? 'border-emerald-400 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {isFamily && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                            Best Value for Families
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-black text-slate-900 text-lg">{plan.planName}</h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 min-h-[36px]">{plan.description}</p>

                          <div className="mt-4 mb-6">
                            <div className="flex items-baseline">
                              <span className="text-3xl font-black text-slate-900">₹{displayPrice}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1.5">{periodLabel}</span>
                            </div>
                            {subscriptionBillingCycle === 'YEARLY' && plan.price > 0 && (
                              <span className="text-[10px] text-emerald-600 font-bold">Includes 2 months free discount</span>
                            )}
                          </div>

                          <div className="space-y-2 border-t border-slate-100 pt-4 mb-6 text-xs text-slate-700">
                            {plan.features.map((feat, fIdx) => (
                              <div key={fIdx} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <button
                              disabled
                              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs cursor-default"
                            >
                              Currently Active
                            </button>
                          ) : plan.price === 0 ? (
                            <button
                              onClick={() => handleUpgradeSubscription(plan.planId)}
                              className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700"
                            >
                              Downgrade to Free
                            </button>
                          ) : (
                            <button
                              onClick={() => handleInitiateSubscriptionPayment(plan, subscriptionBillingCycle)}
                              disabled={actionLoading === `sub-${plan.planId}`}
                              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 ${
                                isFamily ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>
                                {actionLoading === `sub-${plan.planId}`
                                  ? 'Opening Razorpay...'
                                  : `Subscribe ₹${displayPrice} with Razorpay`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SUBSCRIPTION PAYMENT HISTORY */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Subscription Payment History</h3>
                    <p className="text-slate-500 text-[11px]">Official Razorpay transaction audit trail for membership plans</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {subscriptionPaymentHistory.length} Invoices
                  </span>
                </div>

                {subscriptionPaymentHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No subscription payments recorded yet. Subscribing via Razorpay will record verified transaction receipts here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Plan Name</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Gateway</th>
                          <th className="p-3">Razorpay Payment ID</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscriptionPaymentHistory.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-[11px] text-slate-600">{pay.razorpayOrderId}</td>
                            <td className="p-3 font-bold text-slate-900">{pay.planName}</td>
                            <td className="p-3 font-black text-slate-900">₹{pay.amount}</td>
                            <td className="p-3 text-slate-600">Razorpay</td>
                            <td className="p-3 font-mono text-[11px] text-indigo-600 font-semibold">{pay.razorpayPaymentId}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                {pay.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{new Date(pay.paidAt || Date.now()).toLocaleDateString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setLastPaymentReceipt({
                                    receiptNumber: `RCP-${pay.subscriptionPaymentId}`,
                                    billId: pay.planName,
                                    amount: pay.amount,
                                    transactionRef: pay.razorpayPaymentId,
                                    gatewayMode: 'RAZORPAY',
                                    paidAt: pay.paidAt
                                  });
                                  setReceiptModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px]"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 10. VIEW: MY DOCTORS */}
        {activeTab === 'my-doctors' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Connected Doctors</h2>
                <p className="text-xs text-slate-500 mt-1">Licensed physicians authorized to coordinate your care</p>
              </div>
              <button
                onClick={handleOpenDiscovery}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Find a Doctor</span>
              </button>
            </div>

            <div className="grid gap-4">
              {myDoctors.map((doc: any) => (
                <div key={doc.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                      <p className="text-slate-500">{doc.specialty} • {doc.clinicName || 'Apollo Health Center'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Authorized Clinician
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. VIEW: MY CLINICS */}
        {activeTab === 'my-clinics' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Connected Healthcare Centers</h2>
              <p className="text-xs text-slate-500 mt-1">Hospitals and clinic facilities in your network</p>
            </div>

            <div className="grid gap-4">
              {myClinics.map((clin: any) => (
                <div key={clin.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-teal-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{clin.name}</h4>
                      <p className="text-slate-500">{clin.location} • Phone: {clin.phone}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-bold">In-Network Facility</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. VIEW: SAFETY & FOLLOW-UP */}
        {activeTab === 'safety-followup' && (() => {
          const pendingCount = followUps.filter((f: any) => f.status === 'PENDING').length;
          const inProgressCount = followUps.filter((f: any) => f.status === 'IN_PROGRESS').length;
          const completedCount = followUps.filter((f: any) => f.status === 'COMPLETED' || f.status === 'RESOLVED').length;

          const displayedFollowUps = followUps.filter((f: any) => {
            if (followUpFilter === 'PENDING') return f.status === 'PENDING' || f.status === 'IN_PROGRESS';
            if (followUpFilter === 'COMPLETED') return f.status === 'COMPLETED' || f.status === 'RESOLVED';
            return true;
          });

          const getFollowUpTypeBadge = (type: string = '') => {
            switch (type) {
              case 'SKIPPED_MEDICATION':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">Skipped Dose</span>;
              case 'MISSED_DOSES':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">Repeated Missed</span>;
              case 'PRESCRIPTION_EXPIRY':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300">Prescription Expiring</span>;
              case 'REFILL_REQUIRED':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-300">Refill Required</span>;
              case 'DOCTOR_FOLLOWUP':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">Doctor Follow-Up</span>;
              default:
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">Clinical Review</span>;
            }
          };

          return (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Clinical Follow-Up & Safety Intelligence</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track clinical follow-up actions for skipped doses, repeated missed medications, renewals, and safety alerts
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs">
                  <button
                    onClick={() => setFollowUpFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      followUpFilter === 'ALL' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({followUps.length})
                  </button>
                  <button
                    onClick={() => setFollowUpFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      followUpFilter === 'PENDING' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending ({pendingCount + inProgressCount})
                  </button>
                  <button
                    onClick={() => setFollowUpFilter('COMPLETED')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      followUpFilter === 'COMPLETED' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Completed ({completedCount})
                  </button>
                </div>
              </div>

              {/* Clinical boundary advisory */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Clinical Follow-Up Advisory:</strong> MedSafe automatically logs follow-up actions whenever a dose is skipped, doses are missed repeatedly, or prescriptions require renewal. Review each item and coordinate with your care team.
                </div>
              </div>

              {/* Follow-Ups List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Follow-Up Action Items ({displayedFollowUps.length})
                  </h3>
                </div>

                {displayedFollowUps.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60" />
                    <p className="text-sm font-semibold text-slate-700">No follow-up items in this view</p>
                    <p className="text-xs text-slate-400">All clinical alerts and skipped doses have been resolved.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {displayedFollowUps.map((f: any) => {
                      const isPending = f.status === 'PENDING';
                      const isInProgress = f.status === 'IN_PROGRESS';
                      const isCompleted = f.status === 'COMPLETED' || f.status === 'RESOLVED';

                      return (
                        <div
                          key={f.id}
                          className={`p-5 rounded-2xl border shadow-xs transition-all text-xs space-y-3 ${
                            isCompleted
                              ? 'bg-slate-50 border-slate-200 opacity-80'
                              : isInProgress
                              ? 'bg-sky-50/60 border-sky-300'
                              : 'bg-white border-amber-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {getFollowUpTypeBadge(f.type)}
                                <h4 className="font-extrabold text-slate-900 text-sm">
                                  {f.medicationName ? `${f.medicationName} — Follow-Up` : (f.reason || 'Clinical Follow-Up Item')}
                                </h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isInProgress
                                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  Status: {f.status}
                                </span>
                              </div>

                              <p className="text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">Reason: </strong> {f.reason}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                                {f.scheduledDateTime && (
                                  <div>
                                    <strong className="text-slate-900">Scheduled Date/Time:</strong> {f.scheduledDateTime}
                                  </div>
                                )}
                                <div>
                                  <strong className="text-slate-900">Assigned Clinician:</strong> {f.doctorName || 'Attending Physician'}
                                </div>
                                <div>
                                  <strong className="text-slate-900">Created:</strong> {new Date(f.createdAt).toLocaleString()}
                                </div>
                                {f.resolvedAt && (
                                  <div className="text-emerald-700 font-semibold">
                                    <strong>Completed At:</strong> {new Date(f.resolvedAt).toLocaleString()}
                                  </div>
                                )}
                              </div>

                              {f.actionRequired && (
                                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-900 font-medium">
                                  <strong>Recommended Action: </strong> {f.actionRequired}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {isPending && (
                                <button
                                  onClick={() => handleUpdateFollowUp(f.id, 'IN_PROGRESS')}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                                >
                                  In Progress
                                </button>
                              )}

                              {!isCompleted && (
                                <button
                                  onClick={() => handleUpdateFollowUp(f.id, 'COMPLETED')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                                >
                                  Complete
                                </button>
                              )}

                              {isCompleted && (
                                <span className="inline-flex items-center text-emerald-700 font-bold space-x-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Resolved</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Safety Alerts Advisories Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  Active Safety Intelligence Advisories ({safetyAlerts.length})
                </h3>
                {safetyAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs text-xs space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 text-[10px]">{alert.severity}</span>
                      <h4 className="font-bold text-slate-900">{alert.title}</h4>
                    </div>
                    <p className="text-slate-600">{alert.description}</p>
                    <div className="pt-2 text-indigo-700 font-medium">Recommendation: {alert.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 13. VIEW: NOTIFICATIONS (SECTION A & SECTION B) */}
        {activeTab === 'notifications' && (() => {
          const userNotifs = notifications.filter((n: any) => n.category !== 'SYSTEM_DISPATCH');
          const systemDispatches = notifications.filter((n: any) => n.category === 'SYSTEM_DISPATCH');
          const unreadTotal = notifications.filter((n: any) => !n.readStatus).length;

          const getNotifIcon = (type: string) => {
            switch (type) {
              case 'MEDICATION_REMINDER':
                return <Pill className="w-4 h-4 text-sky-600" />;
              case 'DOSE_MISSED':
                return <AlertTriangle className="w-4 h-4 text-rose-600" />;
              case 'SAFETY_ALERT':
                return <ShieldAlert className="w-4 h-4 text-amber-600" />;
              case 'TEST_ORDERED':
              case 'REPORT_READY':
                return <FlaskConical className="w-4 h-4 text-indigo-600" />;
              case 'BILL_GENERATED':
              case 'PAYMENT_RECEIVED':
                return <Receipt className="w-4 h-4 text-emerald-600" />;
              case 'REFILL_REMINDER':
              case 'PRESCRIPTION_EXPIRING':
                return <Clock className="w-4 h-4 text-cyan-600" />;
              case 'MEDICATION_PLAN_CHANGED':
                return <FileText className="w-4 h-4 text-purple-600" />;
              default:
                return <Bell className="w-4 h-4 text-slate-600" />;
            }
          };

          return (
            <div className="space-y-8 animate-fadeIn">
              {/* Header & Global Control Bar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                      <Bell className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-black text-slate-900">Notifications & System Dispatches</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Unified healthcare communication stream with segregated patient clinical alerts and system announcements.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                    {unreadTotal} Unread Notifications
                  </span>

                  <button
                    onClick={handleMarkAllNotifsRead}
                    disabled={notifLoading || unreadTotal === 0}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all as read</span>
                  </button>

                  <button
                    onClick={handleClearAllNotifs}
                    disabled={notifLoading || notifications.length === 0}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                </div>
              </div>

              {/* SECTION A: NOTIFICATIONS (User-Specific Notifications) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-600 text-white shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        SECTION A: PATIENT NOTIFICATIONS
                      </h3>
                      <p className="text-xs text-slate-500">
                        Personal medication reminders, adherence logs, prescription updates, test orders, and bills
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    {userNotifs.length} {userNotifs.length === 1 ? 'Alert' : 'Alerts'}
                  </span>
                </div>

                {userNotifs.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
                    <Bell className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">No active patient notifications</p>
                    <p className="text-xs text-slate-400">All recent personal notifications have been cleared or acknowledged.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {userNotifs.map((n: any) => {
                      const isUnread = !n.readStatus;
                      return (
                        <div
                          key={n.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isUnread
                              ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-200 shrink-0 mt-0.5">
                                {getNotifIcon(n.type)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                    {n.title}
                                  </h4>
                                  {isUnread ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-600 text-white shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                                      UNREAD
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      READ
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {n.type}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                                  {n.message}
                                </p>

                                <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {new Date(n.createdAt).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })} at {new Date(n.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {isUnread && (
                                <button
                                  onClick={() => handleMarkNotifRead(n.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                                  title="Mark notification as read"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Mark Read</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleClearNotif(n.id)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                                title="Remove from active notification list"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION B: SYSTEM DISPATCHES (Platform Announcements & Advisories) */}
              <div className="space-y-4 pt-4 border-t-2 border-slate-200/80">
                <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        SECTION B: SYSTEM DISPATCHES
                      </h3>
                      <p className="text-xs text-slate-500">
                        Platform maintenance announcements, clinical security advisories, and infrastructure updates
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    {systemDispatches.length} {systemDispatches.length === 1 ? 'Dispatch' : 'Dispatches'}
                  </span>
                </div>

                {systemDispatches.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
                    <Radio className="w-10 h-10 mx-auto opacity-30 text-purple-400" />
                    <p className="text-sm font-semibold text-slate-700">No active system dispatches</p>
                    <p className="text-xs text-slate-400">Platform operations and network systems are running normally.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {systemDispatches.map((n: any) => {
                      const isUnread = !n.readStatus;
                      return (
                        <div
                          key={n.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isUnread
                              ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shadow-xs border border-purple-200 shrink-0 mt-0.5">
                                <Radio className="w-4 h-4" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                    {n.title}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                                    Official System Dispatch
                                  </span>
                                  {isUnread ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-700 text-white shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                                      UNREAD
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      READ
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                                  {n.message}
                                </p>

                                <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Broadcasted on{' '}
                                      {new Date(n.createdAt).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })} at {new Date(n.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {isUnread && (
                                <button
                                  onClick={() => handleMarkNotifRead(n.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                                  title="Mark dispatch as read"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Mark Read</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleClearNotif(n.id)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                                title="Remove from active dispatch list"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 14. VIEW: CAREGIVERS */}
        {activeTab === 'caregivers' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Authorized Caregivers</h2>
                <p className="text-xs text-slate-500 mt-1">Family members or guardians with delegated monitoring access</p>
              </div>
              <button
                onClick={() => setShowAddCaregiver(!showAddCaregiver)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Caregiver</span>
              </button>
            </div>

            {showAddCaregiver && (
              <form onSubmit={handleAddCaregiver} className="p-5 bg-white rounded-3xl border border-sky-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">Delegate Caregiver Access</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Caregiver Full Name"
                    required
                    value={newCaregiverName}
                    onChange={(e) => setNewCaregiverName(e.target.value)}
                    className="p-2.5 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="email"
                    placeholder="Caregiver Email Address"
                    required
                    value={newCaregiverEmail}
                    onChange={(e) => setNewCaregiverEmail(e.target.value)}
                    className="p-2.5 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Spouse)"
                    value={newCaregiverRel}
                    onChange={(e) => setNewCaregiverRel(e.target.value)}
                    className="p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl">
                  Grant Consent
                </button>
              </form>
            )}

            <div className="grid gap-3">
              {caregivers.map((c: any) => (
                <div key={c.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <HeartHandshake className="w-5 h-5 text-rose-500" />
                    <div>
                      <h4 className="font-bold text-slate-900">{c.granteeName}</h4>
                      <p className="text-slate-500">{c.granteeEmail} • Scope: {c.accessScope}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                    Active Consent
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15. VIEW: ACCESS & CONSENT */}
        {activeTab === 'access-consent' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Access Governance & Patient Consent</h2>
              <p className="text-xs text-slate-500 mt-1">Review who has access to your medical schedules, prescriptions, and reports</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-800">Primary Physician Access</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Authorized</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-800">Diagnostic Center (Apex Lab) Access</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Investigation Orders Only</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Delegated Caregiver Access</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">{caregivers.length} Active Grants</span>
              </div>
            </div>
          </div>
        )}

        {/* 16. VIEW: MEDICAL HISTORY */}
        {activeTab === 'history' && (() => {
          // Compile comprehensive chronological medical timeline
          const events: {
            id: string;
            category: 'PRESCRIPTION' | 'MEDICATION' | 'CONSULTATION' | 'TEST' | 'REPORT' | 'FOLLOWUP' | 'ADHERENCE';
            title: string;
            date: string;
            subtitle: string;
            details: string;
            badge: string;
            badgeColor: string;
            icon: React.FC<{ className?: string }>;
          }[] = [];

          // Prescriptions
          prescriptions.forEach((rx: any) => {
            events.push({
              id: `rx-${rx.id}`,
              category: 'PRESCRIPTION',
              title: `Prescription #${rx.prescriptionId}`,
              date: rx.prescriptionDate || rx.validFrom || '2026-08-15',
              subtitle: `Issued by ${rx.doctorName} • ${rx.clinicName}`,
              details: `Clinical regimen valid until ${rx.validUntil}. Notes: ${rx.notes || 'Routine prescription.'}`,
              badge: rx.status || 'ACTIVE',
              badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
              icon: FileText
            });
          });

          // Medications
          medications.forEach((med: any) => {
            events.push({
              id: `med-${med.id}`,
              category: 'MEDICATION',
              title: `${med.name} Regimen (${med.strength})`,
              date: med.startDate || '2026-08-01',
              subtitle: `${med.dosageAmount} ${med.dosageUnit} (${med.form}) • Route: ${med.route} • Frequency: ${med.frequency}`,
              details: `Prescribed by: ${med.doctorName || 'Attending Physician'}. Food note: ${med.foodInstruction?.replace('_', ' ')}. Instructions: ${med.instructions}`,
              badge: med.prescriptionStatus || 'ACTIVE',
              badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
              icon: Pill
            });
          });

          // Consultations
          myConsultationRequests.forEach((req: any) => {
            events.push({
              id: `req-${req.id}`,
              category: 'CONSULTATION',
              title: `Consultation: Dr. ${req.doctorName}`,
              date: req.requestedAt ? req.requestedAt.split('T')[0] : '2026-08-15',
              subtitle: `Facility: ${req.clinicName || 'Apollo Health Center'} • Specialty: ${req.specialty}`,
              details: `Clinical reason: ${req.reason}. Outcome: ${req.status}`,
              badge: req.status,
              badgeColor: req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-800 border-slate-200',
              icon: Stethoscope
            });
          });

          // Diagnostic Tests
          testOrders.forEach((t: any) => {
            events.push({
              id: `test-${t.id}`,
              category: 'TEST',
              title: `Diagnostic Investigation: ${t.testName}`,
              date: t.orderDate || '2026-08-18',
              subtitle: `Accession #${t.testOrderId} • Diagnostic Center: ${t.labName || 'Apex Pathology Lab'}`,
              details: `Clinical Indication: ${t.clinicalIndication || 'Investigation order'}. Status: ${t.status}`,
              badge: t.status,
              badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
              icon: FlaskConical
            });
          });

          // Medical Reports
          medicalReports.forEach((rep: any) => {
            events.push({
              id: `rep-${rep.id}`,
              category: 'REPORT',
              title: `Diagnostic Report: ${rep.testName}`,
              date: rep.testDate || '2026-08-20',
              subtitle: `Official Report #${rep.reportId} • Facility: ${rep.labName}`,
              details: `Findings: ${rep.resultSummary}. Validated by ${rep.doctorName}. Disclaimer: ${rep.disclaimer}`,
              badge: 'REPORT AVAILABLE',
              badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              icon: FileCheck
            });
          });

          // Follow-Ups
          followUps.forEach((f: any) => {
            events.push({
              id: `flw-${f.id}`,
              category: 'FOLLOWUP',
              title: `Clinical Follow-Up: ${f.type?.replace('_', ' ') || 'Follow-Up'}`,
              date: f.scheduledDateTime ? f.scheduledDateTime.split(' ')[0] : f.createdAt.split('T')[0],
              subtitle: `Clinician: ${f.doctorName || 'Attending Physician'} • Status: ${f.status}`,
              details: `Reason: ${f.reason}. Recommended Action: ${f.actionRequired}`,
              badge: f.status,
              badgeColor: f.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200',
              icon: ShieldAlert
            });
          });

          // Adherence Records
          schedules.filter((s: any) => s.status !== 'UPCOMING').forEach((s: any) => {
            events.push({
              id: `adh-${s.id}`,
              category: 'ADHERENCE',
              title: `Dose Recorded: ${s.medicationName}`,
              date: s.scheduledDate || 'Today',
              subtitle: `Scheduled Time: ${s.scheduledTime} • Status: ${s.status}`,
              details: s.notes || 'Recorded in patient daily adherence log.',
              badge: s.status,
              badgeColor: s.status === 'ON_TIME' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : s.status === 'SKIPPED' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-800 border-rose-200',
              icon: Clock
            });
          });

          // Sort chronologically descending
          events.sort((a, b) => b.date.localeCompare(a.date));

          const filteredEvents = events.filter((ev) => {
            if (historyCategoryFilter === 'ALL') return true;
            if (historyCategoryFilter === 'PRESCRIPTIONS') return ev.category === 'PRESCRIPTION';
            if (historyCategoryFilter === 'MEDICATIONS') return ev.category === 'MEDICATION';
            if (historyCategoryFilter === 'CONSULTATIONS') return ev.category === 'CONSULTATION';
            if (historyCategoryFilter === 'DIAGNOSTICS') return ev.category === 'TEST' || ev.category === 'REPORT';
            if (historyCategoryFilter === 'FOLLOWUP') return ev.category === 'FOLLOWUP' || ev.category === 'ADHERENCE';
            return true;
          });

          return (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Medical & Healthcare History</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Unified chronological audit timeline of prescriptions, regimen plans, consultations, diagnostics, and adherence events
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs">
                  {['ALL', 'PRESCRIPTIONS', 'MEDICATIONS', 'CONSULTATIONS', 'DIAGNOSTICS', 'FOLLOWUP'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setHistoryCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        historyCategoryFilter === cat ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Display */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                    Chronological Healthcare Timeline ({filteredEvents.length} Events)
                  </h3>
                  <span className="text-xs text-slate-500">Sorted most recent first</span>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No medical events recorded in this category.
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                    {filteredEvents.map((ev) => {
                      const Icon = ev.icon;
                      return (
                        <div key={ev.id} className="relative group text-xs">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-sky-600 flex items-center justify-center shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4 text-sky-600 shrink-0" />
                                <h4 className="font-extrabold text-slate-900 text-sm">{ev.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ev.badgeColor}`}>
                                  {ev.badge}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                {ev.date}
                              </span>
                            </div>

                            <p className="text-slate-600 font-medium">{ev.subtitle}</p>
                            <p className="text-slate-500 text-[11px] leading-relaxed pt-0.5">{ev.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 17. VIEW: REFILLS & SUPPLY TRACKING */}
        {activeTab === 'refills' && (() => {
          const activePlan = mySubscription?.activePlan || { planName: 'Free Patient Plan', price: 0 };

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Header with Subscription plan banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                      <RefreshCw className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-black text-slate-900">Medical Refills & Supply Tracking</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Track dispensed supply levels, monitor automatic refill thresholds (≤7 days), and manage pharmacy dispatch workflows.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">CURRENT PLAN</span>
                    <span className="font-extrabold text-slate-900">{activePlan.planName} (₹{activePlan.price}/mo)</span>
                  </div>
                  <button
                    onClick={() => setPlanModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>View Subscription Plans</span>
                  </button>
                </div>
              </div>

              {/* Low Supply Alert */}
              {medications.some((m: any) => {
                const s = supplies.find((sup: any) => sup.medicationId === m.id);
                return (s && s.refillStatus === 'REFILL_DUE') || (m.refillRemaining !== undefined && m.refillRemaining <= 7);
              }) && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Automated Low-Supply Notice:</strong> One or more active medications have reached the refill threshold (≤7 days remaining). Refill requests have been flagged for clinical dispatch.
                  </div>
                </div>
              )}

              {/* SECTION 1: ACTIVE MEDICATION SUPPLIES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Active Medication Supplies ({medications.length})
                  </h3>
                </div>

                {medications.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                    No medications requiring refills.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {medications.map((m: any) => {
                      const supp = supplies.find((s: any) => s.medicationId === m.id);
                      const pendingRefill = refillRequests.find(
                        (r: any) => r.medicationId === m.id && (r.status === 'REQUESTED' || r.status === 'PROCESSING' || r.status === 'READY')
                      );

                      // Determine Refill Status
                      let statusText = 'Not Due';
                      let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';

                      if (pendingRefill) {
                        statusText = `Refill ${pendingRefill.status}`;
                        statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                      } else if (supp?.refillStatus === 'REFILLED') {
                        statusText = 'Refilled';
                        statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                      } else if (supp?.refillStatus === 'EXPIRED' || (m.refillRemaining !== undefined && m.refillRemaining <= 0)) {
                        statusText = 'Expired';
                        statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                      } else if (supp?.refillStatus === 'REFILL_DUE' || (m.refillRemaining !== undefined && m.refillRemaining <= 7)) {
                        statusText = 'Refill Due';
                        statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                      } else if (supp?.refillStatus === 'DUE_SOON') {
                        statusText = 'Due Soon';
                        statusBadge = 'bg-orange-100 text-orange-800 border-orange-300';
                      }

                      // Prescribed, Supplied, Remaining Quantities
                      const hasPrescribedQty = supp?.initialQuantity !== undefined || m.totalQuantity !== undefined;
                      const prescribedQtyText = hasPrescribedQty ? `${supp?.initialQuantity || m.totalQuantity} units` : 'Supply quantity not recorded';

                      const hasSuppliedQty = supp?.quantityDispensed !== undefined;
                      const suppliedQtyText = hasSuppliedQty ? `${supp.quantityDispensed} units` : (hasPrescribedQty ? `${supp?.initialQuantity || m.totalQuantity} units` : 'Supply quantity not recorded');

                      const hasRemainingQty = supp?.quantityRemaining !== undefined || m.refillRemaining !== undefined;
                      const remainingVal = supp?.quantityRemaining !== undefined ? supp.quantityRemaining : (m.refillRemaining !== undefined ? m.refillRemaining : null);
                      const remainingQtyText = remainingVal !== null ? `${remainingVal} doses` : 'Supply quantity not recorded';

                      const totalVal = supp?.initialQuantity || m.totalQuantity || 30;
                      const percentage = remainingVal !== null ? Math.min(100, Math.max(0, Math.round((remainingVal / totalVal) * 100))) : 0;

                      const startDateText = supp?.dispensedDate || m.startDate || 'Not recorded';
                      const expDepletionDateText = supp?.expectedDepletionDate || m.endDate || 'Not recorded';
                      const refillDueDateText = supp?.refillDate || m.refillDate || 'Within 7 Days';

                      return (
                        <div key={m.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs text-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg border border-sky-200 shrink-0">
                                💊
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-extrabold text-slate-900 text-base">{m.name}</h4>
                                  <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {m.genericName || m.strength}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusBadge}`}>
                                    {statusText}
                                  </span>
                                </div>
                                <p className="text-slate-500 mt-1">
                                  Prescription: <strong className="text-slate-700 font-mono">#{m.prescriptionId || 'RX10001'}</strong> • Prescribing Doctor: <strong className="text-slate-700">Dr. {m.doctorName || 'Attending Physician'}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">REFILL DUE DATE</span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {refillDueDateText}
                              </span>
                            </div>
                          </div>

                          {/* 4 Metadata Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 text-slate-700">
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase block">Prescribed Quantity</strong>
                              <span className="font-bold text-slate-900">{prescribedQtyText}</span>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase block">Supplied Quantity</strong>
                              <span className="font-bold text-slate-900">{suppliedQtyText}</span>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Quantity</strong>
                              <span className={`font-bold ${(remainingVal !== null && remainingVal <= 7) ? 'text-rose-600' : 'text-slate-900'}`}>
                                {remainingQtyText}
                              </span>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase block">Expected Depletion</strong>
                              <span className="font-bold text-slate-900">{expDepletionDateText}</span>
                            </div>
                          </div>

                          {/* Progress Bar if recorded */}
                          {remainingVal !== null && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700">Supply Level Indicator:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {remainingVal} / {totalVal} doses ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    remainingVal <= 5 ? 'bg-rose-500' : remainingVal <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="text-slate-500 text-[11px]">
                              Frequency: <strong className="text-slate-700">{m.frequency}</strong> • Daily Usage: <strong className="text-slate-700">{supp?.dailyUsage || 1} units/day</strong>
                              {supp?.notes && <span className="block text-slate-600 italic mt-0.5">{supp.notes}</span>}
                            </div>

                            <button
                              onClick={() => handleOpenRefillModal(m)}
                              disabled={Boolean(pendingRefill)}
                              className={`px-4 py-2 rounded-xl font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
                                pendingRefill
                                  ? 'bg-slate-100 text-slate-500 border border-slate-300 cursor-not-allowed'
                                  : 'bg-sky-600 hover:bg-sky-700 text-white'
                              }`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{pendingRefill ? `Refill ${pendingRefill.status} ✓` : 'Request Refill'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: REFILL REQUESTS AUDIT & HISTORY */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Refill Requests & Dispatch Tracking ({refillRequests.length})
                  </h3>
                </div>

                {refillRequests.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                    No active or historical refill requests found.
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Refill ID</th>
                            <th className="p-3.5">Medication</th>
                            <th className="p-3.5">Requested Units</th>
                            <th className="p-3.5">Clinician / Pharmacy</th>
                            <th className="p-3.5">Date Submitted</th>
                            <th className="p-3.5">Workflow Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {refillRequests.map((r: any) => {
                            const isCompleted = r.status === 'COMPLETED';
                            const isCancelled = r.status === 'CANCELLED';
                            const isProcessing = r.status === 'PROCESSING' || r.status === 'READY' || r.status === 'DISPATCHED';

                            return (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="p-3.5 font-mono font-bold text-sky-700">{r.refillRequestId}</td>
                                <td className="p-3.5 font-bold text-slate-900">{r.medicationName}</td>
                                <td className="p-3.5 font-bold">{r.quantityRequested} doses</td>
                                <td className="p-3.5 text-slate-600">
                                  <div>{r.doctorName || 'Dr. Ravi Kumar, MD'}</div>
                                  <div className="text-[10px] text-slate-400">{r.pharmacyName || 'Central Pharmacy'}</div>
                                </td>
                                <td className="p-3.5 text-slate-500">{r.requestedDate}</td>
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                    isCompleted
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isCancelled
                                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                                      : isProcessing
                                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                                      : 'bg-amber-100 text-amber-800 border-amber-300'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

{/* 18. VIEW: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Patient Profile Information</h2>
              <p className="text-xs text-slate-500 mt-1">Confidential demographic and clinical identity data</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl">
                  {patient?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{patient?.name}</h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded">
                    Patient ID: {patient?.patientId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><strong>Email:</strong> {patient?.email}</div>
                <div><strong>Phone:</strong> {patient?.phone}</div>
                <div><strong>Date of Birth:</strong> {patient?.dob}</div>
                <div><strong>Gender:</strong> {patient?.gender}</div>
                <div className="sm:col-span-2"><strong>Residential Address:</strong> {patient?.address}</div>
                <div><strong>Emergency Contact:</strong> {patient?.emergencyContact?.name} ({patient?.emergencyContact?.relationship})</div>
                <div><strong>Emergency Phone:</strong> {patient?.emergencyContact?.phone}</div>
                <div><strong>Registration Date:</strong> {patient?.registeredDate}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Discovery & Consultation Request Modal */}
      {showDoctorDiscovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Find a Doctor & Request Consultation</h3>
                <p className="text-xs text-slate-500">Search clinicians across Apollo Health Network.</p>
              </div>
              <button
                onClick={() => {
                  setShowDoctorDiscovery(false);
                  setSelectedDoctorForRequest(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or clinic..."
                value={discoveryQuery}
                onChange={(e) => {
                  setDiscoveryQuery(e.target.value);
                  handleSearchDiscovery(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
              />
            </div>

            {selectedDoctorForRequest ? (
              <form onSubmit={handleSubmitConsultationRequest} className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Request Consultation with {selectedDoctorForRequest.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorForRequest(null)}
                    className="text-slate-500 underline text-xs"
                  >
                    Change Doctor
                  </button>
                </div>
                <p className="text-slate-600">
                  {selectedDoctorForRequest.specialty} • {selectedDoctorForRequest.clinicName}
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Consultation *</label>
                  <textarea
                    rows={3}
                    required
                    value={consultationReason}
                    onChange={(e) => setConsultationReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                    placeholder="Describe symptoms or prescription renewal needs..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorForRequest(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Send Consultation Request
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {discoveredDoctors.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No doctors found matching criteria.</p>
                ) : (
                  discoveredDoctors.map((doc) => {
                    const isAlreadyConnected = myDoctors.some(
                      (d) => d.doctorId === doc.doctorId || d.id === doc.id
                    );

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50/40 transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {doc.doctorId}
                            </span>
                          </div>
                          <div className="text-sky-700 font-semibold mt-0.5">{doc.specialty}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {doc.clinicName} • {doc.location}
                          </div>
                        </div>

                        <div>
                          {isAlreadyConnected ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                              Connected
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedDoctorForRequest(doc)}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                            >
                              Request Consultation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Medical Report Modal */}
      {selectedReportForView && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700">{selectedReportForView.reportId}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedReportForView.testName}</h3>
              </div>
              <button
                onClick={() => setSelectedReportForView(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl">
              <div><strong>Facility:</strong> {selectedReportForView.labName}</div>
              <div><strong>Prescribed By:</strong> {selectedReportForView.doctorName}</div>
              <div><strong>Date:</strong> {selectedReportForView.testDate}</div>
              <div><strong>Status:</strong> <span className="font-bold text-emerald-600">{selectedReportForView.status}</span></div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Impression</span>
              <p className="font-bold text-slate-800 text-sm mt-1">{selectedReportForView.resultSummary}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detailed Quantitative Findings</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap mt-1">
                {selectedReportForView.detailedFindings}
              </pre>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900">
              {selectedReportForView.disclaimer}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`/api/reports/${selectedReportForView.reportId}/download`}
                download
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Document</span>
              </a>

              <button
                onClick={() => setSelectedReportForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sandbox Payment Modal */}
      {payModalOpen && selectedBillForPay && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500">{selectedBillForPay.billId}</span>
                <h3 className="font-bold text-slate-900 text-base">MedSafe Checkout (Sandbox)</h3>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-800 uppercase block">INVESTIGATION CHARGES</span>
                <span className="font-bold text-slate-800">{selectedBillForPay.items[0]?.description}</span>
              </div>
              <span className="text-xl font-black text-slate-900">₹{selectedBillForPay.totalAmount}</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Choose Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'CARD', 'NET_BANKING'] as const).map(method => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      paymentMethod === method
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Simulated VPA / UPI ID</label>
                <input
                  type="text"
                  value={payerUpi}
                  onChange={e => setPayerUpi(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Simulated test UPI endpoint (e.g. yourname@okaxis)</span>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Simulated Card Number</label>
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4242 (Test Card)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-xs text-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" disabled value="12/28" className="p-2 border border-slate-200 bg-slate-100 rounded-xl text-center font-mono" />
                  <input type="text" disabled value="•••" className="p-2 border border-slate-200 bg-slate-100 rounded-xl text-center font-mono" />
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Zero raw card data stored per PCI-DSS sandbox guidelines.</span>
              </div>
            )}

            <button
              onClick={handleExecutePayment}
              disabled={paying}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {paying ? 'Authorizing Sandbox Payment...' : `Pay ₹${selectedBillForPay.totalAmount} via ${paymentMethod}`}
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal */}
      {razorpayModalOpen && razorpayOrder && (
        <RazorpayCheckoutModal
          isOpen={razorpayModalOpen}
          order={razorpayOrder}
          type={razorpayPaymentType}
          referenceId={razorpayReferenceId}
          description={razorpayItemDescription}
          billingCycle={razorpayBillingCycle}
          onClose={() => setRazorpayModalOpen(false)}
          onSuccess={handleRazorpaySuccess}
          onFailure={(errMsg) => alert(errMsg)}
        />
      )}

      {/* Add Family Member Modal */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add Family Member</h3>
                <p className="text-[11px] text-slate-500">Zero additional fee under your active Family Plus Plan</p>
              </div>
              <button
                onClick={() => setShowAddFamilyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Sharma"
                  value={newFamilyMember.name}
                  onChange={e => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relationship *</label>
                <select
                  value={newFamilyMember.relationship}
                  onChange={e => setNewFamilyMember({ ...newFamilyMember, relationship: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newFamilyMember.phone}
                  onChange={e => setNewFamilyMember({ ...newFamilyMember, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. meera@example.com"
                  value={newFamilyMember.email}
                  onChange={e => setNewFamilyMember({ ...newFamilyMember, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-start space-x-2">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>No Additional Charge:</strong> Under Family Plus, up to 5 family members get full health monitoring without paying separately.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingFamilyMember}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {addingFamilyMember ? 'Enrolling...' : 'Enroll Family Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {receiptModalOpen && lastPaymentReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                ✓
              </div>
              <h3 className="font-black text-slate-900 text-lg">Payment Confirmed</h3>
              <p className="text-xs text-slate-500">Official MedSafe Healthcare Transaction Receipt</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 font-mono text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{lastPaymentReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-bold text-slate-900">{lastPaymentReceipt.transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bill ID:</span>
                <span className="font-bold text-slate-900">{lastPaymentReceipt.billId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-bold text-emerald-600 text-sm">₹{lastPaymentReceipt.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Mode:</span>
                <span className="font-bold text-indigo-700">{lastPaymentReceipt.gatewayMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span>{new Date(lastPaymentReceipt.paidAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
