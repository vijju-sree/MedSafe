import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { LabSidebar } from '../components/LabSidebar';
import { LabSidebarTab, TestOrder, MedicalReport } from '../types';
import {
  FlaskConical,
  Droplet,
  Activity,
  FileCheck,
  UploadCloud,
  Tag,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Search,
  PlusCircle,
  FileText,
  ShieldAlert,
  User,
  Calendar,
  DollarSign,
  Inbox
} from 'lucide-react';

export const LabDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LabSidebarTab>('dashboard');
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [catalogue, setCatalogue] = useState<Array<{ testName: string; category: string; cost: number }>>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<TestOrder | null>(null);
  const [reportForm, setReportForm] = useState({
    resultSummary: '',
    detailedFindings: '',
    referenceRange: 'Within standard physiological limits',
    performedBy: 'Staff Medical Technologist'
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    loadLabData();
  }, []);

  const loadLabData = async () => {
    setLoading(true);
    try {
      const [ordersData, reportsData, catData] = await Promise.all([
        api.getAllTestOrders(),
        api.getAllMedicalReports(),
        api.getTestCatalogue()
      ]);
      setTestOrders(ordersData.testOrders || []);
      setReports(reportsData.reports || []);
      setCatalogue(catData.catalogue || []);
    } catch (err) {
      console.error('Error loading lab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = async (orderId: string) => {
    try {
      await api.collectSample(orderId);
      setActionSuccess('Sample collection recorded successfully! Notification sent to patient.');
      setTimeout(() => setActionSuccess(null), 4000);
      loadLabData();
    } catch (err: any) {
      alert(err.message || 'Failed to record sample collection');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.updateTestOrderStatus(orderId, status);
      setActionSuccess(`Test order updated to ${status}.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadLabData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleOpenUploadModal = (order?: TestOrder) => {
    if (order) {
      setSelectedOrderForReport(order);
    } else {
      const firstInProgress = testOrders.find(o => o.status === 'IN_PROGRESS' || o.status === 'SAMPLE_COLLECTED');
      setSelectedOrderForReport(firstInProgress || testOrders[0] || null);
    }
    setReportForm({
      resultSummary: '',
      detailedFindings: '',
      referenceRange: 'Standard clinical reference values applied.',
      performedBy: user?.name || 'Senior Pathologist'
    });
    setUploadModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReport) {
      alert('Please select an active test order.');
      return;
    }
    if (!reportForm.resultSummary || !reportForm.detailedFindings) {
      alert('Please enter result summary and detailed findings.');
      return;
    }

    setSubmittingReport(true);
    try {
      await api.uploadMedicalReport({
        testOrderId: selectedOrderForReport.testOrderId,
        resultSummary: reportForm.resultSummary,
        detailedFindings: reportForm.detailedFindings,
        referenceRange: reportForm.referenceRange,
        performedBy: reportForm.performedBy
      });

      setUploadModalOpen(false);
      setActionSuccess(`Medical report generated and published for Order #${selectedOrderForReport.testOrderId}. Notifications sent.`);
      setTimeout(() => setActionSuccess(null), 5000);
      loadLabData();
    } catch (err: any) {
      alert(err.message || 'Failed to upload report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const incomingOrders = testOrders.filter(o => o.status === 'ORDERED');
  const sampleQueue = testOrders.filter(o => o.status === 'SAMPLE_COLLECTED' || o.status === 'ORDERED');
  const inProgressOrders = testOrders.filter(o => o.status === 'IN_PROGRESS');
  const completedOrders = testOrders.filter(o => o.status === 'COMPLETED');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <LabSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        labName={user?.name || 'Apex Diagnostic Center'}
        labId={user?.labId || 'LAB10001'}
        incomingOrdersCount={incomingOrders.length}
      />

      <main className="flex-1 p-6 max-w-7xl mx-auto overflow-y-auto">
        {/* Verification Status Warning if pending */}
        {user?.verificationStatus === 'PENDING' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Facility Accreditation Pending Review</h4>
              <p className="text-xs text-amber-800 mt-1">
                Your diagnostic center registration is currently undergoing administrative verification. Full clinical report publishing privileges will be unlocked once approved by MedSafe Administration.
              </p>
            </div>
          </div>
        )}

        {/* Global Feedback Alert */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{actionSuccess}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Operations Overview</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Manage incoming laboratory investigations, specimen accessioning, and diagnostic report publishing.
                </p>
              </div>
              <button
                onClick={() => handleOpenUploadModal()}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Upload / Publish Report</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Incoming Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Inbox className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{incomingOrders.length}</div>
                <span className="text-[10px] text-rose-600 font-semibold">Requires sample accessioning</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">In-Progress Tests</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{inProgressOrders.length}</div>
                <span className="text-[10px] text-amber-600 font-semibold">Under clinical analysis</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Published Reports</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{reports.length}</div>
                <span className="text-[10px] text-emerald-600 font-semibold">Available for clinicians</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Test Catalogue</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{catalogue.length}</div>
                <span className="text-[10px] text-indigo-600 font-semibold">Diagnostic assays active</span>
              </div>
            </div>

            {/* Recent Orders Queue */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Recent Diagnostic Orders</h3>
                <span className="text-xs text-slate-500">Showing all registered investigations</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Test Name</th>
                      <th className="p-3">Prescribing Doctor</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">No test orders currently registered.</td>
                      </tr>
                    ) : (
                      testOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{order.testOrderId}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{order.patientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{order.patientId}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">{order.testName}</span>
                            <div className="text-[10px] text-slate-400">{order.testCategory}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-700">{order.doctorName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              order.priority === 'STAT'
                                ? 'bg-rose-100 text-rose-800'
                                : order.priority === 'URGENT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              order.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'IN_PROGRESS'
                                ? 'bg-indigo-100 text-indigo-800'
                                : order.status === 'SAMPLE_COLLECTED'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            {order.status === 'ORDERED' && (
                              <button
                                onClick={() => handleCollectSample(order.id)}
                                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                Collect Sample
                              </button>
                            )}
                            {order.status === 'SAMPLE_COLLECTED' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                Start Analysis
                              </button>
                            )}
                            {order.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleOpenUploadModal(order)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                Publish Report
                              </button>
                            )}
                            {order.status === 'COMPLETED' && (
                              <span className="text-[11px] font-bold text-emerald-600">Report Ready ✓</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCOMING ORDERS */}
        {activeTab === 'incoming-orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Incoming Test Orders Requiring Accession</h2>
              <p className="text-xs text-slate-500 mt-1">Orders prescribed by registered clinicians awaiting sample collection.</p>
            </div>

            <div className="grid gap-4">
              {incomingOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                  No new incoming orders awaiting accession.
                </div>
              ) : (
                incomingOrders.map(order => (
                  <div key={order.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                          {order.testOrderId}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{order.testName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {order.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs text-slate-600">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-semibold">PATIENT</span>
                          <span className="font-bold text-slate-800">{order.patientName}</span> ({order.patientId})
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-semibold">PRESCRIBING DOCTOR</span>
                          <span className="font-bold text-slate-800">{order.doctorName}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-semibold">INVESTIGATION COST</span>
                          <span className="font-bold text-slate-800">₹{order.cost}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-semibold">CLINICAL REASON</span>
                          <span className="font-medium text-slate-800">{order.reason}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCollectSample(order.id)}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
                      >
                        Accession & Collect Sample
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SAMPLE COLLECTION */}
        {activeTab === 'sample-collection' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Specimen Accessioning & Collection Queue</h2>
              <p className="text-xs text-slate-500 mt-1">Track blood, urine, radiology specimens and patient arrivals.</p>
            </div>

            <div className="grid gap-4">
              {sampleQueue.map(order => (
                <div key={order.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{order.testOrderId}</span>
                      <span className="font-bold text-slate-800 text-sm">{order.testName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Patient: <span className="font-bold text-slate-800">{order.patientName}</span> | Doctor: {order.doctorName} | Ordered: {new Date(order.orderedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    {order.status === 'ORDERED' ? (
                      <button
                        onClick={() => handleCollectSample(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                      >
                        Collect Sample
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                      >
                        Send to Analysis
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: IN-PROGRESS */}
        {activeTab === 'in-progress' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Investigations Under Active Analysis</h2>
              <p className="text-xs text-slate-500 mt-1">Diagnostic tests currently being run on laboratory analyzers.</p>
            </div>

            <div className="grid gap-4">
              {inProgressOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                  No assays currently marked in-progress.
                </div>
              ) : (
                inProgressOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-amber-700">{order.testOrderId}</span>
                        <span className="font-bold text-slate-900">{order.testName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: <strong>{order.patientName}</strong> | Priority: <strong>{order.priority}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenUploadModal(order)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                    >
                      Publish Final Report
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: COMPLETED REPORTS */}
        {activeTab === 'completed-reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Official Medical Reports Archive</h2>
              <p className="text-xs text-slate-500 mt-1">Digitally certified investigation reports published to patient and clinical EHR portals.</p>
            </div>

            <div className="grid gap-4">
              {reports.map(rep => (
                <div key={rep.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {rep.reportId}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{rep.testName}</h4>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Patient: <strong>{rep.patientName}</strong> ({rep.patientId}) | Prescribed by: <strong>{rep.doctorName}</strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <a
                        href={`/api/reports/${rep.reportId}/download`}
                        download
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Official File</span>
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CLINICAL SUMMARY</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{rep.resultSummary}</p>
                    <div className="mt-2 text-slate-600 whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {rep.detailedFindings}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Pathologist: <strong>{rep.performedBy}</strong></span>
                      <span>Published: {new Date(rep.uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: UPLOAD / PUBLISH REPORT */}
        {activeTab === 'upload-report' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Publish Medical Investigation Report</h2>
              <p className="text-xs text-slate-500 mt-1">Directly generate structured findings for patient EHR and physician notification.</p>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Active Test Order</label>
                <select
                  value={selectedOrderForReport?.id || ''}
                  onChange={e => {
                    const order = testOrders.find(o => o.id === e.target.value);
                    setSelectedOrderForReport(order || null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">-- Choose an open test order --</option>
                  {testOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.testOrderId} - {o.testName} ({o.patientName}) [{o.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Performing Pathologist / Technologist</label>
                <input
                  type="text"
                  value={reportForm.performedBy}
                  onChange={e => setReportForm({ ...reportForm, performedBy: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Result Summary (Key Clinical Impression)</label>
                <input
                  type="text"
                  placeholder="e.g. Mild anemia noted, normal WBC count"
                  value={reportForm.resultSummary}
                  onChange={e => setReportForm({ ...reportForm, resultSummary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference Range Note</label>
                <input
                  type="text"
                  value={reportForm.referenceRange}
                  onChange={e => setReportForm({ ...reportForm, referenceRange: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Findings & Quantitative Metrics</label>
                <textarea
                  rows={6}
                  placeholder="Enter detailed assay results, differential count, radiological impressions, or observations..."
                  value={reportForm.detailedFindings}
                  onChange={e => setReportForm({ ...reportForm, detailedFindings: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Publishing will immediately notify both the patient and prescribing physician, and mark the order as COMPLETED.</span>
              </div>

              <button
                type="submit"
                disabled={submittingReport}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {submittingReport ? 'Publishing Report...' : 'Publish Official Investigation Report'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: TEST CATALOGUE */}
        {activeTab === 'test-catalogue' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Accredited Test Catalogue & Standard Pricing</h2>
              <p className="text-xs text-slate-500 mt-1">Available diagnostic assays provided by Apex Diagnostic Center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogue.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{item.testName}</h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Standard Rate</span>
                    <span className="text-base font-black text-slate-900">₹{item.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Alerts & Test Order Feed</h2>
              <p className="text-xs text-slate-500 mt-1">Audit log of system dispatches for this facility.</p>
            </div>

            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              All incoming investigation requests are synchronized in real time with the central coordination engine.
            </div>
          </div>
        )}

        {/* TAB 9: FACILITY ACCREDITATION PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Diagnostic Center Accreditation</h2>
              <p className="text-xs text-slate-500 mt-1">Licensed facility credentials and laboratory information.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">FACILITY NAME</span>
                  <span className="font-bold text-slate-900 text-sm">{user?.name || 'Apex Diagnostic Center'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">LABORATORY ID</span>
                  <span className="font-mono font-bold text-indigo-700">{user?.labId || 'LAB10001'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">NABL ACCREDITATION</span>
                  <span className="font-mono font-semibold text-slate-800">NABL-MED-9941</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">VERIFICATION STATUS</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    {user?.verificationStatus || 'VERIFIED'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">REGISTERED ADDRESS</span>
                <p className="text-slate-700">Diagnostic Tower, Block C, Road No. 36, Jubilee Hills, Hyderabad - 500033</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* View Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700">{selectedReport.reportId}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedReport.testName}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl">
              <div><strong>Patient:</strong> {selectedReport.patientName} ({selectedReport.patientId})</div>
              <div><strong>Clinician:</strong> {selectedReport.doctorName}</div>
              <div><strong>Date:</strong> {selectedReport.testDate}</div>
              <div><strong>Pathologist:</strong> {selectedReport.performedBy}</div>
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Result Summary</h4>
              <p className="text-sm font-semibold text-slate-800 mt-1">{selectedReport.resultSummary}</p>
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Detailed Laboratory Findings</h4>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap mt-1">
                {selectedReport.detailedFindings}
              </pre>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900">
              {selectedReport.disclaimer}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
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
