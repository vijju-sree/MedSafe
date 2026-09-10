import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Patient,
  Medication,
  Prescription,
  SafetyAlert,
  FollowUpAction,
  AdherenceAnalytics,
  ConsultationRequest,
  DoctorSidebarTab,
  NotificationItem,
  TestOrder,
  MedicalReport
} from '../types';
import { DoctorSidebar } from '../components/DoctorSidebar';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  User,
  PlusCircle,
  FileText,
  Clock,
  AlertTriangle,
  History,
  CheckCircle2,
  Calendar,
  Pill,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Inbox,
  Users,
  Check,
  X,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Stethoscope,
  BadgeCheck,
  AlertCircle,
  ExternalLink,
  FileCheck,
  Bell,
  KeyRound,
  UserCircle,
  RefreshCw,
  ClipboardCheck,
  LayoutDashboard,
  FlaskConical,
  Tag,
  Download,
  Eye,
  Plus
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DoctorSidebarTab>('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PAT10001');
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
  const [doctorNotifications, setDoctorNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Response notes for consultation requests (keyed by request id)
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Modals state
  const [showAddMedModal, setShowAddMedModal] = useState<boolean>(false);
  const [showUpdatePlanModal, setShowUpdatePlanModal] = useState<boolean>(false);
  const [selectedMedForUpdate, setSelectedMedForUpdate] = useState<Medication | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);

  // Form states for Add Medication
  const [medName, setMedName] = useState<string>('Amoxicillin');
  const [medStrength, setMedStrength] = useState<string>('500 mg');
  const [medDosage, setMedDosage] = useState<string>('1');
  const [medFrequency, setMedFrequency] = useState<string>('TWICE_DAILY');
  const [medTime1, setMedTime1] = useState<string>('08:00');
  const [medTime2, setMedTime2] = useState<string>('20:00');
  const [medFood, setMedFood] = useState<string>('AFTER_FOOD');
  const [medInstructions, setMedInstructions] = useState<string>('Take with plenty of water');
  const [rxValidityDays, setRxValidityDays] = useState<number>(30);

  // Form states for Modify Plan
  const [updateDosage, setUpdateDosage] = useState<string>('');
  const [updateInstructions, setUpdateInstructions] = useState<string>('');
  const [updateReason, setUpdateReason] = useState<string>('Dosage adjusted based on follow-up clinical examination');

  // Form state for Follow-up
  const [followUpReason, setFollowUpReason] = useState<string>('Monitor response to adjusted regimen');
  const [followUpAction, setFollowUpAction] = useState<string>('Schedule consultation in 14 days');

  // Diagnostics & Investigation state
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [catalogue, setCatalogue] = useState<Array<{ testName: string; category: string; cost: number }>>([]);
  const [prescribeTestModalOpen, setPrescribeTestModalOpen] = useState<boolean>(false);
  const [prescribingTest, setPrescribingTest] = useState<boolean>(false);
  const [selectedReportForDoctor, setSelectedReportForDoctor] = useState<MedicalReport | null>(null);
  const [prescribeForm, setPrescribeForm] = useState({
    patientId: 'PAT10001',
    testName: 'CBC Blood Test (Complete Blood Count)',
    reason: 'Investigate baseline parameters and clinical follow-up',
    priority: 'ROUTINE',
    labId: 'LAB10001'
  });
  const [allRefills, setAllRefills] = useState<any[]>([]);

  const fetchAllRefills = async () => {
    try {
      const res = await api.getAllRefills();
      setAllRefills(res.refills || []);
    } catch (err) {
      console.error('Error fetching refills for doctor:', err);
    }
  };

  const handleUpdateDoctorRefill = async (id: string, status: string) => {
    try {
      await api.updateRefillStatus(id, { status, notes: `Status updated to ${status} by clinical provider` });
      setFeedback(`Refill request updated to ${status}!`);
      setTimeout(() => setFeedback(null), 3500);
      fetchAllRefills();
      if (selectedPatientId) {
        fetchPatientRecord(selectedPatientId);
      }
    } catch (err: any) {
      alert(`Error updating refill: ${err.message}`);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      const [ordersRes, reportsRes, catRes] = await Promise.all([
        api.getAllTestOrders(),
        api.getAllMedicalReports(),
        api.getTestCatalogue()
      ]);
      setTestOrders(ordersRes.testOrders || []);
      setMedicalReports(reportsRes.reports || []);
      setCatalogue(catRes.catalogue || []);
    } catch (err) {
      console.error('Error fetching diagnostic data for doctor:', err);
    }
  };

  const handlePrescribeTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrescribingTest(true);
    try {
      const res = await api.createTestOrder({
        patientId: prescribeForm.patientId,
        testName: prescribeForm.testName,
        reason: prescribeForm.reason,
        priority: prescribeForm.priority,
        labId: prescribeForm.labId
      });
      setFeedback(`Investigation ordered! Order #${res.testOrder.testOrderId} created & Bill #${res.bill.billId} generated.`);
      setTimeout(() => setFeedback(null), 5000);
      setPrescribeTestModalOpen(false);
      fetchDiagnostics();
    } catch (err: any) {
      alert(err.message || 'Failed to prescribe test order');
    } finally {
      setPrescribingTest(false);
    }
  };

  const fetchPatients = async (query: string = '') => {
    try {
      const res = await api.searchDoctorPatients(query);
      setPatients(res.patients || []);
      if (res.patients?.length > 0 && !res.patients.some((p: Patient) => p.patientId === selectedPatientId)) {
        setSelectedPatientId(res.patients[0].patientId);
      }
    } catch (err) {
      console.error('Error fetching authorized patients:', err);
    }
  };

  const fetchConsultationRequests = async () => {
    try {
      const res = await api.getDoctorConsultationRequests();
      setConsultationRequests(res.requests || []);
    } catch (err) {
      console.error('Error fetching doctor consultation requests:', err);
    }
  };

  const fetchPatientRecord = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await api.getDoctorPatientDetail(pid);
      setPatientRecord(res);
    } catch (err) {
      console.error('Error fetching patient clinical record:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(user.id);
      setDoctorNotifications(res.notifications || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchConsultationRequests();
    fetchNotifications();
    fetchDiagnostics();
    fetchAllRefills();
    const interval = setInterval(() => {
      fetchConsultationRequests();
      fetchNotifications();
      fetchDiagnostics();
      fetchAllRefills();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientRecord(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(searchQuery);
  };

  const handleRespondConsultation = async (requestId: string, action: 'ACCEPTED' | 'REJECTED') => {
    setRespondingId(requestId);
    try {
      const notes = responseNotes[requestId] || (action === 'ACCEPTED' ? 'Consultation approved. Active care relationship established.' : 'Doctor unavailable for this case.');
      await api.respondToConsultationRequest(requestId, action, notes);
      setFeedback(action === 'ACCEPTED' ? 'Consultation accepted! Patient added to your authorized panel.' : 'Consultation request rejected.');
      setTimeout(() => setFeedback(null), 4000);

      await fetchConsultationRequests();
      await fetchPatients();
    } catch (err: any) {
      alert('Error responding to request: ' + err.message);
    } finally {
      setRespondingId(null);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + rxValidityDays);

      const rxRes = await api.createPrescription({
        patientId: selectedPatientId,
        validFrom: todayStr,
        validUntil: validUntil.toISOString().split('T')[0],
        notes: 'Clinical order for ' + medName + ' ' + medStrength
      });

      const times = medFrequency === 'TWICE_DAILY' ? [medTime1, medTime2] : [medTime1];
      await api.addMedication({
        patientId: selectedPatientId,
        prescriptionId: rxRes.prescription.prescriptionId,
        name: medName,
        genericName: medName,
        strength: medStrength,
        dosageAmount: medDosage,
        dosageUnit: 'tablet',
        form: 'Tablet',
        frequency: medFrequency,
        scheduleTimes: times,
        startDate: todayStr,
        endDate: validUntil.toISOString().split('T')[0],
        instructions: medInstructions,
        foodInstruction: medFood,
        totalQuantity: 30
      });

      setFeedback('Medication "' + medName + '" and schedule created successfully.');
      setTimeout(() => setFeedback(null), 3000);
      setShowAddMedModal(false);
      fetchPatientRecord(selectedPatientId);
    } catch (err: any) {
      alert('Error creating medication: ' + err.message);
    }
  };

  const openUpdatePlan = (med: Medication) => {
    setSelectedMedForUpdate(med);
    setUpdateDosage(med.dosageAmount);
    setUpdateInstructions(med.instructions);
    setShowUpdatePlanModal(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForUpdate) return;
    try {
      const res = await api.updateMedicationPlan(selectedMedForUpdate.id, {
        dosageAmount: updateDosage,
        instructions: updateInstructions,
        reason: updateReason
      });

      setFeedback('Medication plan updated to Version ' + res.planVersion + '. Patient notified.');
      setTimeout(() => setFeedback(null), 4000);
      setShowUpdatePlanModal(false);
      fetchPatientRecord(selectedPatientId);
    } catch (err: any) {
      alert('Error updating plan: ' + err.message);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addFollowUp({
        patientId: selectedPatientId,
        reason: followUpReason,
        actionRequired: followUpAction
      });
      setFeedback('Follow-up recommendation logged and sent to patient.');
      setTimeout(() => setFeedback(null), 3000);
      setShowFollowUpModal(false);
      fetchPatientRecord(selectedPatientId);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRenewPrescription = async (rxId: string) => {
    try {
      await api.renewPrescription(rxId, { additionalDays: 30, notes: 'Doctor authorized 30-day renewal' });
      setFeedback('Prescription renewed for 30 days.');
      setTimeout(() => setFeedback(null), 3000);
      fetchPatientRecord(selectedPatientId);
    } catch (err: any) {
      alert('Error renewing prescription: ' + err.message);
    }
  };

  const pendingRequestsCount = consultationRequests.filter(r => r.status === 'PENDING').length;
  const currentPatient = patientRecord?.patient || patients.find(p => p.patientId === selectedPatientId);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Authorized Patients</span>
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{patients.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Under active clinical care</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
                  <Inbox className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600 mt-2">{pendingRequestsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Patient consultation requests</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Selected Adherence</span>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-indigo-600 mt-2">
                  {patientRecord?.analytics?.adherencePercentage ?? 100}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{currentPatient?.name || 'Selected Patient'}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Flagged Safety Signals</span>
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600 mt-2">
                  {patientRecord?.safetyAlerts?.length || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Requires clinical evaluation</div>
              </div>
            </div>

            {pendingRequestsCount > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      {pendingRequestsCount} New Patient Consultation Request{pendingRequestsCount > 1 ? 's' : ''} Pending
                    </h4>
                    <p className="text-[11px] text-amber-700">
                      Patients have registered and requested care. Accept requests to authorize medical charts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('consultation-requests')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Review Requests
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-xs">
                    {currentPatient?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-black text-slate-900">{currentPatient?.name || 'No Patient Selected'}</h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {selectedPatientId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentPatient?.gender} • DOB: {currentPatient?.dob} • Phone: {currentPatient?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold focus:bg-white"
                  >
                    {patients.map(p => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.name} ({p.patientId})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowAddMedModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Medication</span>
                  </button>

                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Log Follow-Up</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Active Regimen</h3>
                  <button
                    onClick={() => setActiveTab('medication-plans')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <span>View All Plans & History</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {patientRecord?.medications && patientRecord.medications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patientRecord.medications.slice(0, 4).map((med: Medication) => (
                      <div key={med.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">{med.name} {med.strength}</span>
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              v{med.version || 1}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {med.dosageAmount} {med.dosageUnit} • {med.frequency} • {med.scheduleTimes?.join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{med.instructions}</div>
                        </div>
                        <button
                          onClick={() => openUpdatePlan(med)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-1 rounded-lg border border-slate-200"
                        >
                          Modify
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No active medications currently configured for this patient.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'my-patients':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Authorized Clinical Panel</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict medical privacy boundary: Only patients with active consultation consent appear in your directory.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search patient name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Filter
                  </button>
                </form>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.map((p) => {
                  const isSelected = selectedPatientId === p.patientId;
                  return (
                    <div
                      key={p.patientId}
                      className={`p-5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {p.patientId}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active Care
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Gender / DOB</span>
                          {p.gender} • {p.dob}
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Contact</span>
                          {p.phone}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Registered: {p.registeredDate}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedPatientId(p.patientId);
                            setActiveTab('medication-plans');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1"
                        >
                          <span>Open Chart</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'consultation-requests':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Patient Consultation Requests</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patients who registered and discovered your profile request clinical consultations and prescriptions here.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {consultationRequests.length} Total Requests
                </span>
              </div>

              {consultationRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm text-slate-600">No consultation requests at this time</p>
                  <p className="text-xs text-slate-400 mt-1">When new patients request care, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultationRequests.map((req) => {
                    const isPending = req.status === 'PENDING';
                    const isAccepted = req.status === 'ACCEPTED';
                    return (
                      <div
                        key={req.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isPending
                            ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-100'
                            : isAccepted
                            ? 'bg-white border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isPending ? 'bg-amber-600 text-white' : isAccepted ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                            }`}>
                              {req.patientName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-slate-900 text-sm">{req.patientName}</h3>
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                  {req.patientId}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-3 mt-0.5">
                                <span className="flex items-center space-x-1"><Mail className="w-3 h-3 text-slate-400" /><span>{req.patientEmail}</span></span>
                                <span className="flex items-center space-x-1"><Phone className="w-3 h-3 text-slate-400" /><span>{req.patientPhone}</span></span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                            isPending ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            isAccepted ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {req.status === 'PENDING' ? 'Action Required: Pending' : req.status}
                          </span>
                        </div>

                        <div className="mt-3 p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs">
                          <span className="font-bold text-slate-700 block mb-0.5">Consultation & Prescription Request:</span>
                          <p className="text-slate-600">{req.reason}</p>
                          <div className="mt-1 text-[10px] text-slate-400 flex items-center space-x-2">
                            <span>Requested at: {new Date(req.requestedAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>Clinic: {req.clinicName}</span>
                          </div>
                        </div>

                        {isPending ? (
                          <div className="mt-4 pt-3 border-t border-amber-200/80 space-y-2">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Clinical Response Notes for Patient:
                            </label>
                            <input
                              type="text"
                              value={responseNotes[req.id] || ''}
                              onChange={(e) => setResponseNotes({ ...responseNotes, [req.id]: e.target.value })}
                              placeholder="e.g. Accepted. Please visit the clinic tomorrow for initial baseline tests."
                              className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-white"
                            />
                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <button
                                disabled={respondingId === req.id}
                                onClick={() => handleRespondConsultation(req.id, 'REJECTED')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                              >
                                Decline
                              </button>
                              <button
                                disabled={respondingId === req.id}
                                onClick={() => handleRespondConsultation(req.id, 'ACCEPTED')}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Consultation & Add to Panel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Notes: {req.notes || 'No specific notes recorded'}</span>
                            {req.respondedAt && (
                              <span className="text-[10px] text-slate-400">
                                Responded: {new Date(req.respondedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'medication-plans':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Medication Regimen & Version Control</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Managing plan for: <span className="font-bold text-slate-800">{currentPatient?.name} ({selectedPatientId})</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                  >
                    {patients.map(p => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.name} ({p.patientId})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowAddMedModal(true)}
                    className="flex items-center space-x-1 px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Drug</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {patientRecord?.medications?.map((med: Medication) => (
                  <div key={med.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">{med.name} {med.strength}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          Plan v{med.version || 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${med.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {med.prescriptionStatus}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        Dosage: {med.dosageAmount} {med.dosageUnit} • Frequency: {med.frequency} • Schedule: {med.scheduleTimes?.join(', ')}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Instructions: {med.instructions} • Food Rule: {med.foodInstruction}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => openUpdatePlan(med)}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-xs transition-colors"
                      >
                        Modify Plan (v{(med.version || 1) + 1})
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {patientRecord?.planHistory && patientRecord.planHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Medication Plan Version Audit Trail</h3>
                  </div>

                  <div className="space-y-2">
                    {patientRecord.planHistory.map((h: any) => (
                      <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Version {h.version} • {h.changeType}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(h.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-600">
                          <strong>Changed by:</strong> {h.changedByName} ({h.changedByRole})
                        </div>
                        <div className="mt-0.5 text-slate-600">
                          <strong>Clinical Reason:</strong> {h.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'prescriptions':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Prescription Orders</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized electronic prescriptions for {currentPatient?.name} ({selectedPatientId})
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMedModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  + Issue New Prescription
                </button>
              </div>

              <div className="space-y-3">
                {patientRecord?.prescriptions?.map((rx: Prescription) => (
                  <div key={rx.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{rx.prescriptionId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rx.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          rx.status === 'EXPIRING' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {rx.status}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        Validity Range: {rx.validFrom} to {rx.validUntil}
                      </div>
                      <div className="text-slate-500 mt-0.5">{rx.notes}</div>
                    </div>

                    <button
                      onClick={() => handleRenewPrescription(rx.id)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      Renew (+30 Days)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tests-investigations':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Diagnostic Tests & Investigations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prescribe laboratory assays and track real-time sample collection and processing.
                  </p>
                </div>
                <button
                  onClick={() => setPrescribeTestModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Prescribe Investigation</span>
                </button>
              </div>

              <div className="grid gap-3">
                {testOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No diagnostic investigations ordered yet.</div>
                ) : (
                  testOrders.map(order => (
                    <div key={order.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-indigo-700">{order.testOrderId}</span>
                          <span className="font-bold text-slate-900 text-sm">{order.testName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {order.priority}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-slate-600">
                          <div>Patient: <strong>{order.patientName}</strong> ({order.patientId})</div>
                          <div>Facility: <strong>{order.labName}</strong></div>
                          <div>Cost: <strong>₹{order.cost}</strong></div>
                          <div>Reason: <span>{order.reason}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'SAMPLE_COLLECTED' ? 'bg-sky-100 text-sky-800' :
                          order.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={() => setActiveTab('medical-reports')}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px]"
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
          </div>
        );

      case 'medical-reports':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Patient Diagnostic Reports</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published laboratory and radiological reports available for physician review.
                </p>
              </div>

              <div className="grid gap-4">
                {medicalReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No diagnostic reports uploaded yet.</div>
                ) : (
                  medicalReports.map(rep => (
                    <div key={rep.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {rep.reportId}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{rep.testName}</h4>
                          </div>
                          <p className="text-slate-500 mt-1">
                            Patient: <strong>{rep.patientName}</strong> ({rep.patientId}) • Facility: {rep.labName} • Date: {rep.testDate}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedReportForDoctor(rep)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Clinical Review</span>
                          </button>
                          <a
                            href={`/api/reports/${rep.reportId}/download`}
                            download
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Official File</span>
                          </a>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">IMPRESSION</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{rep.resultSummary}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                        {rep.detailedFindings}
                      </div>

                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Pathologist: <strong>{rep.performedBy}</strong></span>
                        <span>Published: {new Date(rep.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'adherence':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Patient Adherence Analytics</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous adherence tracking for {currentPatient?.name} ({selectedPatientId})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-xs font-semibold text-slate-500">Adherence Percentage</span>
                  <div className="text-3xl font-black text-indigo-700 mt-2">
                    {patientRecord?.analytics?.adherencePercentage ?? 100}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Target threshold: 85%</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500">Intake Breakdown</span>
                  <div className="text-xs font-bold text-slate-800 mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>On-Time:</span>
                      <span className="text-emerald-600">{patientRecord?.analytics?.takenOnTime ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Intakes:</span>
                      <span className="text-amber-600">{patientRecord?.analytics?.takenLate ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missed Doses:</span>
                      <span className="text-rose-600">{patientRecord?.analytics?.missed ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500">Clinical Risk Level</span>
                  <div className={`text-xl font-black mt-2 uppercase ${
                    patientRecord?.analytics?.riskScore === 'HIGH' ? 'text-rose-600' :
                    patientRecord?.analytics?.riskScore === 'MEDIUM' ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>
                    {patientRecord?.analytics?.riskScore || 'LOW'} RISK
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {patientRecord?.analytics?.riskRationale || 'Adherence within safe therapeutic boundaries'}
                  </div>
                </div>
              </div>

              {patientRecord?.analytics?.medicationBreakdown && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Medication Breakdown</h3>
                  <div className="space-y-2">
                    {patientRecord.analytics.medicationBreakdown.map((b: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800">{b.medicationName}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-500">{b.taken} taken / {b.missed} missed</span>
                          <span className="font-black text-indigo-700">{b.adherence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'safety-alerts':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Clinical Safety Intelligence</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated drug interaction, timing conflict, and therapeutic monitoring signals.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Non-Diagnostic Clinical Safety Boundary</h4>
                  <p className="mt-0.5 text-amber-800">
                    "Possible concern detected — professional review recommended. This is a safety-support signal, not a medical diagnosis. Please consult before making medication changes."
                  </p>
                </div>
              </div>

              {patientRecord?.safetyAlerts && patientRecord.safetyAlerts.length > 0 ? (
                <div className="space-y-3">
                  {patientRecord.safetyAlerts.map((alert: SafetyAlert) => (
                    <div key={alert.id} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 text-sm">{alert.title}</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          {alert.severity} SEVERITY
                        </span>
                      </div>
                      <p className="text-slate-700">{alert.description}</p>
                      <div className="p-2.5 bg-white rounded-xl border border-rose-100 text-slate-800 font-semibold">
                        Clinical Recommendation: {alert.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No Active Safety Concerns</p>
                  <p className="text-xs text-slate-400 mt-1">All prescribed regimens comply with safe therapeutic guidelines.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'refill-renewal':
        return (
          <div className="space-y-6">
            {/* Patient Refill Requests Queue */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Patient Refill Requests Queue</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live refill requests submitted by patients. Approving and marking completed will automatically replenish supply records.
                  </p>
                </div>
                <button
                  onClick={fetchAllRefills}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {allRefills.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No refill requests currently pending in queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {allRefills.map((refill: any) => {
                    const isReq = refill.status === 'REQUESTED';
                    const isAppr = refill.status === 'APPROVED';
                    const isComp = refill.status === 'COMPLETED';

                    return (
                      <div
                        key={refill.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {refill.requestNumber || refill.id}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">{refill.medicationName}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isComp
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isAppr
                                  ? 'bg-sky-100 text-sky-800'
                                  : isReq
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {refill.status}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            Patient ID: <strong>{refill.patientId}</strong> • Quantity: <strong>{refill.quantityRequested || 30} units</strong> • Requested: {new Date(refill.createdAt).toLocaleDateString()}
                          </div>
                          {refill.patientNotes && (
                            <div className="text-[11px] text-slate-500 italic">
                              "{refill.patientNotes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {isReq && (
                            <button
                              onClick={() => handleUpdateDoctorRefill(refill.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors"
                            >
                              Approve Request
                            </button>
                          )}
                          {(isReq || isAppr) && (
                            <button
                              onClick={() => handleUpdateDoctorRefill(refill.id, 'COMPLETED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                            >
                              Dispense & Complete
                            </button>
                          )}
                          {isComp && (
                            <span className="text-emerald-700 font-bold flex items-center space-x-1 text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Dispensed & Restocked</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prescription Renewal Authorization */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Prescription 30-Day Renewal</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize active prescriptions to extend therapeutic duration by 30 days.
                </p>
              </div>

              <div className="space-y-3">
                {patientRecord?.prescriptions?.map((rx: Prescription) => (
                  <div key={rx.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{rx.prescriptionId}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Valid Until: {rx.validUntil}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">{rx.notes}</p>
                    </div>
                    <button
                      onClick={() => handleRenewPrescription(rx.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                    >
                      Authorize Renewal (+30d)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'follow-up':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Follow-Up Action Tracker</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clinical follow-up milestones for {currentPatient?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  + Log Follow-Up
                </button>
              </div>

              <div className="space-y-3">
                {patientRecord?.followUps?.map((fu: FollowUpAction) => (
                  <div key={fu.id} className="p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{fu.reason}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {fu.status}
                      </span>
                    </div>
                    <div className="text-slate-600">Action: {fu.actionRequired}</div>
                    <div className="text-[10px] text-slate-400">Created: {new Date(fu.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Doctor Clinical Notifications</h2>
                <p className="text-xs text-slate-500 mt-0.5">Alerts regarding consultations, missed doses, and refill events.</p>
              </div>

              <div className="space-y-2">
                {doctorNotifications.length > 0 ? (
                  doctorNotifications.map(n => (
                    <div key={n.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">No new notifications.</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'access-consent':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Consent & Access Authorizations</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified patient privacy consent grants empowering your medical access.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold">HIPAA & Digital Health Consent Compliance</h4>
                  <p className="text-emerald-700 mt-0.5">
                    All patient clinical records in your panel have explicit digital consent records timestamped in the audit log.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {patients.map(p => (
                  <div key={p.patientId} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{p.name} ({p.patientId})</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">Scope: Full Clinical Access (Medications, Schedules, Adherence)</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ACTIVE CONSENT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{user?.name || 'Dr. Ravi Kumar, MD'}</h2>
                  <p className="text-xs font-semibold text-indigo-600">Consultant Physician & Cardiometabolic Specialist</p>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 mt-1 inline-block">
                    Doctor ID: {user?.doctorId || 'DOC10001'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">Medical Credentials</span>
                  <div className="text-slate-600">Registration: MCI-AP-49201</div>
                  <div className="text-slate-600">Specialization: Internal Medicine, Chronic Care Coordination</div>
                  <div className="text-slate-600">Experience: 14 Years Clinical Practice</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">Clinic Affiliation</span>
                  <div className="text-slate-600">Primary: Apollo Medical Center, Hyderabad</div>
                  <div className="text-slate-600">Secondary: Swarnandhra Health Hub</div>
                  <div className="text-slate-600">OPD Hours: Mon - Sat (09:00 - 17:00)</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {feedback && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <DoctorSidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          doctorName={user?.name || 'Dr. Ravi Kumar, MD'}
          specialty="Internal Medicine & Adherence Specialist"
          doctorId={user?.doctorId || 'DOC10001'}
          pendingRequestsCount={pendingRequestsCount}
          patientsCount={patients.length}
        />

        <div className="flex-1 min-w-0 w-full">
          {renderTabContent()}
        </div>
      </div>

      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Add New Medication & Prescription</h3>
            <p className="text-xs text-slate-500">
              Prescribing for patient: <strong className="text-slate-800">{currentPatient?.name} ({selectedPatientId})</strong>
            </p>

            <form onSubmit={handleAddMedication} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={medStrength}
                    onChange={(e) => setMedStrength(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Amount</label>
                  <input
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  >
                    <option value="DAILY">Once Daily</option>
                    <option value="TWICE_DAILY">Twice Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Food Instruction</label>
                  <select
                    value={medFood}
                    onChange={(e) => setMedFood(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  >
                    <option value="AFTER_FOOD">After Food</option>
                    <option value="BEFORE_FOOD">Before Food</option>
                    <option value="WITH_FOOD">With Food</option>
                    <option value="NO_RESTRICTION">No Restriction</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dose 1 Time (HH:MM)</label>
                  <input
                    type="time"
                    value={medTime1}
                    onChange={(e) => setMedTime1(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  />
                </div>
                {medFrequency === 'TWICE_DAILY' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dose 2 Time (HH:MM)</label>
                    <input
                      type="time"
                      value={medTime2}
                      onChange={(e) => setMedTime2(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prescription Validity (Days)</label>
                <input
                  type="number"
                  value={rxValidityDays}
                  onChange={(e) => setRxValidityDays(parseInt(e.target.value, 10))}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Save & Generate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdatePlanModal && selectedMedForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Modify Medication Plan: {selectedMedForUpdate.name}
            </h3>
            <p className="text-xs text-slate-500">
              Changes will create Plan Version {(selectedMedForUpdate.version || 1) + 1} and preserve full clinical audit history.
            </p>

            <form onSubmit={handleUpdatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Dosage Amount</label>
                <input
                  type="text"
                  value={updateDosage}
                  onChange={(e) => setUpdateDosage(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Updated Instructions</label>
                <input
                  type="text"
                  value={updateInstructions}
                  onChange={(e) => setUpdateInstructions(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Modification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  placeholder="Clinical rationale for update..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdatePlanModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Update Plan (Create v{(selectedMedForUpdate.version || 1) + 1})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Log Clinical Follow-Up</h3>
            <p className="text-xs text-slate-500">
              For: <strong className="text-slate-800">{currentPatient?.name} ({selectedPatientId})</strong>
            </p>

            <form onSubmit={handleAddFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Required</label>
                <input
                  type="text"
                  required
                  value={followUpAction}
                  onChange={(e) => setFollowUpAction(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Save Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescribe Diagnostic Investigation Modal */}
      {prescribeTestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  🧪
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Prescribe Diagnostic Investigation</h3>
                  <p className="text-[11px] text-slate-500">Order lab tests and radiological scans with auto-billing</p>
                </div>
              </div>
              <button
                onClick={() => setPrescribeTestModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePrescribeTest} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={prescribeForm.patientId}
                  onChange={e => setPrescribeForm({ ...prescribeForm, patientId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.patientId}>
                      {p.name} ({p.patientId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Diagnostic Investigation</label>
                <select
                  value={prescribeForm.testName}
                  onChange={e => setPrescribeForm({ ...prescribeForm, testName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  required
                >
                  {catalogue.length > 0 ? (
                    catalogue.map((cat, idx) => (
                      <option key={idx} value={cat.testName}>
                        {cat.testName} (₹{cat.cost})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CBC Blood Test (Complete Blood Count)">CBC Blood Test (Complete Blood Count) (₹450)</option>
                      <option value="Chest X-Ray (PA View)">Chest X-Ray (PA View) (₹750)</option>
                      <option value="Lipid Profile (Cholesterol & Triglycerides)">Lipid Profile (Cholesterol & Triglycerides) (₹650)</option>
                      <option value="12-Lead Electrocardiogram (ECG)">12-Lead Electrocardiogram (ECG) (₹400)</option>
                      <option value="HbA1c (Glycated Hemoglobin)">HbA1c (Glycated Hemoglobin) (₹550)</option>
                      <option value="Liver Function Test (LFT)">Liver Function Test (LFT) (₹700)</option>
                      <option value="Kidney Function Test (KFT/RFT)">Kidney Function Test (KFT/RFT) (₹750)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={prescribeForm.priority}
                    onChange={e => setPrescribeForm({ ...prescribeForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="ROUTINE">ROUTINE (Within 24-48 hrs)</option>
                    <option value="URGENT">URGENT (Same Day)</option>
                    <option value="STAT">STAT (Immediate / Critical)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diagnostic Laboratory</label>
                  <select
                    value={prescribeForm.labId}
                    onChange={e => setPrescribeForm({ ...prescribeForm, labId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="LAB10001">Apex Diagnostic Center (Accredited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Indication / Reason</label>
                <textarea
                  rows={2}
                  required
                  value={prescribeForm.reason}
                  onChange={e => setPrescribeForm({ ...prescribeForm, reason: e.target.value })}
                  placeholder="e.g. Rule out iron deficiency anemia, baseline quarterly review"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] text-indigo-900">
                <strong>Coordination Note:</strong> Submitting will create a live accession order at Apex Diagnostics and generate an itemized bill for the patient.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPrescribeTestModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prescribingTest}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {prescribingTest ? 'Ordering...' : 'Confirm Test Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Diagnostic Report Modal */}
      {selectedReportForDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedReportForDoctor.reportId}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{selectedReportForDoctor.testName}</h3>
              </div>
              <button
                onClick={() => setSelectedReportForDoctor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl">
              <div><strong>Patient:</strong> {selectedReportForDoctor.patientName} ({selectedReportForDoctor.patientId})</div>
              <div><strong>Facility:</strong> {selectedReportForDoctor.labName}</div>
              <div><strong>Date of Test:</strong> {selectedReportForDoctor.testDate}</div>
              <div><strong>Status:</strong> <span className="font-bold text-emerald-600">{selectedReportForDoctor.status}</span></div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Impression</span>
              <p className="font-bold text-slate-800 text-sm mt-1">{selectedReportForDoctor.resultSummary}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantitative Findings & Reference Ranges</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap mt-1">
                {selectedReportForDoctor.detailedFindings}
              </pre>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900">
              {selectedReportForDoctor.disclaimer}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`/api/reports/${selectedReportForDoctor.reportId}/download`}
                download
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Report</span>
              </a>

              <button
                onClick={() => setSelectedReportForDoctor(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
