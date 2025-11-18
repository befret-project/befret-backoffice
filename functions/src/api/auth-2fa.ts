/**
 * Firebase Functions for Two-Factor Authentication (2FA)
 * Provides endpoints for setting up, verifying, and managing 2FA
 */

import * as admin from 'firebase-admin';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

const ISSUER_NAME = 'Befret Backoffice';
const ALGORITHM = 'sha256';

/**
 * Generate a secret for 2FA setup
 * GET /api/auth/2fa/setup?userId=xxx
 */
export async function setupTwoFactor(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    const userId = request.query.userId as string;

    if (!userId) {
      return response.status(400).json({
        success: false,
        message: 'userId est requis'
      });
    }

    // Verify user exists
    const userDoc = await db.collection('backoffice_users').doc(userId).get();
    if (!userDoc.exists) {
      return response.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userData = userDoc.data();
    const userEmail = userData?.email || 'user@befret.com';

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${ISSUER_NAME} (${userEmail})`,
      issuer: ISSUER_NAME,
      length: 32
    });

    // Generate QR code URL
    const qrCodeUrl = secret.otpauth_url || '';

    // Store temporary secret in Firestore (will be confirmed later)
    await db.collection('backoffice_users').doc(userId).update({
      twoFactorSecretTemp: secret.base32,
      twoFactorSetupStartedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return response.status(200).json({
      success: true,
      secret: {
        secret: secret.base32,
        qrCodeUrl: qrCodeUrl,
        manualEntryKey: secret.base32
      }
    });
  } catch (error: any) {
    console.error('Error in setupTwoFactor:', error);
    return response.status(500).json({
      success: false,
      message: 'Erreur lors de la configuration du 2FA'
    });
  }
}

/**
 * Verify a 2FA token
 * POST /api/auth/2fa/verify
 * Body: { userId: string, token: string }
 */
export async function verifyTwoFactor(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    const { userId, token } = request.body;

    if (!userId || !token) {
      return response.status(400).json({
        success: false,
        valid: false,
        message: 'userId et token sont requis'
      });
    }

    // Get user's 2FA secret
    const userDoc = await db.collection('backoffice_users').doc(userId).get();
    if (!userDoc.exists) {
      return response.status(404).json({
        success: false,
        valid: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userData = userDoc.data();
    const secret = userData?.twoFactorSecret || userData?.twoFactorSecretTemp;

    if (!secret) {
      return response.status(400).json({
        success: false,
        valid: false,
        message: '2FA non configuré pour cet utilisateur'
      });
    }

    // Check if token is a backup code first
    if (userData?.backupCodes && Array.isArray(userData.backupCodes)) {
      const hashedToken = hashBackupCode(token);
      const backupCodeIndex = userData.backupCodes.indexOf(hashedToken);

      if (backupCodeIndex !== -1) {
        // Valid backup code - remove it from the list
        const updatedBackupCodes = [...userData.backupCodes];
        updatedBackupCodes.splice(backupCodeIndex, 1);

        await db.collection('backoffice_users').doc(userId).update({
          backupCodes: updatedBackupCodes,
          twoFactorLastUsedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return response.status(200).json({
          success: true,
          valid: true,
          message: 'Code de secours valide'
        });
      }
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after
    });

    if (verified) {
      // Update last used timestamp
      await db.collection('backoffice_users').doc(userId).update({
        twoFactorLastUsedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return response.status(200).json({
      success: true,
      valid: verified,
      message: verified ? 'Token valide' : 'Token invalide'
    });
  } catch (error: any) {
    console.error('Error in verifyTwoFactor:', error);
    return response.status(500).json({
      success: false,
      valid: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
}

/**
 * Enable 2FA after verification
 * POST /api/auth/2fa/enable
 * Body: { userId: string, token: string, secret: string }
 */
export async function enableTwoFactor(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    const { userId, token, secret } = request.body;

    if (!userId || !token || !secret) {
      return response.status(400).json({
        success: false,
        enabled: false,
        message: 'userId, token et secret sont requis'
      });
    }

    // Verify the token with the provided secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return response.status(400).json({
        success: false,
        enabled: false,
        message: 'Token invalide. Veuillez réessayer'
      });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Enable 2FA and store the secret
    await db.collection('backoffice_users').doc(userId).update({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorEnrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      backupCodes: hashedBackupCodes,
      twoFactorSecretTemp: admin.firestore.FieldValue.delete(),
      twoFactorSetupStartedAt: admin.firestore.FieldValue.delete()
    });

    return response.status(200).json({
      success: true,
      enabled: true,
      backupCodes: backupCodes, // Return plain codes only once
      message: '2FA activé avec succès'
    });
  } catch (error: any) {
    console.error('Error in enableTwoFactor:', error);
    return response.status(500).json({
      success: false,
      enabled: false,
      message: 'Erreur lors de l\'activation du 2FA'
    });
  }
}

/**
 * Disable 2FA
 * POST /api/auth/2fa/disable
 * Body: { userId: string, password: string }
 */
export async function disableTwoFactor(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    const { userId, password } = request.body;

    if (!userId || !password) {
      return response.status(400).json({
        success: false,
        message: 'userId et password sont requis'
      });
    }

    // Get user data
    const userDoc = await db.collection('backoffice_users').doc(userId).get();
    if (!userDoc.exists) {
      return response.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userData = userDoc.data();
    const email = userData?.email;

    if (!email) {
      return response.status(400).json({
        success: false,
        message: 'Email utilisateur non trouvé'
      });
    }

    // Verify password with Firebase Auth
    try {
      await admin.auth().getUserByEmail(email);
      // Note: Firebase Admin SDK doesn't provide password verification
      // In production, you should verify the password using Firebase Auth client SDK
      // or implement custom token verification
    } catch (authError) {
      return response.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Disable 2FA
    await db.collection('backoffice_users').doc(userId).update({
      twoFactorEnabled: false,
      twoFactorSecret: admin.firestore.FieldValue.delete(),
      twoFactorEnrolledAt: admin.firestore.FieldValue.delete(),
      twoFactorLastUsedAt: admin.firestore.FieldValue.delete(),
      backupCodes: admin.firestore.FieldValue.delete(),
      twoFactorSecretTemp: admin.firestore.FieldValue.delete(),
      twoFactorSetupStartedAt: admin.firestore.FieldValue.delete()
    });

    return response.status(200).json({
      success: true,
      message: '2FA désactivé avec succès'
    });
  } catch (error: any) {
    console.error('Error in disableTwoFactor:', error);
    return response.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du 2FA'
    });
  }
}

/**
 * Get 2FA status for a user
 * GET /api/auth/2fa/status?userId=xxx
 */
export async function getTwoFactorStatus(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    const userId = request.query.userId as string;

    if (!userId) {
      return response.status(400).json({
        success: false,
        message: 'userId est requis'
      });
    }

    const userDoc = await db.collection('backoffice_users').doc(userId).get();
    if (!userDoc.exists) {
      return response.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userData = userDoc.data();
    const backupCodesCount = userData?.backupCodes?.length || 0;

    return response.status(200).json({
      success: true,
      status: {
        enabled: userData?.twoFactorEnabled || false,
        enrolledAt: userData?.twoFactorEnrolledAt?.toDate?.()?.toISOString() || null,
        lastUsedAt: userData?.twoFactorLastUsedAt?.toDate?.()?.toISOString() || null,
        backupCodesRemaining: backupCodesCount
      }
    });
  } catch (error: any) {
    console.error('Error in getTwoFactorStatus:', error);
    return response.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut 2FA'
    });
  }
}

/**
 * Helper function to generate backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
    codes.push(code);
  }
  return codes;
}

/**
 * Helper function to hash backup codes
 */
function hashBackupCode(code: string): string {
  return crypto.createHash(ALGORITHM).update(code).digest('hex');
}
