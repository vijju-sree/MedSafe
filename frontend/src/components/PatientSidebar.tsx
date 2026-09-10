import React from 'react';
import { PatientSidebarTab } from '../types';
import {
  LayoutDashboard,
  Pill,
  CalendarDays,
  BellRing,
  TrendingUp,
  FileText,
  FlaskConical,
  FileCheck,
  Receipt,
  UserCheck,
  Building2,
  ShieldAlert,
  Bell,
  HeartHandshake,
  KeyRound,
  History,
  RefreshCw,
  UserCircle,
  LogOut,
  Shield,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PatientSidebarProps {
  activeTab: PatientSidebarTab;
  onTabChange: (tab: PatientSidebarTab) => void;
  patientId: string;
  patientName: string;
  unreadCount?: number;
  safetyAlertCount?: number;
  pendingBillsCount?: number;
  readyReportsCount?: number;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeTab,
  onTabChange,
  patientId,
  patientName,
  unreadCount = 0,
  safetyAlertCount = 0,
  pendingBillsCount = 0,
  readyReportsCount = 0
}) => {
  const { logout } = useAuth();

  const navItems: {
    id: PatientSidebarTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medications', label: 'My Medications', icon: Pill },
    { id: 'reminders', label: 'Reminders', icon: BellRing },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-sky-600 text-white'
    },
    { id: 'history', label: 'Medical History', icon: History },
    { id: 'refills', label: 'Medical Refills', icon: RefreshCw },
    { id: 'adherence', label: 'Adherence / Tracking', icon: TrendingUp },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'tests-investigations', label: 'Tests & Investigations', icon: FlaskConical },
    {
      id: 'medical-reports',
      label: 'Reports',
      icon: FileCheck,
      badge: readyReportsCount > 0 ? readyReportsCount : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'bills-payments',
      label: 'Bills & Payments',
      icon: Receipt,
      badge: pendingBillsCount > 0 ? `${pendingBillsCount} Due` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    { id: 'subscriptions', label: 'My Subscription', icon: Sparkles },
    {
      id: 'safety-followup',
      label: 'Follow-Up',
      icon: ShieldAlert,
      badge: safetyAlertCount > 0 ? safetyAlertCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { id: 'caregivers', label: 'Caretakers', icon: HeartHandshake },
    { id: 'my-doctors', label: 'My Doctors', icon: UserCheck },
    { id: 'access-consent', label: 'Access & Consent', icon: KeyRound },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shadow-xs">
      {/* Patient Identity Badge */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-sky-50/70 to-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {patientName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-900 text-sm truncate" title={patientName}>{patientName}</h3>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                {patientId}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">● Active Patient</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Patient Portal (18 Sections)
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Safety & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[10px] text-amber-900 flex items-start space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>Non-diagnostic coordination platform. Consult your doctor before changing medication.</span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
