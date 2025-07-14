// Server-side Firebase operations

let adminDb: any = null;
let adminAuth: any = null;

// Check if Firebase credentials are available
const hasFirebaseCredentials = () => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_PRIVATE_KEY)
  );
};

// Initialize Firebase Admin SDK only if credentials are available
const initializeFirebaseAdmin = async () => {
  if (typeof window !== 'undefined') return; // Client-side protection
  
  if (hasFirebaseCredentials()) {
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      const { getAuth } = await import('firebase-admin/auth');
      
      if (getApps().length === 0) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : {
              type: "service_account",
              project_id: process.env.FIREBASE_PROJECT_ID,
              private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
              private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              client_email: process.env.FIREBASE_CLIENT_EMAIL,
              client_id: process.env.FIREBASE_CLIENT_ID,
              auth_uri: "https://accounts.google.com/o/oauth2/auth",
              token_uri: "https://oauth2.googleapis.com/token",
              auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
              client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
            };

        initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      }
      
      adminDb = getFirestore();
      adminAuth = getAuth();
    } catch (error) {
      console.error('Firebase Admin initialization failed:', error);
      throw new Error('Firebase configuration required');
    }
  } else {
    console.error('Firebase credentials not found');
    throw new Error('Firebase credentials required');
  }
};

// Initialize only on server-side
if (typeof window === 'undefined') {
  initializeFirebaseAdmin();
}

// Export with fallback to mock
export { adminDb, adminAuth };

// Helper functions (server-side only)
export const verifyIdToken = async (idToken: string) => {
  if (typeof window !== 'undefined' || !adminAuth) {
    throw new Error('This function can only be called on the server');
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid token');
  }
};

export const getUserByUid = async (uid: string) => {
  if (typeof window !== 'undefined' || !adminAuth) {
    throw new Error('This function can only be called on the server');
  }
  
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('User not found');
  }
};