import React, { useState } from 'react';
import { useBiometricAuth } from '../../context/BiometricContext';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Fingerprint,
  Lock,
  Unlock,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  RefreshCw,
  Trash2,
  Clock,
  Sliders,
} from 'lucide-react';

interface BiometricSettingsModalProps {
  onClose: () => void;
}

export const BiometricSettingsModal: React.FC<BiometricSettingsModalProps> = ({ onClose }) => {
  const {
    isSupported,
    hasPlatformAuthenticator,
    isCheckingHardware,
    registeredCredentials,
    registerPasskeyForStaff,
    removePasskeyForStaff,
    hasCredentialForCurrentStaff,
    policy,
    updatePolicy,
    lockAll,
    backupPin,
    setBackupPin,
    isPayrollUnlocked,
    isClientsUnlocked,
  } = useBiometricAuth();

  const { currentStaff, addToast } = useApp();

  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<boolean>(false);

  // PIN editing
  const [isEditingPin, setIsEditingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const hasPasskey = hasCredentialForCurrentStaff(currentStaff.id);
  const currentCred = registeredCredentials[currentStaff.id];

  const handleRegisterPasskey = async () => {
    setIsEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(false);

    try {
      const res = await registerPasskeyForStaff(currentStaff);
      if (res.success) {
        setEnrollSuccess(true);
        addToast(`Biometric passkey registered successfully for ${currentStaff.name}`, 'success');
      } else {
        setEnrollError(res.error || 'Failed to register biometric passkey.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEnrollError(msg);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(newPin)) {
      setPinError('PIN must be 4 to 8 numeric digits.');
      return;
    }
    setBackupPin(newPin);
    setIsEditingPin(false);
    setNewPin('');
    setPinError(null);
    addToast('Security backup PIN updated successfully.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Biometric Security & WebAuthn
              </h3>
              <p className="text-xs text-slate-500">
                Hardware-backed authentication for confidential payroll and client records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Active Employee Passkey Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentStaff.avatarUrl}
                  alt={currentStaff.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {currentStaff.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {currentStaff.role.replace('_', ' ')} · {currentStaff.email}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {hasPasskey ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-3 h-3" />
                    Not Enrolled
                  </span>
                )}
              </div>
            </div>

            {hasPasskey && currentCred && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Algorithm:</span>
                  <span>{currentCred.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device:</span>
                  <span className="truncate max-w-[200px]">{currentCred.deviceLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credential ID:</span>
                  <span className="truncate max-w-[150px]">{currentCred.credentialId.slice(0, 16)}...</span>
                </div>
              </div>
            )}

            {/* Registration Actions */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isEnrolling}
                onClick={handleRegisterPasskey}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
              >
                {isEnrolling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enrolling Passkey...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>{hasPasskey ? 'Re-enroll Biometric Passkey' : 'Enroll Touch ID / Face ID'}</span>
                  </>
                )}
              </button>

              {hasPasskey && (
                <button
                  type="button"
                  onClick={() => {
                    removePasskeyForStaff(currentStaff.id);
                    addToast(`Passkey removed for ${currentStaff.name}`, 'info');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Passkey</span>
                </button>
              )}
            </div>

            {enrollSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>WebAuthn platform credential successfully saved for this workforce member.</span>
              </div>
            )}

            {enrollError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{enrollError}</span>
              </div>
            )}
          </div>

          {/* Scope Protection Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Protected Workforce Domains
            </h4>

            <div className="space-y-2">
              {/* Payroll Toggle */}
              <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                <div className="space-y-0.5 pr-2">
                  <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Payroll & Wage Records</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-mono">
                      Financial
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Require biometric verification before displaying salaries, payslips, and bank details.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={policy.requireForPayroll}
                  onChange={(e) => updatePolicy({ requireForPayroll: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* Clients CRM Toggle */}
              <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                <div className="space-y-0.5 pr-2">
                  <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Client CRM & Follow-Up Contacts</span>
                    <span className="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded font-mono">
                      Confidential
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Require biometric verification before displaying client WhatsApp/email contacts and deal values.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={policy.requireForClients}
                  onChange={(e) => updatePolicy({ requireForClients: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Auto-Lock Timeout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Session Auto-Lock Timeout
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {policy.autoLockMinutes === 0 ? 'Immediate on Tab Leave' : `${policy.autoLockMinutes} minutes`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    updatePolicy({ autoLockMinutes: mins });
                    addToast(`Auto-lock timeout set to ${mins} minutes`, 'info');
                  }}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                    policy.autoLockMinutes === mins
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Backup PIN Manager */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Security Backup PIN
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Current: {backupPin ? '••••' : 'None'}
              </span>
            </div>

            {!isEditingPin ? (
              <button
                type="button"
                onClick={() => setIsEditingPin(true)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Change Backup PIN
              </button>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="New 4-8 digit PIN"
                    className="flex-1 px-3 py-1.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPin(false);
                      setPinError(null);
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
                {pinError && <div className="text-xs text-rose-600">{pinError}</div>}
              </form>
            )}
          </div>

          {/* Quick Lock All CTA */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500">
              Session status: {isPayrollUnlocked || isClientsUnlocked ? 'Unlocked' : 'Locked'}
            </div>
            <button
              type="button"
              onClick={() => {
                lockAll();
                addToast('All sensitive domains locked immediately.', 'info');
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock All Sensitive Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
