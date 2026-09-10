import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserCheck,
  UserPlus,
  Stethoscope,
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertCircle,
  Shield,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Pill,
  CreditCard,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requests' | 'patients' | 'register' | 'doctors' | 'reports' | 'profile'
  >('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Search & Link Global Patient
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState<boolean>(false);
  const [linkingPatientId, setLinkingPatientId] = useState<string | null>(null);

  // New Patient Direct Intake Form
  const [showNewPatientForm, setShowNewPatientForm] = useState<boolean>(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    password: 'password123',
    dob: '1995-06-15',
    gender: 'FEMALE',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Family'
  });
  const [creatingPatient, setCreatingPatient] = useState<boolean>(false);

  // Modals
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetail, setPatientDetail] = useState<any>(null);
  const [loadingPatientDetail, setLoadingPatientDetail] = useState<boolean>(false);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<any>(null);
  const [loadingReportDetail, setLoadingReportDetail] = useState<boolean>(false);

  // Action status feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, reqsRes, patientsRes, docsRes, reportsRes] = await Promise.all([
        api.getReceptionistDashboard().catch(() => null),
        api.getReceptionistRequests().catch(() => ({ requests: [] })),
        api.getReceptionistPatients().catch(() => ({ patients: [] })),
        api.getReceptionistDoctors().catch(() => ({ doctors: [] })),
        api.getReceptionistReports().catch(() => ({ reports: [] }))
      ]);

      if (dashRes) setDashboardData(dashRes);
      setRequests(reqsRes?.requests || []);
      setPatients(patientsRes?.patients || []);
      setDoctors(docsRes?.doctors || []);
      setReports(reportsRes?.reports || []);
    } catch (err: any) {
      console.error('Failed to load receptionist data:', err);
      showFeedback(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Handle Accept/Reject Consultation Request
  const handleRespondRequest = async (requestId: string, action: 'ACCEPTED' | 'REJECTED') => {
    setProcessingRequestId(requestId);
    try {
      const res = await api.respondReceptionistRequest(requestId, action, `Processed by Receptionist ${user?.name || ''}`);
      showFeedback(`Request successfully ${action === 'ACCEPTED' ? 'Accepted' : 'Rejected'}. Patient added to hospital.`);
      // Reload relevant data
      loadAllData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to process request', 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Search MedSafe Network Patients
  const handleSearchGlobal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    setSearchingGlobal(true);
    try {
      const res = await api.searchGlobalPatient(globalSearchQuery.trim());
      setGlobalSearchResults(res.patients || []);
      if (!res.patients || res.patients.length === 0) {
        showFeedback('No matching patient found in MedSafe network.', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Search failed', 'error');
    } finally {
      setSearchingGlobal(false);
    }
  };

  // Link Patient to Hospital
  const handleLinkPatient = async (patientId: string) => {
    setLinkingPatientId(patientId);
    try {
      await api.linkPatientToHospital(patientId, 'Linked by Receptionist via global search');
      showFeedback('Patient successfully linked to your hospital!');
      // Update local search results
      setGlobalSearchResults(prev =>
        prev.map(p => (p.patientId === patientId ? { ...p, isLinked: true } : p))
      );
      loadAllData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to link patient', 'error');
    } finally {
      setLinkingPatientId(null);
    }
  };

  // Direct Intake New Patient
  const handleCreateNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPatient(true);
    try {
      const res = await api.registerPatient(newPatientData);
      const newPatId = res.patient?.patientId || res.user?.patientId;
      if (newPatId) {
        await api.linkPatientToHospital(newPatId, 'New intake directly registered at reception');
      }
      showFeedback(`Patient registered successfully with ID ${newPatId || ''} and linked to hospital!`);
      setShowNewPatientForm(false);
      setNewPatientData({
        name: '',
        email: '',
        password: 'password123',
        dob: '1995-06-15',
        gender: 'FEMALE',
        phone: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: 'Family'
      });
      loadAllData();
      setActiveTab('patients');
    } catch (err: any) {
      showFeedback(err.message || 'Failed to register patient', 'error');
    } finally {
      setCreatingPatient(false);
    }
  };

  // View Patient Details Modal
  const openPatientDetail = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setLoadingPatientDetail(true);
    try {
      const detail = await api.getReceptionistPatientDetail(patientId);
      setPatientDetail(detail);
    } catch (err: any) {
      showFeedback(err.message || 'Could not load patient operational record', 'error');
      setSelectedPatientId(null);
    } finally {
      setLoadingPatientDetail(false);
    }
  };

  // View Report Modal (Read-Only)
  const openReportDetail = async (reportId: string) => {
    setSelectedReportId(reportId);
    setLoadingReportDetail(true);
    try {
      const detail = await api.getReceptionistReportDetail(reportId);
      setReportDetail(detail);
    } catch (err: any) {
      showFeedback(err.message || 'Could not load report detail (Access Restricted)', 'error');
      setSelectedReportId(null);
    } finally {
      setLoadingReportDetail(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pastRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner & Multi-Tenant Organization Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {user?.hospitalName || dashboardData?.hospital?.name || 'Hospital Reception Desk'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wide">
                  {user?.hospitalId || dashboardData?.hospital?.hospitalId || 'HOSP-00125'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                <span>Reception Staff: <strong className="text-slate-800">{user?.name || 'Receptionist'}</strong></span>
                <span>•</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                  {user?.receptionistId || 'REC-0018'}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 inline" /> Multi-Tenant Isolated Portal
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Refresh */}
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-sm flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add / Intake Patient</span>
            </button>
          </div>
        </div>

        {/* Non-Clinical Role Notice */}
        <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold">Administrative & Operational Access Only:</strong> Hospital receptionists coordinate patient requests, intake, registration, and view operational records. Clinical decisions, dosage changes, and electronic prescriptions are strictly restricted to verified doctors.
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Building2 },
          {
            id: 'requests',
            label: `Patient Requests (${pendingRequests.length})`,
            icon: Clock,
            badge: pendingRequests.length > 0 ? pendingRequests.length : undefined
          },
          { id: 'patients', label: `Hospital Patients (${patients.length})`, icon: Users },
          { id: 'register', label: 'Add / Register Patient', icon: UserPlus },
          { id: 'doctors', label: `Hospital Doctors (${doctors.length})`, icon: Stethoscope },
          { id: 'reports', label: `Reports (${reports.length})`, icon: FileText },
          { id: 'profile', label: 'Hospital Profile', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-sky-700' : 'bg-rose-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Hospital Patients</p>
                <p className="text-2xl font-black text-slate-900">{patients.length}</p>
                <p className="text-[11px] text-slate-400">Linked to this hospital</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Pending Requests</p>
                <p className="text-2xl font-black text-amber-600">{pendingRequests.length}</p>
                <p className="text-[11px] text-slate-400">Awaiting acceptance</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Hospital Doctors</p>
                <p className="text-2xl font-black text-emerald-600">{doctors.length}</p>
                <p className="text-[11px] text-slate-400">Verified Council IDs</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Patient Reports</p>
                <p className="text-2xl font-black text-purple-600">{reports.length}</p>
                <p className="text-[11px] text-slate-400">Diagnostic records</p>
              </div>
            </div>
          </div>

          {/* Pending Patient Requests Action List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Urgent Patient Connection Requests</h3>
                <p className="text-xs text-slate-500">
                  Patients requesting consultations with {user?.hospitalName || 'our'} doctors
                </p>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
              >
                View all ({requests.length}) →
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending requests. All incoming patients are processed!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{req.patientName}</span>
                        <span className="text-[11px] font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                          {req.patientId}
                        </span>
                        <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                          PENDING
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Doctor Requested: <strong className="text-slate-800">{req.doctorName}</strong>
                      </p>
                      {req.reason && (
                        <p className="text-xs text-slate-500 italic mt-0.5">"{req.reason}"</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Requested: {new Date(req.createdAt || req.requestedDate).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'ACCEPTED')}
                        disabled={processingRequestId === req.id}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Patient</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, 'REJECTED')}
                        disabled={processingRequestId === req.id}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Doctor Roster Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hospital Doctors & Council IDs</h3>
                <p className="text-xs text-slate-500">
                  Affiliated physicians at {user?.hospitalName || 'this hospital'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
              >
                View full directory →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                      <p className="text-[11px] text-sky-700 font-semibold">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
                    <p className="text-slate-600">
                      Council ID: <strong className="font-mono text-slate-800">{doc.councilRegistrationId || 'N/A'}</strong>
                    </p>
                    <p className="text-slate-500">
                      Active Patients: <strong className="text-slate-800">{doc.patients?.length || 0}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT REQUESTS QUEUE */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Patient Consultation & Affiliation Requests</h2>
              <p className="text-xs text-slate-500">
                Review and approve patient requests for {user?.hospitalName || 'this hospital'}. Accepting links the patient and creates doctor-patient relationships.
              </p>
            </div>

            {/* Pending Requests Section */}
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Pending Requests ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl mb-6">
                No pending requests.
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{req.patientName}</span>
                        <span className="text-xs font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                          {req.patientId}
                        </span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          PENDING
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Doctor Requested: <strong className="text-slate-900">{req.doctorName}</strong>
                      </p>
                      {req.reason && (
                        <p className="text-xs text-slate-500 italic mt-0.5">Reason: "{req.reason}"</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Date: {new Date(req.createdAt || req.requestedDate).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'ACCEPTED')}
                        disabled={processingRequestId === req.id}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, 'REJECTED')}
                        disabled={processingRequestId === req.id}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Requests Section */}
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Processed History ({pastRequests.length})
            </h3>
            {pastRequests.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No past request history.
              </div>
            ) : (
              <div className="space-y-2">
                {pastRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 mr-2">{req.patientName}</span>
                      <span className="font-mono text-slate-500 mr-3">{req.patientId}</span>
                      <span className="text-slate-600">→ Dr. {req.doctorName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] text-slate-400">
                        {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HOSPITAL PATIENTS DIRECTORY */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Hospital Patient Directory</h2>
                <p className="text-xs text-slate-500">
                  Patients registered or linked to {user?.hospitalName || 'this hospital'}
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by name, ID, phone..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No patients found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Patient ID</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Demographics</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Assigned Doctors</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map(pat => (
                      <tr key={pat.patientId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-sky-700">{pat.patientId}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{pat.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {pat.age ? `${pat.age} yrs` : 'N/A'} • {pat.gender || 'N/A'}
                          {pat.bloodGroup && <span className="ml-1.5 font-semibold text-rose-600">({pat.bloodGroup})</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {pat.phone || pat.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {pat.assignedDoctors && pat.assignedDoctors.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pat.assignedDoctors.map((d: any, idx: number) => (
                                <span key={idx} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {d.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openPatientDetail(pat.patientId)}
                            className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-[11px] transition-all inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Record</span>
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

      {/* TAB 4: ADD / REGISTER PATIENT (SEARCH GLOBAL NETWORK OR NEW INTAKE) */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          {/* Option A: Search Existing MedSafe Network */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 1: Check MedSafe Platform Records</h2>
                <p className="text-xs text-slate-500">
                  Search across MedSafe to link existing patients without creating duplicate accounts
                </p>
              </div>
            </div>

            <form onSubmit={handleSearchGlobal} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter Patient ID (e.g. PAT10001), Email, or Phone Number"
                  value={globalSearchQuery}
                  onChange={e => setGlobalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searchingGlobal}
                className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-all flex items-center space-x-1.5"
              >
                {searchingGlobal ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Network</span>
                  </>
                )}
              </button>
            </form>

            {/* Global Search Results */}
            {globalSearchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Matching Patients Found ({globalSearchResults.length})
                </h3>
                {globalSearchResults.map(pat => (
                  <div
                    key={pat.patientId}
                    className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{pat.name}</span>
                        <span className="text-xs font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                          {pat.patientId}
                        </span>
                        {pat.isLinked ? (
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            ALREADY LINKED
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                            NETWORK PATIENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Age: {pat.age || 'N/A'} • Gender: {pat.gender || 'N/A'} • Phone: {pat.phone || 'N/A'} • Email: {pat.email}
                      </p>
                    </div>

                    <div>
                      {pat.isLinked ? (
                        <button
                          disabled
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Linked to Hospital</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkPatient(pat.patientId)}
                          disabled={linkingPatientId === pat.patientId}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center space-x-1 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Add to {user?.hospitalName || 'Hospital'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Option B: Direct Intake / New Patient Registration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 2: Walk-In / New Patient Intake</h2>
                  <p className="text-xs text-slate-500">
                    If the patient does not exist in MedSafe, register their new file directly
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
              >
                {showNewPatientForm ? 'Hide Form ▲' : 'Open Registration Form ▼'}
              </button>
            </div>

            {showNewPatientForm && (
              <form onSubmit={handleCreateNewPatient} className="mt-4 space-y-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={newPatientData.name}
                      onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@gmail.com"
                      value={newPatientData.email}
                      onChange={e => setNewPatientData({ ...newPatientData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={newPatientData.dob}
                      onChange={e => setNewPatientData({ ...newPatientData, dob: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={newPatientData.gender}
                      onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={newPatientData.phone}
                      onChange={e => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Street, City, State"
                      value={newPatientData.address}
                      onChange={e => setNewPatientData({ ...newPatientData, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingPatient}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center space-x-1.5 shadow-sm"
                  >
                    {creatingPatient ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Register & Link to Hospital</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: HOSPITAL DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Hospital Medical Faculty & Council IDs</h2>
              <p className="text-xs text-slate-500">
                Verified practicing physicians affiliated with {user?.hospitalName || 'this hospital'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {doc.verificationStatus || 'VERIFIED'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {doc.doctorId || doc.id}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-base">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                        <p className="text-xs text-sky-700 font-semibold">{doc.specialization}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Medical Council ID:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {doc.councilRegistrationId || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Department / Hospital:</span>
                        <span className="font-semibold text-slate-700">{doc.hospitalName || user?.hospitalName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active Patients:</span>
                        <span className="font-bold text-slate-900">{doc.patients?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Phone: {doc.phone || '+91 91234 56789'}</span>
                    <span className="text-emerald-600 font-semibold">Active Staff</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS (READ-ONLY FOR HOSPITAL PATIENTS) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Diagnostic Reports for Hospital Patients</h2>
              <p className="text-xs text-slate-500">
                Read-only diagnostic records for patients affiliated with {user?.hospitalName || 'this hospital'}. Every access is audit logged.
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No diagnostic reports currently filed for this hospital's patients.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">Test Name</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Doctor / Lab</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map(rep => (
                      <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{rep.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{rep.testName}</td>
                        <td className="py-3 px-4 text-slate-700">
                          <span className="font-semibold">{rep.patientName}</span>
                          <span className="block font-mono text-[10px] text-slate-400">{rep.patientId}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{rep.doctorName || 'Hospital Lab'}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(rep.reportDate || rep.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {rep.status || 'COMPLETED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openReportDetail(rep.id)}
                            className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-[11px] transition-all inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
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

      {/* TAB 7: HOSPITAL PROFILE & RECEPTION DETAILS */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Hospital Facility & Receptionist Profile</h2>
              <p className="text-xs text-slate-500">
                Institutional configuration and multi-tenant security verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Info */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {user?.hospitalName || dashboardData?.hospital?.name || 'ABC Hospital'}
                    </h3>
                    <p className="text-xs text-slate-500">Licensed Healthcare Provider Facility</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-200">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Hospital System ID:</span>
                    <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                      {user?.hospitalId || 'HOSP-00125'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Network Tier:</span>
                    <span className="font-bold text-slate-800">Hospital / Clinical Organization</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Verification Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      VERIFIED FACILITY
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Multi-Tenant Isolation:</span>
                    <span className="font-bold text-slate-800">Strict Tenant Partitioning Enabled</span>
                  </div>
                </div>
              </div>

              {/* Receptionist User Info */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{user?.name || 'Reception Staff'}</h3>
                    <p className="text-xs text-slate-500">Assigned Front Desk Receptionist</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-200">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Receptionist ID:</span>
                    <span className="font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                      {user?.receptionistId || 'REC-0018'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Login Email:</span>
                    <span className="font-mono text-slate-800">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Role Authority:</span>
                    <span className="font-bold text-slate-800">RECEPTIONIST (Operational Non-Clinical)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Audit Logging:</span>
                    <span className="font-semibold text-emerald-700">All Intake & View Actions Logged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: OPERATIONAL PATIENT RECORD MODAL */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Patient Operational Record
                  </h3>
                  <p className="text-xs text-slate-500">Administrative Overview & Intake History</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setPatientDetail(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {loadingPatientDetail ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500">Loading patient file...</p>
              </div>
            ) : patientDetail ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Non-Clinical Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Notice:</strong> Receptionist operational view. You cannot issue prescriptions or alter dosages.
                </div>

                {/* Patient Demographics */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                    Demographics & Contact
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Full Name</span>
                      <strong className="text-slate-900">{patientDetail.patient?.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Patient ID</span>
                      <strong className="font-mono text-sky-700">{patientDetail.patient?.patientId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                      <span className="text-slate-800">
                        {patientDetail.patient?.age || 'N/A'} yrs • {patientDetail.patient?.gender || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Blood Group</span>
                      <strong className="text-rose-600">{patientDetail.patient?.bloodGroup || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone</span>
                      <span className="text-slate-800 font-mono">{patientDetail.patient?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email</span>
                      <span className="text-slate-800">{patientDetail.patient?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Doctors */}
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                    Assigned Hospital Doctors ({patientDetail.assignedDoctors?.length || 0})
                  </h4>
                  {patientDetail.assignedDoctors && patientDetail.assignedDoctors.length > 0 ? (
                    <div className="space-y-2">
                      {patientDetail.assignedDoctors.map((doc: any) => (
                        <div key={doc.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-900">{doc.name}</strong>
                            <span className="text-slate-500 ml-2">({doc.specialization})</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Council: {doc.councilRegistrationId || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No assigned doctors.</p>
                  )}
                </div>

                {/* Medications Summary (Read-Only) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                    Active Medications Summary ({patientDetail.medications?.length || 0}) [Read-Only]
                  </h4>
                  {patientDetail.medications && patientDetail.medications.length > 0 ? (
                    <div className="space-y-2">
                      {patientDetail.medications.map((med: any) => (
                        <div key={med.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-900">{med.medicationName || med.name}</strong>
                            <span className="text-slate-500 ml-2">({med.dosage})</span>
                          </div>
                          <span className="text-slate-600 font-medium">{med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No active medications on file.</p>
                  )}
                </div>

                {/* Reports Summary */}
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                    Diagnostic Reports ({patientDetail.reports?.length || 0})
                  </h4>
                  {patientDetail.reports && patientDetail.reports.length > 0 ? (
                    <div className="space-y-2">
                      {patientDetail.reports.map((rep: any) => (
                        <div key={rep.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-900">{rep.testName}</strong>
                            <span className="text-slate-500 ml-2">
                              {new Date(rep.reportDate || rep.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => openReportDetail(rep.id)}
                            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            View Report →
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No reports found.</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setPatientDetail(null);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: READ-ONLY REPORT DETAIL MODAL */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Diagnostic Investigation Report
                  </h3>
                  <p className="text-xs text-slate-500">Read-Only Hospital Staff Viewer (Audit Logged)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedReportId(null);
                  setReportDetail(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {loadingReportDetail ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500">Loading diagnostic report...</p>
              </div>
            ) : reportDetail?.report ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
                {/* Header Information */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Test / Investigation</span>
                    <strong className="text-slate-900 text-sm">{reportDetail.report.testName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Report ID</span>
                    <strong className="font-mono text-purple-700">{reportDetail.report.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Patient Name & ID</span>
                    <span className="text-slate-800 font-bold">
                      {reportDetail.patient?.name || reportDetail.report.patientName} (
                      {reportDetail.report.patientId})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date Generated</span>
                    <span className="text-slate-800">
                      {new Date(reportDetail.report.reportDate || reportDetail.report.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Parameters & Values Table */}
                {reportDetail.report.parameters && reportDetail.report.parameters.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Parameter</th>
                          <th className="py-2.5 px-3">Result Value</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportDetail.report.parameters.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{p.name}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.value}</td>
                            <td className="py-2.5 px-3 text-slate-500">{p.referenceRange || 'Normal'}</td>
                            <td className="py-2.5 px-3 text-slate-500">{p.unit || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Findings & Notes */}
                {reportDetail.report.notes && (
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-1">Clinical Impressions & Findings:</h4>
                    <p className="text-slate-700">{reportDetail.report.notes}</p>
                  </div>
                )}

                {/* Audit Notice */}
                <div className="text-[11px] text-slate-400 text-center italic">
                  Audit Entry: REPORT_VIEWED_RECEPTIONIST logged for {user?.name || 'Receptionist'} ({user?.receptionistId})
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedReportId(null);
                  setReportDetail(null);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
