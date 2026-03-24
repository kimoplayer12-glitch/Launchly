import admin from "firebase-admin";

// Initialize Firebase Admin SDK
export function initializeFirebase() {
  try {
    // Check if already initialized
    const existingApp = admin.app();
    if (existingApp) {
      console.log("✓ Firebase already initialized");
      return existingApp;
    }
  } catch (e) {
    // App not initialized yet, which is expected
  }

  try {
    // Check if we have service account in environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      // Fallback: use databaseURL only
      admin.initializeApp({
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    console.log("✓ Firebase Admin SDK initialized successfully");
    return admin.app();
  } catch (error) {
    console.error("✗ Firebase initialization failed:", error);
    return null;
  }
}

// Get database instance
export function getDatabase() {
  try {
    const app = admin.app();
    return admin.database(app);
  } catch (error) {
    console.warn("⚠ Database not available");
    return null;
  }
}

