import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Pill, Shield, Clock, HeartHandshake, FileCheck, CheckCircle2, ChevronRight, Lock, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: (defaultRole?: UserRole) => void;
  onGoToRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin, onGoToRegister }) => {
  const { switchRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleQuickDemo = async (role: UserRole) => {
    setLoadingRole(role);
    try {
      await switchRole(role);
    } catch (err: any) {
      alert(`Error signing in: ${err.message}`);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40 text-slate-900">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Pill className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Med<span className="text-sky-600">Safe</span></span>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Adherence & Safety Platform</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onGoToRegister()}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all"
          >
            Register as New Patient
          </button>

          <button
            onClick={() => onGoToLogin()}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all flex items-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold mb-6 shadow-xs">
          <span className="flex h-2 w-2 rounded-full bg-sky-600 animate-ping"></span>
          <span>Swarnandhra College Hackathon 2026 — Problem Statement 2</span>
        </div>

        {/* Hero Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Manage medications. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600">
            Stay on schedule. Stay connected.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The comprehensive healthcare medication-management platform connecting patients, prescribing doctors, authorized caretakers, and administrators with proactive safety intelligence.
        </p>

        {/* Strict Safety Disclaimer Banner */}
        <div className="mt-8 max-w-3xl mx-auto p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex items-start space-x-3 text-left shadow-xs">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold">Healthcare Safety Boundary: </span>
            MedSafe is an adherence coordination and clinical decision-support tool. It never independently prescribes, alters dosages, or replaces clinical judgement. All potential conflicts are presented as:
            <em className="block mt-1 font-semibold text-amber-950">
              "Possible concern detected — professional review recommended. Please consult your doctor before making medication changes."
            </em>
          </div>
        </div>

        {/* 1-Click Demo Evaluation Launcher — Exactly 4 Roles */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="text-left">
              <h2 className="text-lg font-bold text-slate-900">Instant Evaluation Accounts</h2>
              <p className="text-xs text-slate-500">Select any role to test the complete workflow end-to-end</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Ready to Test
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: 'PATIENT' as UserRole,
                name: 'Anjali Sharma',
                id: 'PAT10001',
                desc: 'View schedule, mark Taken/Missed, adherence analytics',
                color: 'hover:border-sky-500 hover:bg-sky-50/50',
                badge: 'bg-sky-100 text-sky-800'
              },
              {
                role: 'DOCTOR' as UserRole,
                name: 'Dr. Ravi Kumar',
                id: 'DOC10001',
                desc: 'Add Rx, manage plans with versioning, prescribe tests',
                color: 'hover:border-indigo-500 hover:bg-indigo-50/50',
                badge: 'bg-indigo-100 text-indigo-800'
              },
              {
                role: 'CAREGIVER' as UserRole,
                name: 'Priya Sharma',
                id: 'CAR10001',
                desc: 'Authorized caretaker view, adherence monitor, alerts',
                color: 'hover:border-teal-500 hover:bg-teal-50/50',
                badge: 'bg-teal-100 text-teal-800',
                labelRole: 'CARETAKER'
              },
              {
                role: 'ADMIN' as UserRole,
                name: 'Rajesh Varma',
                id: 'ADM10001',
                desc: 'System metrics, verifications queue, billing & audit trail',
                color: 'hover:border-purple-500 hover:bg-purple-50/50',
                badge: 'bg-purple-100 text-purple-800'
              }
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => handleQuickDemo(item.role)}
                disabled={loadingRole !== null}
                className={`p-4 rounded-2xl border border-slate-200 text-left transition-all duration-200 flex flex-col justify-between group ${item.color} disabled:opacity-50`}
              >
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badge}`}>
                    {item.labelRole || item.role}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-2 group-hover:text-sky-600 transition-colors">
                    {item.name}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-400 block">{item.id}</span>
                  <p className="text-[11px] text-slate-500 mt-2 leading-snug">{item.desc}</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Open {item.labelRole ? 'Caretaker' : item.role.charAt(0) + item.role.slice(1).toLowerCase()}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
