/**
 * Client-side service for Two-Factor Authentication (2FA)
 */

import type {
  TwoFactorSetupResponse,
  TwoFactorVerifyResponse,
  TwoFactorEnableResponse,
  TwoFactorDisableResponse,
  TwoFactorStatus
} from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-rcai6nfrla-ew.a.run.app';

/**
 * Setup 2FA for a user - generates secret and QR code
 */
export async function setupTwoFactor(userId: string): Promise<TwoFactorSetupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/2fa/setup?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la configuration du 2FA');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Setup 2FA error:', error);
    throw new Error(error.message || 'Erreur lors de la configuration du 2FA');
  }
}

/**
 * Verify a 2FA token
 */
export async function verifyTwoFactor(
  userId: string,
  token: string
): Promise<TwoFactorVerifyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, token }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du token');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    throw new Error(error.message || 'Erreur lors de la vérification du token');
  }
}

/**
 * Enable 2FA after verification
 */
export async function enableTwoFactor(
  userId: string,
  token: string,
  secret: string
): Promise<TwoFactorEnableResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/2fa/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, token, secret }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'activation du 2FA');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    throw new Error(error.message || 'Erreur lors de l\'activation du 2FA');
  }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(
  userId: string,
  password: string
): Promise<TwoFactorDisableResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, password }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la désactivation du 2FA');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    throw new Error(error.message || 'Erreur lors de la désactivation du 2FA');
  }
}

/**
 * Get 2FA status for a user
 */
export async function getTwoFactorStatus(userId: string): Promise<{ success: boolean; status: TwoFactorStatus }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/2fa/status?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du statut 2FA');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get 2FA status error:', error);
    throw new Error(error.message || 'Erreur lors de la récupération du statut 2FA');
  }
}

/**
 * Store 2FA token temporarily during login
 */
export function storeTempTwoFactorData(userId: string, email: string): void {
  sessionStorage.setItem('2fa_temp_user', JSON.stringify({ userId, email, timestamp: Date.now() }));
}

/**
 * Get temporary 2FA data during login
 */
export function getTempTwoFactorData(): { userId: string; email: string } | null {
  try {
    const data = sessionStorage.getItem('2fa_temp_user');
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Check if data is not older than 5 minutes
    if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
      sessionStorage.removeItem('2fa_temp_user');
      return null;
    }

    return { userId: parsed.userId, email: parsed.email };
  } catch {
    return null;
  }
}

/**
 * Clear temporary 2FA data
 */
export function clearTempTwoFactorData(): void {
  sessionStorage.removeItem('2fa_temp_user');
}
