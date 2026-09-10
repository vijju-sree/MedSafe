import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Pill, RefreshCw, AlertTriangle, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const PharmacistDashboard: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal states
  const [refillModalItem, setRefillModalItem] = useState<any | null>(null);
  const [refillQty, setRefillQty] = useState<number>(30);
  const [noteModalItem, setNoteModalItem] = useState<any | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('Refill dispensed after verifying absence of acute contraindications.');

  const fetchQueue = async () => {
    try {
      const res = await api.getPharmacistQueue();
      setQueue(res.queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleRecordRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillModalItem) return;
    try {
      await api.recordRefill({
        medicationId: refillModalItem.id,
        quantity: refillQty
      });
      setFeedback(`Refill recorded. ${refillQty} units added to ${refillModalItem.name}.`);
      setTimeout(() => setFeedback(null), 3000);
      setRefillModalItem(null);
      fetchQueue();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddReviewNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalItem) return;
    try {
      await api.addPharmacistNotes({
        patientId: noteModalItem.patient?.patientId,
        prescriptionId: noteModalItem.prescription?.id,
        notes: reviewNote
      });
      setFeedback('Pharmacist safety review notes logged into patient file.');
      setTimeout(() => setFeedback(null), 3000);
      setNoteModalItem(null);
      fetchQueue();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Pill className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">Pharmacy & Refill Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review prescriptions, track refill schedules, identify potential safety signals, and record dispensing events
          </p>
        </div>

        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium">
          Professional Standard: Pharmacists do not modify doctor prescriptions without clinical authorization.
        </div>
      </div>

      {/* Refill Queue Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Prescription & Refill Queue</h2>
            <p className="text-xs text-slate-500">Patients with active or approaching renewal regimens</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            {queue.length} Active Rx
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading Pharmacy Queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No prescriptions in queue.</div>
        ) : (
          <div className="space-y-4">
            {queue.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{item.patient?.name}</span>
                    <span className="font-mono text-xs text-slate-500 ml-2">({item.patient?.patientId})</span>
                    <span className="text-xs text-slate-500 ml-3">Prescription: <strong className="font-mono">{item.prescription?.prescriptionId}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.prescription?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                      item.prescription?.status === 'EXPIRING' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {item.prescription?.status}
                    </span>
                    <button
                      onClick={() => setNoteModalItem(item)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      + Add Review Notes
                    </button>
                  </div>
                </div>

                {/* Safety Signals in this item */}
                {item.safetyAlerts && item.safetyAlerts.length > 0 && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pharmacist Attention Signal:</span>
                    </div>
                    {item.safetyAlerts.map((a: any) => (
                      <p key={a.id} className="text-xs text-amber-800 pl-5">
                        • {a.title}: {a.description}
                      </p>
                    ))}
                  </div>
                )}

                {/* Medications List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Prescribed Medications:</h4>
                  {item.medications?.map((m: any) => (
                    <div key={m.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{m.name} {m.strength}</div>
                        <div className="text-slate-500 mt-0.5">
                          Dosage: {m.dosageAmount} {m.dosageUnit} • Frequency: {m.frequency} • Remaining: <strong>{m.totalQuantity} units</strong>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Refill Target Date: {m.refillDate || 'Scheduled with renewal'}
                        </div>
                      </div>

                      <button
                        onClick={() => setRefillModalItem(m)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm self-start sm:self-center"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Dispense Refill</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refill Dispensing Modal */}
      {refillModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Record Pharmacy Refill: {refillModalItem.name}
            </h3>
            <p className="text-xs text-slate-500">
              This will update the patient's inventory and schedule next expected refill interval.
            </p>

            <form onSubmit={handleRecordRefill} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity Dispensed (Units)</label>
                <input
                  type="number"
                  required
                  value={refillQty}
                  onChange={(e) => setRefillQty(parseInt(e.target.value, 10))}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefillModalItem(null)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Confirm Dispensing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Review Notes Modal */}
      {noteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Add Pharmacist Review Notes
            </h3>
            <p className="text-xs text-slate-500">
              Notes are attached to clinical history for doctor oversight without altering the prescription.
            </p>

            <form onSubmit={handleAddReviewNotes} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Pharmacist Notes</label>
                <textarea
                  rows={4}
                  required
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteModalItem(null)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
