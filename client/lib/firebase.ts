import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase is optional in this template.
 *
 * If the Firebase env vars are not provided, the app will run in "Local Mode"
 * (auth + credits stored in localStorage) so the project works out-of-the-box.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const;

function hasFirebaseConfig(cfg: typeof firebaseConfig) {
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

export const firebaseEnabled = hasFirebaseConfig(firebaseConfig);

export const app: FirebaseApp | null = firebaseEnabled
  ? initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Failed to set auth persistence:", err);
  });
}

export default app;
