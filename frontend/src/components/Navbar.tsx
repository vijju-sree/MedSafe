import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pill, Bell, LogOut, Shield, User as UserIcon, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '../utils/sound';

interface NavbarProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications, unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(soundService.isSoundEnabled());

  const handleToggleSound = () => {
    const nextState = soundService.toggleSound();
    setIsAudioEnabled(nextState);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'DOCTOR':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'CAREGIVER':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'PHARMACIST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Pill className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">Med<span className="text-sky-600">Safe</span></span>
              <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">v2.0</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Medication Management & Safety Platform</p>
          </div>
        </div>

        {/* User Info & Actions */}
        {user ? (
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Safety Boundary Notice pill */}
            <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Safety Signals Only — Non-Diagnostic</span>
            </div>

            {/* Audio Alert Toggle & Test Button */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-colors focus:outline-none flex items-center space-x-1.5 text-xs font-semibold ${
                isAudioEnabled
                  ? 'text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              title={isAudioEnabled ? "Alert Sound: Active (Click to mute or test)" : "Alert Sound: Muted (Click to enable)"}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 text-sky-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline text-[11px]">{isAudioEnabled ? 'Sound ON' : 'Muted'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile and Role Pill */}
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</div>
                <div className="flex items-center justify-end space-x-1 mt-0.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-full border ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                  {user.patientId && (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {user.patientId}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <UserIcon className="w-5 h-5" />
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Not logged in</span>
          </div>
        )}
      </div>
    </header>
  );
};
