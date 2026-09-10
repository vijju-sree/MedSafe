import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MedicationSchedule, TimeOfDay } from '../types';
import { HeartHandshake, AlertTriangle, Clock, CheckCircle2, XCircle, ShieldCheck, UserCheck } from 'lucide-react';

export const CaregiverDashboard: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PAT10001');
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPatients = async () => {
    try {
      const res = await api.getCaregiverPatients();
      setPatients(res.patients);
      if (res.patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(res.patients[0].patientId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatientOverview = async (pid: string) => {
    setLoading(true);
    try {
      const res = await api.getCaregiverPatientOverview(pid);
      setPatientData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientOverview(selectedPatientId);
    }
  }, [selectedPatientId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" />Taken — On Time</span>;
      case 'LATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Taken — Late</span>;
      case 'MISSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" />Missed Dose</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700"><Clock className="w-3 h-3 mr-1" />Upcoming</span>;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">Caretaker Coordination Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Read-only medication schedule monitoring, adherence tracking, and missed-dose alerts for authorized patients
          </p>
        </div>

        <div className="flex items-center space-x-2 p-2 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Patient-Consent Protected (Read-Only)</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Authorized Patients List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorized Family / Patients</h2>
          <div className="space-y-2">
            {patients.map((p) => (
              <button
                key={p.patientId}
                onClick={() => setSelectedPatientId(p.patientId)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedPatientId === p.patientId
                    ? 'bg-teal-50/80 border-teal-300 shadow-xs ring-1 ring-teal-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {p.patientId}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-slate-500">Adherence: {p.adherencePercentage}%</span>
                  <span className={`font-semibold ${p.missedDosesToday > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {p.missedDosesToday > 0 ? `${p.missedDosesToday} Missed Today` : 'On Schedule'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Schedule and Status */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading Patient Schedule...</div>
          ) : patientData ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Adherence Rate</div>
                  <div className="text-2xl font-black text-teal-600 mt-1">
                    {patientData.analytics?.adherencePercentage || 100}%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Missed Doses (Recent)</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {patientData.recentMissed?.length || 0}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Adherence Risk Level</div>
                  <div className="text-base font-bold text-slate-800 mt-2 uppercase">
                    {patientData.analytics?.riskScore || 'LOW'}
                  </div>
                </div>
              </div>

              {/* Missed Doses Alert Banner */}
              {patientData.recentMissed && patientData.recentMissed.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Caregiver Alert: Missed Doses Requiring Attention</span>
                  </div>
                  {patientData.recentMissed.map((m: any) => (
                    <div key={m.id} className="p-2.5 bg-white rounded-xl border border-rose-100 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{m.medicationName}</span>
                        <span className="text-slate-500 ml-2">Scheduled: {m.scheduledTime}</span>
                      </div>
                      <span className="text-rose-600 font-bold text-[11px]">Dose Missed</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-rose-700 italic pt-1">
                    Reminder: Do not advise taking an extra dose. Check with your healthcare professional if unsure.
                  </p>
                </div>
              )}

              {/* Today's Schedule (Read-Only) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Today's Medication Schedule</h3>
                    <p className="text-xs text-slate-500">Live monitoring of intake events</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {patientData.todaySchedules?.map((sch: MedicationSchedule) => (
                    <div key={sch.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{sch.medicationName}</span>
                          {getStatusBadge(sch.status)}
                        </div>
                        <div className="text-slate-600 mt-1">
                          Dosage: {sch.dosage} • Time: {sch.scheduledTime} ({sch.timeOfDay})
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Instructions: {sch.instructions} • {sch.foodInstruction}
                        </div>
                      </div>

                      <div className="text-right">
                        {sch.actualTakenTime ? (
                          <div className="text-emerald-700 font-semibold text-xs">
                            Taken at {new Date(sch.actualTakenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs font-mono">
                            {sch.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-Ups Section */}
              {patientData.followUps && patientData.followUps.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Caregiver Follow-Up Notes</h3>
                  <div className="space-y-2">
                    {patientData.followUps.map((flw: any) => (
                      <div key={flw.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                        <div className="font-bold text-slate-900">{flw.reason}</div>
                        <div className="text-slate-700 mt-0.5 font-medium">Recommended: {flw.actionRequired}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
