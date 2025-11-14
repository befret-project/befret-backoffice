import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'befret-development';

    // Check if we have full service account credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Individual environment variables
      const serviceAccount = {
        type: "service_account",
        project_id: projectId,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || '',
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || ''
      } as any; // Type assertion car Firebase Admin accepte un ServiceAccount partiel
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      // For local development - initialize without credentials
      // This will use Application Default Credentials (ADC) or emulator
      console.warn('⚠️  No Firebase credentials found. Initializing without credentials for local development.');
      console.warn('⚠️  Make sure you are authenticated with: gcloud auth application-default login');
      initializeApp({
        projectId,
      });
    }
  }
};

initializeFirebaseAdmin();

export const adminDb = getFirestore();
export const adminAuth = getAuth();

// Helper functions for common operations
export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid token');
  }
};

export const getUserByUid = async (uid: string) => {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('User not found');
  }
};

export const setCustomUserClaims = async (uid: string, claims: Record<string, unknown>) => {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new Error('Failed to set user claims');
  }
};

// Firestore helper functions
export const getDocument = async (collection: string, docId: string) => {
  try {
    const doc = await adminDb.collection(collection).doc(docId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collection}:`, error);
    throw new Error('Failed to fetch document');
  }
};

export const getCollection = async (collection: string, limit?: number) => {
  try {
    const collectionRef = adminDb.collection(collection);
    const query = limit ? collectionRef.limit(limit) : collectionRef;
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting collection ${collection}:`, error);
    throw new Error('Failed to fetch collection');
  }
};

export const createDocument = async (collection: string, data: Record<string, unknown>, docId?: string) => {
  try {
    if (docId) {
      await adminDb.collection(collection).doc(docId).set(data);
      return docId;
    } else {
      const docRef = await adminDb.collection(collection).add(data);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error creating document in ${collection}:`, error);
    throw new Error('Failed to create document');
  }
};

export const updateDocument = async (collection: string, docId: string, data: Record<string, unknown>) => {
  try {
    await adminDb.collection(collection).doc(docId).update(data);
  } catch (error) {
    console.error(`Error updating document in ${collection}:`, error);
    throw new Error('Failed to update document');
  }
};

export const deleteDocument = async (collection: string, docId: string) => {
  try {
    await adminDb.collection(collection).doc(docId).delete();
  } catch (error) {
    console.error(`Error deleting document from ${collection}:`, error);
    throw new Error('Failed to delete document');
  }
};