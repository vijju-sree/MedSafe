import React, { useState } from 'react';
import { NotificationItem } from '../types';
import {
  Bell,
  X,
  CheckCheck,
  Clock,
  AlertTriangle,
  Pill,
  ShieldAlert,
  FileText,
  Trash2,
  Radio,
  Layers,
  FlaskConical,
  Receipt
} from 'lucide-react';
import { api } from '../api/client';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  patientId: string;
  onRefresh: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  patientId,
  onRefresh
}) => {
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(patientId, id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoadingAction(true);
    try {
      await api.markAllNotificationsRead(patientId);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleClear = async (id: string) => {
    try {
      await api.clearNotification(patientId, id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications from your active notification list?')) return;
    setLoadingAction(true);
    try {
      await api.clearAllNotifications(patientId);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (category === 'SYSTEM_DISPATCH') {
      return <Radio className="w-4 h-4 text-purple-600" />;
    }
    switch (type) {
      case 'MEDICATION_REMINDER':
        return <Pill className="w-4 h-4 text-sky-600" />;
      case 'DOSE_MISSED':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'SAFETY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'TEST_ORDERED':
      case 'REPORT_READY':
        return <FlaskConical className="w-4 h-4 text-indigo-600" />;
      case 'BILL_GENERATED':
      case 'PAYMENT_RECEIVED':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'REFILL_REMINDER':
      case 'PRESCRIPTION_EXPIRING':
        return <Clock className="w-4 h-4 text-cyan-600" />;
      case 'MEDICATION_PLAN_CHANGED':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">Notification Center</h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {unreadCount} unread • {notifications.length} active
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bulk Action Controls */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={handleMarkAllRead}
                disabled={loadingAction || unreadCount === 0}
                className="text-sky-700 hover:text-sky-900 font-bold flex items-center space-x-1 disabled:opacity-40"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>

              <button
                onClick={handleClearAll}
                disabled={loadingAction}
                className="text-slate-500 hover:text-rose-700 font-bold flex items-center space-x-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">No active notifications</p>
              <p className="text-xs text-slate-400 mt-1">Cleared notifications are removed from this list</p>
            </div>
          ) : (
            notifications.map(notif => {
              const isDispatch = notif.category === 'SYSTEM_DISPATCH';
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all relative ${
                    notif.readStatus
                      ? 'bg-white border-slate-200 text-slate-700'
                      : isDispatch
                      ? 'bg-purple-50/70 border-purple-200 shadow-xs'
                      : 'bg-sky-50/70 border-sky-200 shadow-xs'
                  }`}
                >
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                        isDispatch
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isDispatch ? <Radio className="w-2.5 h-2.5 mr-0.5" /> : <Layers className="w-2.5 h-2.5 mr-0.5" />}
                      <span>{isDispatch ? 'System Dispatch' : 'Notification'}</span>
                    </span>

                    <div className="flex items-center space-x-1">
                      {!notif.readStatus && (
                        <span className="inline-block w-2 h-2 rounded-full bg-sky-600 animate-pulse" title="Unread" />
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 shrink-0 mt-0.5">
                        {getIcon(notif.type, notif.category)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{notif.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Mark Read + Clear / Delete */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>

                    <div className="flex items-center space-x-2">
                      {!notif.readStatus && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 font-bold flex items-center space-x-1 text-[10px]"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Mark Read</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleClear(notif.id)}
                        className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-1 text-[10px]"
                        title="Clear from active list"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
