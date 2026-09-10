import React from 'react';
import { LabSidebarTab } from '../types';
import {
  LayoutDashboard,
  Inbox,
  Droplet,
  Activity,
  FileCheck,
  UploadCloud,
  Tag,
  Bell,
  Building2,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LabSidebarProps {
  activeTab: LabSidebarTab;
  onTabChange: (tab: LabSidebarTab) => void;
  labName: string;
  labId: string;
  incomingOrdersCount?: number;
  unreadCount?: number;
}

export const LabSidebar: React.FC<LabSidebarProps> = ({
  activeTab,
  onTabChange,
  labName,
  labId,
  incomingOrdersCount = 0,
  unreadCount = 0
}) => {
  const { logout } = useAuth();

  const navItems: {
    id: LabSidebarTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Lab Overview', icon: LayoutDashboard },
    {
      id: 'incoming-orders',
      label: 'Incoming Orders',
      icon: Inbox,
      badge: incomingOrdersCount > 0 ? incomingOrdersCount : undefined,
      badgeColor: 'bg-rose-600 text-white'
    },
    { id: 'sample-collection', label: 'Sample Collection', icon: Droplet },
    { id: 'in-progress', label: 'In-Progress Tests', icon: Activity },
    { id: 'completed-reports', label: 'Published Reports', icon: FileCheck },
    { id: 'upload-report', label: 'Generate / Upload Report', icon: UploadCloud },
    { id: 'test-catalogue', label: 'Test Catalogue & Pricing', icon: Tag },
    {
      id: 'notifications',
      label: 'Alerts & Orders',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-indigo-600 text-white'
    },
    { id: 'profile', label: 'Facility Accreditation', icon: Building2 },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shadow-xs">
      {/* Lab Facility Badge */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-indigo-50/70 to-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            🧪
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-900 text-sm truncate" title={labName}>{labName}</h3>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                {labId}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">● NABL Accredited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Diagnostic Center Portal
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

      {/* Bottom Regulatory Info & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <div className="p-2 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-[10px] text-indigo-900 flex items-start space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
          <span>Diagnostic reports require certified pathologist validation prior to clinical release.</span>
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
