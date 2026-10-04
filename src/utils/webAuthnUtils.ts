/**
 * Web Authentication API (WebAuthn / FIDO2) utilities for biometric verification.
 * Provides hardware-backed platform authentication (Touch ID, Face ID, Windows Hello, Android Biometrics)
 * with robust error handling and fallback capabilities.
 */

// Helper: Convert ArrayBuffer to Base64URL string
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: Convert Base64URL string to Uint8Array
export function base64UrlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Check if WebAuthn is supported in current environment
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials !== 'undefined';
}

// Check if a platform authenticator (TouchID, FaceID, Windows Hello, Android Fingerprint) is available
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

export interface BiometricRegistrationResult {
  success: boolean;
  credentialId?: string;
  rawId?: string;
  algorithm?: string;
  error?: string;
  isSimulatedFallback?: boolean;
}

export interface BiometricVerificationResult {
  success: boolean;
  error?: string;
  isSimulatedFallback?: boolean;
}

/**
 * Register a new platform biometric passkey for the workforce member using navigator.credentials.create
 */
export async function registerBiometricPasskey(
  staff: { id: string; name: string; email: string },
  rpName = 'FieldPulse Workforce Security'
): Promise<BiometricRegistrationResult> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Web Authentication API is not supported in this browser.',
    };
  }

  // Generate random 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // User ID as bytes
  const encoder = new TextEncoder();
  const userIdBuffer = encoder.encode(staff.id);

  // Relying Party domain (handle localhost or run.app)
  const rpId = window.location.hostname;

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: rpName,
      id: rpId === 'localhost' ? undefined : rpId,
    },
    user: {
      id: userIdBuffer,
      name: staff.email,
      displayName: staff.name,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256 (NIST P-256 with SHA-256)
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Hardware device biometric (Touch ID, Face ID, etc.)
      userVerification: 'required',        // Mandate biometric or device PIN
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Registration was cancelled or no credential returned.' };
    }

    const credentialId = credential.id || bufferToBase64Url(credential.rawId);

    return {
      success: true,
      credentialId,
      rawId: bufferToBase64Url(credential.rawId),
      algorithm: 'FIDO2 ES256 / WebAuthn Platform',
    };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    const errorName = errorObj.name || 'UnknownError';
    const errorMsg = errorObj.message || String(err);

    // Provide detailed diagnostics
    if (errorName === 'NotAllowedError') {
      return {
        success: false,
        error: 'Biometric registration was declined or timed out.',
      };
    } else if (errorName === 'SecurityError') {
      return {
        success: false,
        error: 'Security domain constraint: WebAuthn requires HTTPS or allowed iframe policy.',
      };
    } else if (errorName === 'NotSupportedError') {
      return {
        success: false,
        error: 'Platform authenticator not available on this device.',
      };
    }

    return {
      success: false,
      error: `WebAuthn error (${errorName}): ${errorMsg}`,
    };
  }
}

/**
 * Verify employee identity using WebAuthn navigator.credentials.get
 */
export async function verifyBiometricPasskey(
  credentialId?: string,
  rpName = 'FieldPulse Workforce Security'
): Promise<BiometricVerificationResult> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Web Authentication API is not supported in this browser.',
    };
  }

  // Generate random 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const rpId = window.location.hostname;

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: rpId === 'localhost' ? undefined : rpId,
    userVerification: 'required', // Mandates biometric fingerprint, face scan, or system lock
    timeout: 60000,
  };

  // If specific credential registered, constrain to it
  if (credentialId) {
    try {
      const credBuffer = base64UrlToBuffer(credentialId);
      publicKeyCredentialRequestOptions.allowCredentials = [
        {
          id: credBuffer as unknown as ArrayBuffer,
          type: 'public-key',
          transports: ['internal'],
        },
      ];
    } catch {
      // If parsing fails, proceed without allowCredentials filter to let device choose matching passkey
    }
  }

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return {
        success: false,
        error: 'Biometric verification was cancelled.',
      };
    }

    return {
      success: true,
    };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    const errorName = errorObj.name || 'UnknownError';
    const errorMsg = errorObj.message || String(err);

    if (errorName === 'NotAllowedError') {
      return {
        success: false,
        error: 'Biometric verification declined or timed out.',
      };
    } else if (errorName === 'SecurityError') {
      return {
        success: false,
        error: 'Security domain constraint: WebAuthn blocked in current iframe context.',
      };
    }

    return {
      success: false,
      error: `Authentication failed (${errorName}): ${errorMsg}`,
    };
  }
}
