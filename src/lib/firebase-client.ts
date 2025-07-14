import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:demo',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMO'
};

// Initialize Firebase client SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development (disabled for production use)
// if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
//   // Only connect to emulators on client side and if not already connected
//   if (!auth.app.options.apiKey?.includes('demo-')) {
//     try {
//       connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//     } catch {
//       console.log('Auth emulator already connected');
//     }
//   }
//   
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch {
//     console.log('Firestore emulator already connected');
//   }
// }

export default app;