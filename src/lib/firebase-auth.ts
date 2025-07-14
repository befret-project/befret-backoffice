// Authentification Firebase côté client pour l'environnement déployé
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase-client';
import { BackofficeRole, ROLE_PERMISSIONS } from '@/types/auth';

export interface BefretUser {
  id: string;
  email: string;
  name?: string;
  role: BackofficeRole;
  permissions: string[];
  accessToken: string;
}

// Get user role from Firebase custom claims or Firestore
const getUserRole = async (firebaseUser: User): Promise<BackofficeRole> => {
  try {
    // First try to get role from custom claims
    const idTokenResult = await firebaseUser.getIdTokenResult();
    if (idTokenResult.claims.role) {
      return idTokenResult.claims.role as BackofficeRole;
    }
    
    // Fallback: default role
    return BackofficeRole.LOGISTIC_OPERATOR;
  } catch (error) {
    console.error('Error getting user role:', error);
    return BackofficeRole.LOGISTIC_OPERATOR;
  }
};

export const signIn = async (email: string, password: string): Promise<BefretUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken();

    // Déterminer le rôle via Firebase custom claims
    const role = await getUserRole(firebaseUser);
    const permissions = ROLE_PERMISSIONS[role];

    const befretUser: BefretUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: firebaseUser.displayName || 'Utilisateur',
      role,
      permissions,
      accessToken: idToken
    };

    // Stocker dans localStorage pour persistence
    localStorage.setItem('befret_user', JSON.stringify(befretUser));
    
    return befretUser;
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw new Error('Email ou mot de passe incorrect');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('befret_user');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

export const getCurrentUser = (): BefretUser | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('befret_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('befret_user');
    }
  }
  return null;
};

export const onAuthStateChange = (callback: (user: BefretUser | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const storedUser = getCurrentUser();
      if (storedUser) {
        callback(storedUser);
      } else {
        // Reconstruire l'utilisateur depuis Firebase
        const role = await getUserRole(firebaseUser);
        const befretUser: BefretUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Utilisateur',
          role,
          permissions: ROLE_PERMISSIONS[role],
          accessToken: ''
        };
        localStorage.setItem('befret_user', JSON.stringify(befretUser));
        callback(befretUser);
      }
    } else {
      localStorage.removeItem('befret_user');
      callback(null);
    }
  });
};