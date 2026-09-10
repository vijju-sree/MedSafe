import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DemoToolbar } from './components/DemoToolbar';
import { ReminderModal } from './components/ReminderModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { LabDashboard } from './pages/LabDashboard';
import { ClinicHospitalDashboard } from './pages/ClinicHospitalDashboard';
import { CaregiverDashboard } from './pages/CaregiverDashboard';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ReceptionistDashboard } from './pages/ReceptionistDashboard';
import { api } from './api/client';
import { NotificationItem, MedicationSchedule } from './types';
import { soundService } from './utils/sound';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [activeReminder, setActiveReminder] = useState<MedicationSchedule | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const pid = user.patientId || 'PAT10001';
      const res = await api.getNotifications(pid);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  };

  const prevNotifIdsRef = useRef<Set<string> | null>(null);
  const dismissedScheduleIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user, refreshTrigger]);

  // Sound triggers strictly when a new notification arrives
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      if (prevNotifIdsRef.current === null) {
        prevNotifIdsRef.current = new Set();
      }
      return;
    }

    const currentIds = new Set(notifications.map((n) => n.id));

    // First load: memorize existing notifications so sound is not played for historical items
    if (prevNotifIdsRef.current === null) {
      prevNotifIdsRef.current = currentIds;
      return;
    }

    // Identify newly arrived unread notifications
    const newlyArrived = notifications.filter(
      (n) => !n.readStatus && !prevNotifIdsRef.current!.has(n.id)
    );

    if (newlyArrived.length > 0) {
      const hasMedReminder = newlyArrived.some((n) => n.type === 'MEDICATION_REMINDER');
      // If it's general notifications only (prescription, test, bill, report), play ping once
      if (!hasMedReminder) {
        soundService.playNotificationPing();
      }
      // Medication reminder sound will be played strictly ONCE by the ReminderModal when it appears
    }

    prevNotifIdsRef.current = currentIds;
  }, [notifications]);

  // Check for newly delivered unread reminders and show reminder modal
  useEffect(() => {
    if (!user || user.role !== 'PATIENT') return;
    const latestReminder = notifications.find(
      (n) =>
        n.type === 'MEDICATION_REMINDER' &&
        !n.readStatus &&
        n.metadata?.scheduleId &&
        !dismissedScheduleIdsRef.current.has(n.metadata.scheduleId)
    );

    // If there's an unread reminder notification and modal isn't already showing
    if (latestReminder && !activeReminder && latestReminder.metadata?.scheduleId) {
      const targetScheduleId = latestReminder.metadata.scheduleId;
      api
        .getPatientSchedule(user.patientId || 'PAT10001')
        .then((res) => {
          const item = res.schedules.find((s) => s.id === targetScheduleId);
          if (item && item.status === 'UPCOMING' && !dismissedScheduleIdsRef.current.has(item.id)) {
            setActiveReminder(item);
          }
        })
        .catch(console.error);
    }
  }, [notifications, user, activeReminder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">Loading MedSafe Platform...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Landing page, Login page, or Register page
  if (!user) {
    if (isRegisterMode) {
      return (
        <RegisterPage
          onBackToLogin={() => {
            setIsRegisterMode(false);
            setIsLoginMode(true);
          }}
          onRegisteredSuccess={() => {
            setIsRegisterMode(false);
            setIsLoginMode(true);
          }}
        />
      );
    }
    if (isLoginMode) {
      return (
        <LoginPage
          onBack={() => setIsLoginMode(false)}
          onGoToRegister={() => {
            setIsLoginMode(false);
            setIsRegisterMode(true);
          }}
        />
      );
    }
    return (
      <LandingPage
        onGoToLogin={() => setIsLoginMode(true)}
        onGoToRegister={() => setIsRegisterMode(true)}
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Main Role Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {user.role === 'PATIENT' && (
          <PatientDashboard
            key={`${user.patientId || 'PAT10001'}-${refreshTrigger}`}
            patientId={user.patientId || 'PAT10001'}
            onOpenReminderModal={(sch) => setActiveReminder(sch)}
          />
        )}

        {user.role === 'DOCTOR' && <DoctorDashboard key={refreshTrigger} />}

        {user.role === 'LAB' && <LabDashboard key={refreshTrigger} />}

        {(user.role === 'CLINIC' || user.role === 'HOSPITAL') && (
          <ClinicHospitalDashboard key={refreshTrigger} />
        )}

        {user.role === 'CAREGIVER' && <CaregiverDashboard key={refreshTrigger} />}

        {user.role === 'PHARMACIST' && <PharmacistDashboard key={refreshTrigger} />}

        {user.role === 'ADMIN' && <AdminDashboard key={refreshTrigger} />}
        {user.role === 'RECEPTIONIST' && <ReceptionistDashboard key={refreshTrigger} />}
      </main>

      {/* Floating Demo / Test Mode Toolbar */}
      <DemoToolbar
        onEventTriggered={() => {
          setRefreshTrigger((prev) => prev + 1);
          fetchNotifications();
        }}
        onOpenReminderModal={(sch) => {
          if (sch?.id) {
            dismissedScheduleIdsRef.current.delete(sch.id);
          }
          setActiveReminder(sch);
        }}
      />

      {/* Real-time Medication Reminder Modal */}
      {activeReminder && (
        <ReminderModal
          schedule={activeReminder}
          onClose={() => {
            if (activeReminder?.id) {
              dismissedScheduleIdsRef.current.add(activeReminder.id);
            }
            setActiveReminder(null);
          }}
          onStatusUpdated={() => {
            setRefreshTrigger((prev) => prev + 1);
            fetchNotifications();
          }}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        patientId={user.patientId || 'PAT10001'}
        onRefresh={() => fetchNotifications()}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
