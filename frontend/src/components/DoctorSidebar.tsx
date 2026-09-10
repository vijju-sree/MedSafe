import React from 'react';
import { DoctorSidebarTab } from '../types';
import {
  LayoutDashboard,
  Users,
  Inbox,
  Pill,
  FileText,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
  ClipboardCheck,
  Bell,
  KeyRound,
  UserCircle,
  LogOut,
  Stethoscope,
  FlaskConical,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DoctorSidebarProps {
  activeTab: DoctorSidebarTab;
  onTabChange: (tab: DoctorSidebarTab) => void;
  doctorName: string;
  specialty?: string;
  doctorId: string;
  pendingRequestsCount?: number;
  patientsCount?: number;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  activeTab,
  onTabChange,
  doctorName,
  specialty = 'Internal Medicine',
  doctorId,
  pendingRequestsCount = 0,
  patientsCount = 0
}) => {
  const { logout } = useAuth();

  const navItems: { id: DoctorSidebarTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-patients', label: 'My Patients', icon: Users, badge: patientsCount > 0 ? patientsCount : undefined, badgeColor: 'bg-indigo-100 text-indigo-800' },
    { id: 'consultation-requests', label: 'Consultation Requests', icon: Inbox, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} New` : undefined, badgeColor: 'bg-rose-600 text-white animate-pulse' },
    { id: 'medication-plans', label: 'Medication Plans', icon: Pill },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'tests-investigations', label: 'Tests & Investigations', icon: FlaskConical },
    { id: 'medical-reports', label: 'Diagnostic Reports', icon: FileCheck },
    { id: 'adherence', label: 'Adherence', icon: TrendingUp },
    { id: 'safety-alerts', label: 'Safety Alerts', icon: ShieldAlert },
    { id: 'refill-renewal', label: 'Refill / Renewal', icon: RefreshCw },
    { id: 'follow-up', label: 'Follow-up', icon: ClipboardCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'access-consent', label: 'Access / Consent', icon: KeyRound },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shadow-xs">
      {/* Doctor Identity Badge */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-indigo-50/70 to-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-900 text-sm truncate" title={doctorName}>{doctorName}</h3>
            <div className="text-[11px] text-slate-500 truncate" title={specialty}>{specialty}</div>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 mt-1 inline-block">
              {doctorId}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Clinical Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
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

      {/* Bottom Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
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
