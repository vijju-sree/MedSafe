import React, { useState, useEffect } from 'react';
import { Pill, Clock, AlertCircle, CheckCircle2, XCircle, X } from 'lucide-react';
import { api } from '../api/client';
import { soundService } from '../utils/sound';

interface ReminderModalProps {
  schedule: any;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ schedule, onClose, onStatusUpdated }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ status: string; message: string; guidance?: string } | null>(null);

  // Play reminder sound strictly ONCE for this scheduled reminder
  useEffect(() => {
    if (schedule?.id) {
      soundService.playReminderChimeForSchedule(schedule.id);
    }
  }, [schedule?.id]);

  if (!schedule) return null;

  const handleTaken = async () => {
    setLoading(true);
    try {
      const res = await api.recordTaken({ scheduleId: schedule.id });
      soundService.playSuccessSound();
      setFeedback({
        status: res.status,
        message: res.message
      });
      onStatusUpdated();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(`Error marking dose taken: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await api.recordSkipped({
        scheduleId: schedule.id,
        reason: 'Skipped by patient from reminder alert.'
      });
      setFeedback({
        status: 'SKIPPED',
        message: 'Dose skipped. Follow-up recorded for review.',
        guidance: 'A follow-up item has been created in your Follow-Up dashboard. Please follow doctor instructions if you experience symptoms.'
      });
      onStatusUpdated();
    } catch (err: any) {
      alert(`Error recording skipped dose: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMissed = async () => {
    setLoading(true);
    try {
      const res = await api.recordMissed({ scheduleId: schedule.id });
      soundService.playWarningSound();
      setFeedback({
        status: 'MISSED',
        message: 'Dose recorded as Missed.',
        guidance: res.guidance
      });
      onStatusUpdated();
    } catch (err: any) {
      alert(`Error marking dose missed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-sky-200 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-cyan-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-xs">
              <Pill className="w-6 h-6 text-white transform -rotate-45" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-sky-200 block">MedSafe Reminder Alert</span>
              <h3 className="text-lg font-black leading-tight">Medicine Time</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            title="Dismiss / Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {feedback ? (
            <div className="text-center py-4 space-y-3">
              {feedback.status === 'MISSED' ? (
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
                </div>
              ) : feedback.status === 'SKIPPED' ? (
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              <h4 className="text-lg font-bold text-slate-900">{feedback.message}</h4>
              {feedback.guidance && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
                  <strong>Clinical Notice & Follow-up:</strong>
                  <p className="mt-1">{feedback.guidance}</p>
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close Reminder
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Medicine Details Card */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide block">Scheduled Dose Prompt</span>
                    <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {schedule.medicationName} ({schedule.dosage}) is scheduled now
                    </h4>
                  </div>
                  <span className="shrink-0 flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-600 text-white shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{schedule.scheduledTime}</span>
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-sky-200/60 text-xs text-slate-700 space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-900">Instructions: </span>
                    <span>{schedule.instructions || 'Take as directed by doctor'}</span>
                  </div>
                  {schedule.foodInstruction && (
                    <div>
                      <span className="font-bold text-slate-900">Food Instruction: </span>
                      <span className="inline-block font-semibold px-2 py-0.5 bg-sky-200/70 text-sky-900 rounded-md text-[11px]">
                        {schedule.foodInstruction.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Safety notice */}
              <div className="flex items-start space-x-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  MedSafe adherence tracking. Skipping a dose will log a follow-up action for clinical monitoring.
                </span>
              </div>

              {/* Primary Actions: Taken / Skip / Dismiss */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleTaken}
                  disabled={loading}
                  className="flex items-center justify-center space-x-1.5 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-98 disabled:opacity-50 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TAKEN</span>
                </button>

                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex items-center justify-center space-x-1.5 py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all transform active:scale-98 disabled:opacity-50 text-xs"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>SKIP</span>
                </button>

                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex items-center justify-center space-x-1.5 py-3 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all transform active:scale-98 disabled:opacity-50 text-xs"
                >
                  <X className="w-4 h-4 text-slate-600" />
                  <span>DISMISS</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={handleMissed}
                  disabled={loading}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline"
                >
                  Can't take? Report as Missed Dose
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

