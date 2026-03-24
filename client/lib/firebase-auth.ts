import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth, db, firebaseEnabled } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getInitialCredits } from "./credits";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// -----------------------------
// Local mode (no Firebase config)
// -----------------------------
type LocalUserRecord = {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: string;
};

const LS_USERS_KEY = "lf_local_users_v1";
const LS_SESSION_KEY = "lf_local_session_v1";
export const AUTH_INTENT_KEY = "lf_auth_intent_v1";

function readLocalUsers(): Record<string, LocalUserRecord> {
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LocalUserRecord>;
  } catch {
    return {};
  }
}

function writeLocalUsers(users: Record<string, LocalUserRecord>) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function getLocalSessionUid(): string | null {
  return localStorage.getItem(LS_SESSION_KEY);
}

function setLocalSessionUid(uid: string | null) {
  if (uid) localStorage.setItem(LS_SESSION_KEY, uid);
  else localStorage.removeItem(LS_SESSION_KEY);
}

function localUserToAuthUser(u: LocalUserRecord): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL ?? null,
  };
}

async function ensureUserDocument(user: User) {
  if (!firebaseEnabled || !db) return;

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) return;

  const initialCredits = getInitialCredits("free");
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "User",
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
    credits: initialCredits,
    tier: "free",
    completedSurvey: false,
  });
}

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> => {
  try {
    // Local mode fallback
    if (!firebaseEnabled || !auth || !db) {
      const users = readLocalUsers();
      const normalized = email.trim().toLowerCase();
      if (users[normalized]) {
        throw new Error("Email already in use");
      }
      const uid = `local_${Math.random().toString(36).slice(2)}`;
      users[normalized] = {
        uid,
        email: normalized,
        password,
        displayName: displayName.trim() || "Founder",
        createdAt: new Date().toISOString(),
      };
      writeLocalUsers(users);

      // seed user data + credits into local storage DB (handled in firebase-database local mode)
      setLocalSessionUid(uid);
      return {
        uid,
        email: normalized,
        displayName: users[normalized].displayName,
        photoURL: null,
      };
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName,
    });

    // Create user document in Firestore with initial credits
    const userDocRef = doc(db, "users", user.uid);
    const initialCredits = getInitialCredits("free");

    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date().toISOString(),
      credits: initialCredits,
      tier: "free",
      completedSurvey: false,
    });

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    // Local mode fallback
    if (!firebaseEnabled || !auth) {
      const users = readLocalUsers();
      const normalized = email.trim().toLowerCase();
      const record = users[normalized];
      if (!record || record.password !== password) {
        throw new Error("Invalid email or password");
      }
      setLocalSessionUid(record.uid);
      return localUserToAuthUser(record);
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

/**
 * Sign out
 */
export const logOut = async (): Promise<void> => {
  try {
    if (!firebaseEnabled || !auth) {
      setLocalSessionUid(null);
      return;
    }
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): AuthUser | null => {
  if (!firebaseEnabled || !auth) {
    const uid = getLocalSessionUid();
    if (!uid) return null;
    const users = readLocalUsers();
    const record = Object.values(users).find((u) => u.uid === uid);
    return record ? localUserToAuthUser(record) : null;
  }

  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthState = (
  callback: (user: AuthUser | null) => void
) => {
  if (!firebaseEnabled || !auth) {
    // Local mode: fire once + listen for storage changes
    const emit = () => callback(getCurrentUser());
    emit();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SESSION_KEY) emit();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (
  uid: string
): Promise<Record<string, any> | null> => {
  try {
    if (!firebaseEnabled || !db) {
      // Local mode: store minimal profile in localStorage
      const users = readLocalUsers();
      const record = Object.values(users).find((u) => u.uid === uid);
      if (!record) return null;
      return {
        uid: record.uid,
        email: record.email,
        displayName: record.displayName,
        createdAt: record.createdAt,
        tier: "free",
        completedSurvey: false,
      };
    }

    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Get user data error:", error);
    throw error;
  }
};

/**
 * Update user data in Firestore
 */
export const updateUserData = async (
  uid: string,
  data: Record<string, any>
): Promise<void> => {
  try {
    if (!firebaseEnabled || !db) {
      // Local mode: no-op (credits handled elsewhere)
      return;
    }
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, data, { merge: true });
  } catch (error) {
    console.error("Update user data error:", error);
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    // Local mode fallback: simulate Google sign-in
    if (!firebaseEnabled || !auth) {
      console.warn("Firebase not enabled, using local mode for Google sign-in");
      const users = readLocalUsers();
      // Use a simulated Google email for local mode
      const uid = `local_${Math.random().toString(36).slice(2)}`;
      const displayName = "Google User";
      const googleEmail = `google_${uid}@local.example.com`;
      
      users[googleEmail] = {
        uid,
        email: googleEmail,
        password: "", // No password for OAuth users
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
        createdAt: new Date().toISOString(),
      };
      writeLocalUsers(users);
      setLocalSessionUid(uid);

      return {
        uid,
        email: googleEmail,
        displayName,
        photoURL: users[googleEmail].photoURL || null,
      };
    }

    console.log("Attempting Firebase Google sign-in...");
    const provider = new GoogleAuthProvider();
    
    // Add scopes to request specific information
    provider.addScope("profile");
    provider.addScope("email");
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    console.log("Google sign-in successful:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    await ensureUserDocument(user);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    if (error instanceof Error) {
      console.error("Error code:", (error as any).code);
      console.error("Error message:", error.message);
    }
    throw error;
  }
};

/**
 * Start Google sign-in using popup flow.
 */
export const startGooglePopup = async (): Promise<AuthUser> => {
  try {
    if (!firebaseEnabled || !auth) {
      return await signInWithGoogle();
    }

    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const userCredential = await signInWithPopup(auth, provider);
    await ensureUserDocument(userCredential.user);

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
  } catch (error) {
    console.error("Google popup sign-in error:", error);
    throw error;
  }
};

/**
 * Start Google sign-in using redirect flow.
 */
export const startGoogleRedirect = async (
  intent: "login" | "signup"
): Promise<AuthUser | null> => {
  try {
    if (!firebaseEnabled || !auth) {
      return await signInWithGoogle();
    }

    sessionStorage.setItem(AUTH_INTENT_KEY, intent);
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    await signInWithRedirect(auth, provider);
    return null;
  } catch (error) {
    console.error("Google redirect sign-in error:", error);
    throw error;
  }
};

/**
 * Sign in with Apple
 */
export const signInWithApple = async (): Promise<AuthUser> => {
  try {
    // Local mode fallback: simulate Apple sign-in
    if (!firebaseEnabled || !auth) {
      console.warn("Firebase not enabled, using local mode for Apple sign-in");
      const users = readLocalUsers();
      // Use a simulated Apple email for local mode
      const uid = `local_${Math.random().toString(36).slice(2)}`;
      const displayName = "Apple User";
      const appleEmail = `apple_${uid}@local.example.com`;
      
      users[appleEmail] = {
        uid,
        email: appleEmail,
        password: "", // No password for OAuth users
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
        createdAt: new Date().toISOString(),
      };
      writeLocalUsers(users);
      setLocalSessionUid(uid);

      return {
        uid,
        email: appleEmail,
        displayName,
        photoURL: users[appleEmail].photoURL || null,
      };
    }

    console.log("Attempting Firebase Apple sign-in...");
    const provider = new OAuthProvider("apple.com");
    
    // Add scopes to request specific information
    provider.addScope("email");
    provider.addScope("name");
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    console.log("Apple sign-in successful:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    await ensureUserDocument(user);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error("Apple sign-in error:", error);
    if (error instanceof Error) {
      console.error("Error code:", (error as any).code);
      console.error("Error message:", error.message);
    }
    throw error;
  }
};

/**
 * Start Apple sign-in using popup flow.
 */
export const startApplePopup = async (): Promise<AuthUser> => {
  try {
    if (!firebaseEnabled || !auth) {
      return await signInWithApple();
    }

    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const userCredential = await signInWithPopup(auth, provider);
    await ensureUserDocument(userCredential.user);

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
  } catch (error) {
    console.error("Apple popup sign-in error:", error);
    throw error;
  }
};

/**
 * Start Apple sign-in using redirect flow.
 */
export const startAppleRedirect = async (
  intent: "login" | "signup"
): Promise<AuthUser | null> => {
  try {
    if (!firebaseEnabled || !auth) {
      return await signInWithApple();
    }

    sessionStorage.setItem(AUTH_INTENT_KEY, intent);
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    await signInWithRedirect(auth, provider);
    return null;
  } catch (error) {
    console.error("Apple redirect sign-in error:", error);
    throw error;
  }
};

/**
 * Consume OAuth redirect result (if present).
 */
export const consumeAuthRedirectResult = async (): Promise<{
  user: AuthUser;
  intent: "login" | "signup" | null;
  isNewUser: boolean;
} | null> => {
  if (!firebaseEnabled || !auth) return null;

  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) return null;

    const info = getAdditionalUserInfo(result);
    const intent = (sessionStorage.getItem(AUTH_INTENT_KEY) as
      | "login"
      | "signup"
      | null) ?? null;
    sessionStorage.removeItem(AUTH_INTENT_KEY);

    await ensureUserDocument(result.user);

    return {
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      },
      intent,
      isNewUser: info?.isNewUser ?? false,
    };
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
};
