/**
 * Firebase Health Check
 * Verifies Firebase configuration and local mode fallback
 */

import { firebaseEnabled, app, auth, db, storage } from "./firebase";

export const getFirebaseStatus = () => {
  return {
    firebaseEnabled,
    hasApp: !!app,
    hasAuth: !!auth,
    hasDB: !!db,
    hasStorage: !!storage,
    mode: firebaseEnabled ? "Firebase" : "Local Mode",
    isHealthy: firebaseEnabled
      ? !!(app && auth && db && storage)
      : true, // Local mode is always healthy
  };
};

export const logFirebaseStatus = () => {
  const status = getFirebaseStatus();
  console.log(
    "%c Firebase Configuration Status:",
    "color: #4285f4; font-weight: bold",
    status
  );

  if (!firebaseEnabled) {
    console.log(
      "%c⚠️ Running in Local Mode - Firebase credentials not configured",
      "color: #fbbc04"
    );
    console.log(
      "To enable Firebase, add these environment variables to .env:",
      [
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_STORAGE_BUCKET",
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
        "VITE_FIREBASE_APP_ID",
      ]
    );
  } else if (!status.isHealthy) {
    console.error(
      "%c❌ Firebase is enabled but not properly initialized",
      "color: #ea4335"
    );
    console.error("Firebase Status Details:", {
      firebaseEnabled,
      app: !!app,
      auth: !!auth,
      db: !!db,
      storage: !!storage,
    });
  } else {
    console.log(
      "%c✅ Firebase is properly configured and ready",
      "color: #34a853"
    );
    console.log("Firebase Auth Provider:", auth?.app?.options?.projectId);
  }

  return status;
};
