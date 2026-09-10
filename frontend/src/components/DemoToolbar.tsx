import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { UserRole } from '../types';
import { Sparkles, Bell, AlertTriangle, RefreshCw, Users, ShieldAlert, Check } from 'lucide-react';

interface DemoToolbarProps {
  onEventTriggered?: () => void;
  onOpenReminderModal?: (schedule: any) => void;
}

export const DemoToolbar: React.FC<DemoToolbarProps> = ({ onEventTriggered, onOpenReminderModal }) => {
  const { user, switchRole } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setLoadingAction(`role-${role}`);
    try {
      await switchRole(role);
      const roleLabel = role === 'CAREGIVER' ? 'Caretaker' : role;
      showFeedback(`Switched to demo ${roleLabel} profile.`);
      if (onEventTriggered) onEventTriggered();
    } catch (err: any) {
      showFeedback(`Error switching role: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReceptionistSwitch = async (hospitalId: string, label: string) => {
    setLoadingAction(`receptionist-${hospitalId}`);
    try {
      await switchRole({ role: 'RECEPTIONIST', hospitalId });
      showFeedback(`Switched to demo Receptionist profile (${label}).`);
      if (onEventTriggered) onEventTriggered();
    } catch (err: any) {
      showFeedback(`Error switching role: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriggerReminder = async () => {
    setLoadingAction('reminder');
    try {
      const res = await api.triggerTestReminder(user?.patientId || 'PAT10001');
      showFeedback(`Test Reminder triggered for ${res.schedule.medicationName}!`);
      if (onOpenReminderModal) {
        onOpenReminderModal(res.schedule);
      }
      if (onEventTriggered) onEventTriggered();
    } catch (err: any) {
      showFeedback(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateMissed = async () => {
    setLoadingAction('missed');
    try {
      await api.simulateMissedDose(user?.patientId || 'PAT10001');
      showFeedback('Simulated missed dose event recorded.');
      if (onEventTriggered) onEventTriggered();
    } catch (err: any) {
      showFeedback(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateConflict = async () => {
    setLoadingAction('conflict');
    try {
      await api.simulateSafetyConflict(user?.patientId || 'PAT10001');
      showFeedback('Drug Conflict safety signal triggered.');
      if (onEventTriggered) onEventTriggered();
    } catch (err: any) {
      showFeedback(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Reset demo database to fresh initial state?')) return;
    setLoadingAction('reset');
    try {
      await api.resetDatabase();
      showFeedback('Database successfully re-seeded with demo records.');
      if (onEventTriggered) onEventTriggered();
    } catch (err: any) {
      showFeedback(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-40 w-11/12 max-w-5xl">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 transition-all duration-200">
        <div className="flex items-center justify-between">
          {/* Header Tag */}
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo / Test Mode</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Swarnandhra College Hackathon 2026 Controls
            </span>
          </div>

          {/* Toast Message */}
          {statusMessage && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Toggle Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
          >
            {isExpanded ? 'Minimize' : 'Expand Controls'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* 1-Click Role Switcher — ONLY the 4 Allowed Roles */}
            <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-sky-400" /> Switch Role:
              </span>
              {[
                { role: 'PATIENT' as UserRole, label: 'Patient (Anjali)' },
                { role: 'DOCTOR' as UserRole, label: 'Doctor (Dr. Ravi)' },
                { role: 'CAREGIVER' as UserRole, label: 'Caretaker (Priya)' },
                { role: 'ADMIN' as UserRole, label: 'Admin' },
              ].map(({ role, label }) => {
                const isActive = user?.role === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    disabled={loadingAction !== null}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm ring-1 ring-sky-300 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => handleReceptionistSwitch('HOSP-00125', 'ABC Hospital')}
                disabled={loadingAction !== null}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'RECEPTIONIST' && (user?.hospitalId === 'HOSP-00125' || !user?.hospitalId)
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-300 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                Receptionist (ABC)
              </button>
              <button
                onClick={() => handleReceptionistSwitch('HOSP-00482', 'XYZ Hospital')}
                disabled={loadingAction !== null}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'RECEPTIONIST' && user?.hospitalId === 'HOSP-00482'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-300 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                Receptionist (XYZ)
              </button>
            </div>

            {/* Test Triggers */}
            <div className="md:col-span-5 flex flex-wrap items-center justify-end gap-1.5">
              <button
                onClick={handleTriggerReminder}
                disabled={loadingAction !== null}
                className="flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
                title="Simulate scheduled time arriving now"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test Reminder</span>
              </button>

              <button
                onClick={handleSimulateMissed}
                disabled={loadingAction !== null}
                className="flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-medium transition-colors"
                title="Simulate grace period expiration"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Trigger Missed</span>
              </button>

              <button
                onClick={handleSimulateConflict}
                disabled={loadingAction !== null}
                className="flex items-center space-x-1 text-xs px-2 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-medium transition-colors"
                title="Trigger Drug Conflict signal"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Conflict Alert</span>
              </button>

              <button
                onClick={handleResetDb}
                disabled={loadingAction !== null}
                className="flex items-center space-x-1 text-xs px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Reset database to initial demo state"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'reset' ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
