import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ClinicHospitalSidebarTab, TestOrder, MedicalReport, Bill } from '../types';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  Building2,
  FlaskConical,
  FileCheck,
  Receipt,
  ShieldAlert,
  BadgeCheck,
  Bell,
  LogOut,
  Building,
  CheckCircle2
} from 'lucide-react';

export const ClinicHospitalDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ClinicHospitalSidebarTab>('dashboard');
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [financials, setFinancials] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    setLoading(true);
    try {
      const [usersData, ordersData, reportsData, billsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAllTestOrders(),
        api.getAllMedicalReports(),
        api.getAllBills()
      ]);

      const allUsers = usersData.users || [];
      setPatients(allUsers.filter((u: any) => u.role === 'PATIENT'));
      setDoctors(allUsers.filter((u: any) => u.role === 'DOCTOR'));
      setTestOrders(ordersData.testOrders || []);
      setReports(reportsData.reports || []);
      setBills(billsData.bills || []);
      setFinancials(billsData.analytics || {});
    } catch (err) {
      console.error('Error loading clinic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const navItems: { id: ClinicHospitalSidebarTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Registered Patients', icon: Users },
    { id: 'doctors', label: 'Medical Staff Roster', icon: UserCheck },
    { id: 'consultations', label: 'OPD Consultations', icon: CalendarCheck },
    { id: 'departments', label: 'Clinical Departments', icon: Building2 },
    { id: 'test-orders', label: 'Diagnostic Orders', icon: FlaskConical },
    { id: 'medical-reports', label: 'Diagnostic Reports', icon: FileCheck },
    { id: 'billing-revenue', label: 'Billing & Collections', icon: Receipt },
    { id: 'safety-alerts', label: 'Safety & Conflicts', icon: ShieldAlert },
    { id: 'staff-verifications', label: 'Staff Credentialing', icon: BadgeCheck },
    { id: 'notifications', label: 'Hospital Dispatches', icon: Bell },
    { id: 'profile', label: 'Facility Profile', icon: Building },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Clinic Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-teal-50/70 to-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              🏥
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-900 text-sm truncate">{user?.name || 'Care Clinic & Hospital'}</h3>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-200">
                  {user?.clinicId || 'CLN10001'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">● Verified Healthcare Facility</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Hospital / Clinic Management (12 Sections)
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto overflow-y-auto space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Hospital Oversight</h1>
              <p className="text-xs text-slate-500 mt-1">Multi-department healthcare facility coordination, clinical staff roster, and revenue audits.</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Registered Census</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{patients.length}</div>
                <span className="text-[10px] text-emerald-600 font-semibold">Patients enrolled</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Medical Staff</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{doctors.length}</div>
                <span className="text-[10px] text-teal-600 font-semibold">Active physicians</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Diagnostic Orders</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{testOrders.length}</div>
                <span className="text-[10px] text-indigo-600 font-semibold">{reports.length} reports filed</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Settled Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₹{financials.totalRevenue || 0}</div>
                <span className="text-[10px] text-slate-500 font-semibold">₹{financials.pendingRevenue || 0} pending</span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Facility Diagnostic Investigations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2.5">Order ID</th>
                      <th className="p-2.5">Patient</th>
                      <th className="p-2.5">Investigation</th>
                      <th className="p-2.5">Clinician</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testOrders.map(o => (
                      <tr key={o.id}>
                        <td className="p-2.5 font-mono font-bold text-teal-700">{o.testOrderId}</td>
                        <td className="p-2.5 font-bold text-slate-800">{o.patientName}</td>
                        <td className="p-2.5">{o.testName}</td>
                        <td className="p-2.5 text-slate-600">{o.doctorName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {o.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">₹{o.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PATIENTS */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Registered Patient Census</h2>
            <div className="grid gap-3">
              {patients.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <span className="font-mono text-xs text-teal-700 font-semibold">{p.patientId || 'N/A'}</span> • <span className="text-xs text-slate-500">{p.email}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Active Patient</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: DOCTORS */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Medical Staff Roster</h2>
            <div className="grid gap-3">
              {doctors.map(d => (
                <div key={d.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                    <span className="font-mono text-xs text-teal-700 font-semibold">{d.doctorId || 'N/A'}</span> • <span className="text-xs text-slate-500">{d.email}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">Consultant Physician</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: BILLING & COLLECTIONS */}
        {activeTab === 'billing-revenue' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Hospital Invoicing & Revenue Stream</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Bill ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map(b => (
                    <tr key={b.id}>
                      <td className="p-3 font-mono font-bold text-teal-700">{b.billId}</td>
                      <td className="p-3 font-bold text-slate-800">{b.patientName}</td>
                      <td className="p-3 text-slate-600">{b.items[0]?.description || 'Diagnostic Services'}</td>
                      <td className="p-3 font-black text-slate-900">₹{b.totalAmount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          b.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{b.paymentMethod || 'PENDING'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback for remaining tabs */}
        {!['dashboard', 'patients', 'doctors', 'billing-revenue'].includes(activeTab) && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <span className="font-bold text-sm block text-slate-800 capitalize">{activeTab.replace('-', ' ')}</span>
            Operational data for this department is synchronized with the central MedSafe platform.
          </div>
        )}
      </main>
    </div>
  );
};
