import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBiometricAuth } from '../context/BiometricContext';
import {
  Smartphone,
  Maximize2,
  RotateCcw,
  User,
  Shield,
  Briefcase,
  AlertTriangle,
  Fingerprint,
  Lock,
  Unlock,
} from 'lucide-react';
import { BiometricSettingsModal } from './biometrics/BiometricSettingsModal';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    currentStaffId,
    setCurrentStaffId,
    staffList,
    currentStaff,
    isPhoneFrame,
    setIsPhoneFrame,
    resetToDemoData,
    clientsList,
  } = useApp();

  const {
    isPayrollUnlocked,
    isClientsUnlocked,
    hasCredentialForCurrentStaff,
  } = useBiometricAuth();

  const [showBiometricsModal, setShowBiometricsModal] = useState<boolean>(false);

  // Calculate overdue follow-ups for indicator
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = clientsList.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate < todayStr
  ).length;

  const isAnyUnlocked = isPayrollUnlocked || isClientsUnlocked;
  const isEnrolled = hasCredentialForCurrentStaff(currentStaff.id);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-blue-500/20">
            FP
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
              FieldPulse
            </span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Cloud Mobile Operations
            </span>
          </div>
        </div>

        {/* Zone 2: Role Switcher & Persona Select */}
        <div className="flex items-center gap-2">
          {/* Segmented Role Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setRole('field_staff')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap min-h-[32px] cursor-pointer ${
                role === 'field_staff'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Field Staff</span>
            </button>

            <button
              onClick={() => setRole('manager')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap min-h-[32px] cursor-pointer ${
                role === 'manager'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Manager Suite</span>
            </button>
          </div>

          {/* Persona selector for Field Staff testing */}
          {role === 'field_staff' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currentStaffId}
                onChange={(e) => setCurrentStaffId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
                aria-label="Active field worker persona"
              >
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Overdue alert badge if any */}
          {overdueCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[11px] font-medium"
              title={`${overdueCount} client follow-ups are overdue`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline font-mono">{overdueCount} Overdue</span>
            </div>
          )}
        </div>

        {/* Zone 3: Biometric Security, Phone frame switch, Reset data */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Biometric WebAuthn Status Trigger */}
          <button
            type="button"
            onClick={() => setShowBiometricsModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all min-h-[34px] cursor-pointer ${
              isAnyUnlocked
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : isEnrolled
                ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="WebAuthn Biometric Security & Passkey Manager"
          >
            <Fingerprint className={`w-3.5 h-3.5 ${isAnyUnlocked ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span className="hidden md:inline">
              {isAnyUnlocked ? 'Biometrics Active' : 'Passkey Protected'}
            </span>
            {isAnyUnlocked ? (
              <Unlock className="w-3 h-3 text-emerald-600" />
            ) : (
              <Lock className="w-3 h-3 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => setIsPhoneFrame((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors min-h-[34px] cursor-pointer"
            title={isPhoneFrame ? 'Expand to Full Viewport' : 'Switch to Mobile Smartphone Frame'}
          >
            {isPhoneFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">Wide View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden lg:inline">Phone Frame</span>
              </>
            )}
          </button>

          <button
            onClick={resetToDemoData}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset to initial demo data"
            aria-label="Reset demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showBiometricsModal && (
        <BiometricSettingsModal onClose={() => setShowBiometricsModal(false)} />
      )}
    </header>
  );
};
