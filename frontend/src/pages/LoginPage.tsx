import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Pill, Lock, Mail, ArrowLeft, CheckCircle2, Shield, Stethoscope, User, Heart } from 'lucide-react';

interface LoginPageProps {
  onBack: () => void;
  onGoToRegister?: () => void;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onGoToRegister, initialRole = 'PATIENT' }) => {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole === 'PHARMACIST' || initialRole === 'LAB' || initialRole === 'CLINIC' ? 'PATIENT' : initialRole);
  const [email, setEmail] = useState<string>('anjali@medsafe.local');
  const [password, setPassword] = useState<string>('password123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isReceptionistMode, setIsReceptionistMode] = useState<boolean>(false);
  const [selectedHospitalDemo, setSelectedHospitalDemo] = useState<'ABC' | 'XYZ'>('ABC');

  // Exactly 4 login roles: Patient, Doctor, Caretaker, Admin
  const allowedRoles: { role: UserRole; label: string }[] = [
    { role: 'PATIENT', label: 'Patient' },
    { role: 'DOCTOR', label: 'Doctor' },
    { role: 'CAREGIVER', label: 'Caretaker' },
    { role: 'ADMIN', label: 'Admin' },
  ];

  const demoAccounts: Record<string, { email: string; name: string; id: string }> = {
    PATIENT: { email: 'anjali@medsafe.local', name: 'Anjali Sharma', id: 'PAT10001' },
    DOCTOR: { email: 'dr.ravi@medsafe.local', name: 'Dr. Ravi Kumar, MD', id: 'DOC10001' },
    CAREGIVER: { email: 'priya@medsafe.local', name: 'Priya Sharma (Caretaker)', id: 'CAR10001' },
    ADMIN: { email: 'admin@medsafe.local', name: 'Rajesh Varma (Admin)', id: 'ADM10001' },
  };

  const receptionistAccounts = {
    ABC: {
      hospitalName: 'ABC Hospital',
      hospitalId: 'HOSP-00125',
      receptionistId: 'REC-0018',
      name: 'Priya Sharma (ABC Reception)',
      email: 'receptionist.abc@medsafe.local',
      password: 'DemoPass123!'
    },
    XYZ: {
      hospitalName: 'XYZ Hospital',
      hospitalId: 'HOSP-00482',
      receptionistId: 'REC-0091',
      name: 'Anil Verma (XYZ Reception)',
      email: 'receptionist.xyz@medsafe.local',
      password: 'DemoPass123!'
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setIsReceptionistMode(false);
    setRole(newRole);
    if (demoAccounts[newRole]) {
      setEmail(demoAccounts[newRole].email);
    }
    setPassword('password123');
    setError(null);
  };

  const handleSwitchToReceptionist = (hosp: 'ABC' | 'XYZ') => {
    setIsReceptionistMode(true);
    setSelectedHospitalDemo(hosp);
    setRole('RECEPTIONIST');
    setEmail(receptionistAccounts[hosp].email);
    setPassword(receptionistAccounts[hosp].password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, isReceptionistMode ? 'RECEPTIONIST' : role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Pill className="w-7 h-7 transform -rotate-45" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          {isReceptionistMode ? 'Hospital Reception Portal' : 'Sign In to MedSafe'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {isReceptionistMode
            ? 'Front desk patient intake & appointment coordination'
            : 'Role-based secure authentication & adherence portal'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-8">
          {!isReceptionistMode ? (
            <>
              {/* Exactly 4 Role Tabs */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Login Role:</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-center">
                  {allowedRoles.map(({ role: r, label }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${
                        role === r && !isReceptionistMode
                          ? 'bg-white text-sky-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Demo Account Chip */}
              <div className="mb-4 p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{demoAccounts[role]?.name || 'User'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{demoAccounts[role]?.email || email}</div>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-sky-100 text-sky-800 tracking-wide">
                  {role === 'CAREGIVER' ? 'CARETAKER' : role}
                </span>
              </div>

              {/* Receptionist Portal Quick Access Banner */}
              <div className="mb-6 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-medium">Hospital Staff Desk?</span>
                <button
                  type="button"
                  onClick={() => handleSwitchToReceptionist('ABC')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center space-x-1"
                >
                  <span>Access Receptionist Portal →</span>
                </button>
              </div>
            </>
          ) : (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Select Hospital Facility:</span>
                <button
                  type="button"
                  onClick={() => handleRoleChange('PATIENT')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                >
                  ← Back to Primary Roles
                </button>
              </div>

              {/* Toggle ABC Hospital vs XYZ Hospital */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchToReceptionist('ABC')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedHospitalDemo === 'ABC'
                      ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold">ABC Hospital</p>
                  <p className="text-[10px] font-mono text-sky-700">HOSP-00125 • REC-0018</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchToReceptionist('XYZ')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedHospitalDemo === 'XYZ'
                      ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold">XYZ Hospital</p>
                  <p className="text-[10px] font-mono text-sky-700">HOSP-00482 • REC-0091</p>
                </button>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-950">
                    {receptionistAccounts[selectedHospitalDemo].name}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-mono">
                    {receptionistAccounts[selectedHospitalDemo].email}
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 tracking-wide">
                  RECEPTIONIST
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="name@medsafe.local"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>
                  Sign In as {role === 'CAREGIVER' ? 'Caretaker' : (role.charAt(0) + role.slice(1).toLowerCase())}
                </span>
              )}
            </button>
          </form>

          {onGoToRegister && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">Need an account? </span>
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Direct Registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
