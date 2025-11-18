'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import * as firebaseAuth from '@/lib/firebase-auth';
import type { BefretUser } from '@/lib/firebase-auth';

interface AuthContextType {
  user: BefretUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<BefretUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount and listen to auth state changes
  useEffect(() => {
    // Check for stored user on mount
    const storedUser = firebaseAuth.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);

    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      // Use Firebase Authentication directly
      const result = await firebaseAuth.signIn(email, password);

      // Check if 2FA is required
      if ('requiresTwoFactor' in result) {
        setLoading(false);
        return result; // Return 2FA requirement info
      }

      // Normal login
      setUser(result);
      setLoading(false);
      return result;
    } catch (error: any) {
      setLoading(false);
      // Translate Firebase errors to French
      const errorMessage = translateFirebaseError(error.code);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);

    try {
      // Use Firebase Google Authentication
      const befretUser = await firebaseAuth.signInWithGoogle();
      setUser(befretUser);
    } catch (error: any) {
      setLoading(false);
      throw error; // Error messages are already in French from firebase-auth.ts
    }
    setLoading(false);
  };

  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  return {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    hasPermission,
  };
};

// Helper function to translate Firebase error codes to French
function translateFirebaseError(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion',
    'auth/invalid-credential': 'Email ou mot de passe incorrect',
  };

  return errorMessages[code] || 'Erreur de connexion. Veuillez réessayer';
}

export { AuthContext };