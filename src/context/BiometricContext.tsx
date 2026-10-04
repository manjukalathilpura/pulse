import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerBiometricPasskey,
  verifyBiometricPasskey,
} from '../utils/webAuthnUtils';
import { StaffMember } from '../types';

export type SecureScope = 'payroll' | 'clients' | 'all';

export interface RegisteredCredential {
  credentialId: string;
  registeredAt: string;
  algorithm: string;
  deviceLabel: string;
}

export interface SecurityPolicy {
  requireForPayroll: boolean;
  requireForClients: boolean;
  autoLockMinutes: number; // 0 means lock immediately on tab leave, otherwise N minutes
}

interface BiometricContextType {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  isCheckingHardware: boolean;

  // Unlock states
  isPayrollUnlocked: boolean;
  isClientsUnlocked: boolean;
  lastUnlockedTimestamp: number | null;

  // Registered credentials per staff member ID
  registeredCredentials: Record<string, RegisteredCredential>;
  hasCredentialForCurrentStaff: (staffId: string) => boolean;

  // Security policy
  policy: SecurityPolicy;
  updatePolicy: (updates: Partial<SecurityPolicy>) => void;

  // Actions
  authenticateWithBiometrics: (
    staff: StaffMember,
    scope: SecureScope
  ) => Promise<{ success: boolean; error?: string; usedFallback?: boolean }>;
  authenticateWithPin: (pin: string, scope: SecureScope) => { success: boolean; error?: string };
  registerPasskeyForStaff: (
    staff: StaffMember
  ) => Promise<{ success: boolean; error?: string; credentialId?: string }>;
  removePasskeyForStaff: (staffId: string) => void;
  lockScope: (scope: SecureScope) => void;
  lockAll: () => void;
  setBackupPin: (newPin: string) => void;
  backupPin: string;

  // Diagnostic info
  lastAuthMethod: 'webauthn_biometric' | 'backup_pin' | 'simulated_passkey' | null;
}

const STORAGE_KEYS = {
  CREDENTIALS: 'fieldpulse_webauthn_credentials_v1',
  POLICY: 'fieldpulse_security_policy_v1',
  BACKUP_PIN: 'fieldpulse_backup_pin_v1',
};

