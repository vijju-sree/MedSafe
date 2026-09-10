import React, { useState } from 'react';
import { api } from '../api/client';
import { UserRole } from '../types';
import {
  Pill,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Stethoscope,
  Building,
  Microscope,
  Award
} from 'lucide-react';

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegisteredSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin, onRegisteredSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');

  // Common Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91 98765 43210');

  // Patient Fields
  const [dob, setDob] = useState<string>('1996-05-18');
  const [gender, setGender] = useState<string>('FEMALE');
  const [address, setAddress] = useState<string>('Flat 301, Sunrise Heights, Banjara Hills, Hyderabad');
  const [emergencyName, setEmergencyName] = useState<string>('Ramesh Patel');
  const [emergencyRel, setEmergencyRel] = useState<string>('Brother');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('+91 98765 22335');

  // Doctor / Pharmacist / Lab / Clinic Fields
  const [licenseNumber, setLicenseNumber] = useState<string>('MCI-REG-88412');
  const [specialty, setSpecialty] = useState<string>('Internal Medicine');
  const [facilityName, setFacilityName] = useState<string>('Care Health Diagnostics');
  const [capabilities, setCapabilities] = useState<string>('Hematology, Biochemistry, Radiology, Lipid Profile');

  // Caregiver Fields
  const [targetPatientId, setTargetPatientId] = useState<string>('PAT10001');
  const [caregiverRelationship, setCaregiverRelationship] = useState<string>('Daughter');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    role: UserRole;
    referenceId?: string;
    verificationStatus: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedRole === 'PATIENT') {
        const res = await api.registerPatient({
          name,
          email,
          password,
          dob,
          gender,
          phone,
          address,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
          emergencyContactRel: emergencyRel,
        });

        localStorage.setItem('medsafe_token', res.token);
        setSuccessInfo({
          role: 'PATIENT',
          referenceId: res.patient.patientId,
          verificationStatus: 'VERIFIED',
          message: res.message,
        });

        setTimeout(() => {
          onRegisteredSuccess();
        }, 2200);
      } else {
        const payload: any = {
          role: selectedRole,
          name,
          email,
          password,
          phone,
          licenseNumber: licenseNumber || `LIC-${Date.now().toString().slice(-5)}`,
          specialty: selectedRole === 'DOCTOR' ? specialty : undefined,
          pharmacyName: selectedRole === 'PHARMACIST' ? facilityName : undefined,
          clinicName: selectedRole === 'CLINIC' ? facilityName : undefined,
          address,
          testCapabilities: selectedRole === 'LAB' ? capabilities.split(',').map((s) => s.trim()) : undefined,
          relationship: selectedRole === 'CAREGIVER' ? caregiverRelationship : undefined,
        };

        const res = await api.registerProfessional(payload);
        if (res.token) {
          localStorage.setItem('medsafe_token', res.token);
        }

        setSuccessInfo({
          role: selectedRole,
          referenceId: res.user?.doctorId || res.user?.pharmacistId || res.user?.labId || res.user?.id,
          verificationStatus: res.verificationStatus,
          message: res.message,
        });

        // If auto-verified or caregiver, proceed to dashboard
        if (res.verificationStatus === 'VERIFIED') {
          setTimeout(() => {
            onRegisteredSuccess();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <button
          onClick={onBackToLogin}
          className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Sign In</span>
        </button>

        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Pill className="w-7 h-7 transform -rotate-45" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          MedSafe Direct Registration
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Create an account for Patients, Clinicians, or Caretakers
        </p>

        {/* Role Selector Tabs */}
        <div className="mt-6 p-1.5 bg-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-1">
          {[
            { role: 'PATIENT' as UserRole, label: 'Patient', icon: User },
            { role: 'DOCTOR' as UserRole, label: 'Doctor', icon: Stethoscope },
            { role: 'CAREGIVER' as UserRole, label: 'Caretaker', icon: Heart },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = selectedRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  setSelectedRole(item.role);
                  setSuccessInfo(null);
                  setError(null);
                }}
                className={`flex-1 min-w-[90px] flex items-center justify-center space-x-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  isSel
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 sm:px-8">
          {successInfo ? (
            <div className="text-center py-8 space-y-4 animate-fadeIn">
              {successInfo.verificationStatus === 'PENDING' ? (
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
                  <Clock className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              )}

              <h3 className="text-xl font-extrabold text-slate-900">
                {successInfo.verificationStatus === 'PENDING'
                  ? 'Registration Submitted for Verification'
                  : 'Registration Complete!'}
              </h3>

              <div
                className={`p-4 rounded-2xl max-w-md mx-auto border ${
                  successInfo.verificationStatus === 'PENDING'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <span className="text-xs text-slate-500 block">Assigned Reference ID:</span>
                <span className="font-mono text-xl font-black text-slate-800 tracking-wider">
                  {successInfo.referenceId || 'MEDSAFE-REG'}
                </span>
                <div className="mt-2 text-xs font-semibold text-slate-700">
                  Status:{' '}
                  <span
                    className={`uppercase font-black ${
                      successInfo.verificationStatus === 'PENDING'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {successInfo.verificationStatus}
                  </span>
                </div>
              </div>

              {successInfo.verificationStatus === 'PENDING' ? (
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 text-left space-y-2 border border-slate-200">
                  <div className="font-bold text-slate-800 flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Professional Credential Verification Queue:</span>
                  </div>
                  <p>
                    Your medical or facility license has been submitted to the MedSafe Administrative Board. An administrator will verify your credentials. Once verified, full prescribing and diagnostic publication capabilities will be activated.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    💡 <em>In this hackathon demo, you can switch to the Admin role using the toolbar to approve this registration with 1 click!</em>
                  </p>
                  <div className="pt-2 text-center">
                    <button
                      onClick={onBackToLogin}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs"
                    >
                      Proceed to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600">Redirecting directly to your MedSafe portal...</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-shake">
                  {error}
                </div>
              )}

              {/* Notice Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-2 text-xs text-slate-600">
                <Award className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Registering as <strong className="text-slate-900">{selectedRole}</strong>.
                  {selectedRole !== 'PATIENT' && selectedRole !== 'CAREGIVER' && (
                    <span className="text-amber-700 font-semibold ml-1">Requires professional credential verification.</span>
                  )}
                </span>
              </div>

              {/* Common Fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {selectedRole === 'LAB'
                        ? 'Diagnostic Lab Name'
                        : selectedRole === 'CLINIC'
                        ? 'Clinic / Hospital Name'
                        : 'Full Legal Name'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder={
                          selectedRole === 'LAB'
                            ? 'Apex Diagnostics'
                            : selectedRole === 'DOCTOR'
                            ? 'Dr. Aarti Patel'
                            : 'Anjali Sharma'
                        }
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="user@medsafe.local"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact Phone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient-Specific Fields */}
              {selectedRole === 'PATIENT' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Demographics & Safety Contacts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Biological Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center">
                      <Heart className="w-3.5 h-3.5 mr-1 text-rose-500" /> Emergency Contact / Next of Kin
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        required
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Relationship (e.g. Spouse)"
                        required
                        value={emergencyRel}
                        onChange={(e) => setEmergencyRel(e.target.value)}
                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Contact Phone"
                        required
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor-Specific Fields */}
              {selectedRole === 'DOCTOR' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Practice Credentials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Council License Number</label>
                      <input
                        type="text"
                        required
                        placeholder="MCI-REG-88412"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Specialty</label>
                      <input
                        type="text"
                        required
                        placeholder="Cardiology / General Medicine"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lab-Specific Fields */}
              {selectedRole === 'LAB' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Diagnostic Center Accreditations</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">NABL / Clinical Establishment License</label>
                      <input
                        type="text"
                        required
                        placeholder="NABL-MED-7712"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Test Capabilities</label>
                      <input
                        type="text"
                        required
                        placeholder="Hematology, Biochemistry, Radiology"
                        value={capabilities}
                        onChange={(e) => setCapabilities(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Clinic / Hospital Fields */}
              {selectedRole === 'CLINIC' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Facility Registration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Establishment ID</label>
                      <input
                        type="text"
                        required
                        placeholder="FAC-REG-1092"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Location / Address</label>
                      <input
                        type="text"
                        required
                        placeholder="Main Road, Hyderabad"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pharmacist Fields */}
              {selectedRole === 'PHARMACIST' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pharmacy Council License</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacy Council Registration (RPh)</label>
                      <input
                        type="text"
                        required
                        placeholder="PCI-REG-9912"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensing Pharmacy Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Apollo MedPlus Pharmacy"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Caregiver Fields */}
              {selectedRole === 'CAREGIVER' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Patient Linkage & Consent</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Patient ID to Support</label>
                      <input
                        type="text"
                        required
                        placeholder="PAT10001"
                        value={targetPatientId}
                        onChange={(e) => setTargetPatientId(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship to Patient</label>
                      <input
                        type="text"
                        required
                        placeholder="Daughter / Son / Spouse / Primary Caregiver"
                        value={caregiverRelationship}
                        onChange={(e) => setCaregiverRelationship(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Register {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()} Profile</span>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