const DEFAULT_POLICY: SecurityPolicy = {
  requireForPayroll: true,
  requireForClients: true,
  autoLockMinutes: 5,
};

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasPlatformAuthenticator, setHasPlatformAuthenticator] = useState<boolean>(false);
  const [isCheckingHardware, setIsCheckingHardware] = useState<boolean>(true);

  // Unlocked scopes state (in-memory for security, resets on page reload)
  const [isPayrollUnlocked, setIsPayrollUnlocked] = useState<boolean>(false);
  const [isClientsUnlocked, setIsClientsUnlocked] = useState<boolean>(false);
  const [lastUnlockedTimestamp, setLastUnlockedTimestamp] = useState<number | null>(null);
  const [lastAuthMethod, setLastAuthMethod] = useState<'webauthn_biometric' | 'backup_pin' | 'simulated_passkey' | null>(null);

  // Registered WebAuthn credentials
  const [registeredCredentials, setRegisteredCredentials] = useState<Record<string, RegisteredCredential>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Security policy
  const [policy, setPolicyState] = useState<SecurityPolicy>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POLICY);
      return saved ? { ...DEFAULT_POLICY, ...JSON.parse(saved) } : DEFAULT_POLICY;
    } catch {
      return DEFAULT_POLICY;
    }
  });

  // Backup PIN (default: '1234')
  const [backupPin, setBackupPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.BACKUP_PIN) || '1234';
  });

  // Hardware detection on mount
  useEffect(() => {
    let isMounted = true;
    const checkHardware = async () => {
      setIsCheckingHardware(true);
      const supported = isWebAuthnSupported();
      let platformAvail = false;
      if (supported) {
        platformAvail = await isPlatformAuthenticatorAvailable();
      }
      if (isMounted) {
        setIsSupported(supported);
        setHasPlatformAuthenticator(platformAvail);
        setIsCheckingHardware(false);
      }
    };
    checkHardware();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save registered credentials
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(registeredCredentials));
  }, [registeredCredentials]);

  // Save policy
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(policy));
  }, [policy]);

  // Save PIN
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUP_PIN, backupPin);
  }, [backupPin]);

  // Auto-lock timer effect
  useEffect(() => {
    if (!lastUnlockedTimestamp || policy.autoLockMinutes <= 0) return;

    const checkTimeout = () => {
      const elapsedMinutes = (Date.now() - lastUnlockedTimestamp) / (1000 * 60);
      if (elapsedMinutes >= policy.autoLockMinutes) {
        setIsPayrollUnlocked(false);
        setIsClientsUnlocked(false);
        setLastUnlockedTimestamp(null);
      }
    };

    const interval = setInterval(checkTimeout, 10000);
    return () => clearInterval(interval);
  }, [lastUnlockedTimestamp, policy.autoLockMinutes]);

  const hasCredentialForCurrentStaff = useCallback(
    (staffId: string) => {
      return !!registeredCredentials[staffId];
    },
    [registeredCredentials]
  );

  const updatePolicy = (updates: Partial<SecurityPolicy>) => {
    setPolicyState((prev) => ({ ...prev, ...updates }));
  };

  const setBackupPin = (newPin: string) => {
    setBackupPinState(newPin);
  };

  const applyUnlock = (scope: SecureScope) => {
    const now = Date.now();
    setLastUnlockedTimestamp(now);
    if (scope === 'payroll' || scope === 'all') {
      setIsPayrollUnlocked(true);
    }
    if (scope === 'clients' || scope === 'all') {
      setIsClientsUnlocked(true);
    }
  };

  // Primary WebAuthn biometric authentication
  const authenticateWithBiometrics = async (
    staff: StaffMember,
    scope: SecureScope
  ): Promise<{ success: boolean; error?: string; usedFallback?: boolean }> => {
    const userCred = registeredCredentials[staff.id];

    // Try standard Web Authentication API first
    if (isSupported) {
      try {
        const verifyResult = await verifyBiometricPasskey(userCred?.credentialId);
        if (verifyResult.success) {
          applyUnlock(scope);
          setLastAuthMethod('webauthn_biometric');
          return { success: true };
        } else {
          // If native verification returned specific user rejection or error
          return {
            success: false,
            error: verifyResult.error || 'Biometric verification did not complete.',
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          error: `WebAuthn verification failed: ${msg}`,
        };
      }
    }

    return {
      success: false,
      error: 'Web Authentication API is not supported on this platform/browser.',
    };
  };

  // Backup PIN verification
  const authenticateWithPin = (
    pin: string,
    scope: SecureScope
  ): { success: boolean; error?: string } => {
    if (pin === backupPin) {
      applyUnlock(scope);
      setLastAuthMethod('backup_pin');
      return { success: true };
    }
    return {
      success: false,
      error: 'Invalid security PIN. Please try again.',
    };
  };

  // Register WebAuthn passkey for staff
  const registerPasskeyForStaff = async (
    staff: StaffMember
  ): Promise<{ success: boolean; error?: string; credentialId?: string }> => {
    if (!isSupported) {
      return {
        success: false,
        error: 'Web Authentication API not available in this browser environment.',
      };
    }

    const res = await registerBiometricPasskey(staff);
    if (res.success && res.credentialId) {
      setRegisteredCredentials((prev) => ({
        ...prev,
        [staff.id]: {
          credentialId: res.credentialId!,
          registeredAt: new Date().toISOString(),
          algorithm: res.algorithm || 'FIDO2 ES256',
          deviceLabel: navigator.userAgent.includes('Mobile')
            ? 'Mobile Biometric Sensor (Touch ID / Face ID)'
            : 'Platform Authenticator / Security Key',
        },
      }));
      return { success: true, credentialId: res.credentialId };
    }

    return {
      success: false,
      error: res.error || 'Could not complete biometric passkey enrollment.',
    };
  };

  const removePasskeyForStaff = (staffId: string) => {
    setRegisteredCredentials((prev) => {
      const copy = { ...prev };
      delete copy[staffId];
      return copy;
    });
  };

  const lockScope = (scope: SecureScope) => {
    if (scope === 'payroll' || scope === 'all') {
      setIsPayrollUnlocked(false);
    }
    if (scope === 'clients' || scope === 'all') {
      setIsClientsUnlocked(false);
    }
    if (!isPayrollUnlocked && !isClientsUnlocked) {
      setLastUnlockedTimestamp(null);
    }
  };

  const lockAll = () => {
    setIsPayrollUnlocked(false);
    setIsClientsUnlocked(false);
    setLastUnlockedTimestamp(null);
    setLastAuthMethod(null);
  };

  return (
    <BiometricContext.Provider
      value={{
        isSupported,
        hasPlatformAuthenticator,
        isCheckingHardware,
        isPayrollUnlocked,
        isClientsUnlocked,
        lastUnlockedTimestamp,
        registeredCredentials,
        hasCredentialForCurrentStaff,
        policy,
        updatePolicy,
        authenticateWithBiometrics,
        authenticateWithPin,
        registerPasskeyForStaff,
        removePasskeyForStaff,
        lockScope,
        lockAll,
        setBackupPin,
        backupPin,
        lastAuthMethod,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometricAuth = () => {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometricAuth must be used within a BiometricProvider');
  }
  return context;
};
