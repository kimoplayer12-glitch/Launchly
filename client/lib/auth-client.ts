import {
  authResponseSchema,
  authUserSchema,
  loginSchema,
  signupSchema,
  type AuthResponse,
  type AuthUser,
} from "@shared/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase";

const AUTH_TOKEN_KEY = "zenith_auth_token";
const AUTH_REFRESH_TOKEN_KEY = "zenith_auth_refresh_token";
const AUTH_USER_KEY = "zenith_auth_user";
const AUTH_EVENT_NAME = "zenith-auth-change";
const FIREBASE_SECURE_TOKEN_URL = "https://securetoken.googleapis.com/v1/token";
const TOKEN_REFRESH_BUFFER_SECONDS = 60;

let refreshPromise: Promise<string | null> | null = null;

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = authUserSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

function base64UrlToJson(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(atob(padded));
}

function getTokenExp(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = base64UrlToJson(parts[1]);
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function shouldRefreshToken(token: string) {
  const exp = getTokenExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= TOKEN_REFRESH_BUFFER_SECONDS;
}

function setTokenValues(token: string, refreshToken?: string | null) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }
}

async function parseApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  if (!firebaseEnabled || !auth?.currentUser) {
    return null;
  }

  try {
    const idToken = await auth.currentUser.getIdToken(forceRefresh);
    if (idToken) {
      setTokenValues(idToken);
    }
    return idToken || null;
  } catch {
    return null;
  }
}

async function refreshWithStoredRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getAuthRefreshToken();
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!refreshToken || !apiKey) {
      return null;
    }

    const body = new URLSearchParams();
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);

    const response = await fetch(
      `${FIREBASE_SECURE_TOKEN_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "";
      if (
        errorMessage.includes("TOKEN_EXPIRED") ||
        errorMessage.includes("INVALID_REFRESH_TOKEN") ||
        errorMessage.includes("USER_DISABLED") ||
        errorMessage.includes("USER_NOT_FOUND")
      ) {
        clearAuthSession();
      }
      return null;
    }

    const nextToken =
      typeof payload?.id_token === "string" ? payload.id_token : null;
    const nextRefreshToken =
      typeof payload?.refresh_token === "string"
        ? payload.refresh_token
        : refreshToken;

    if (!nextToken) {
      return null;
    }

    setTokenValues(nextToken, nextRefreshToken);
    emitAuthChange();
    return nextToken;
  })()
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthRefreshToken() {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export async function getValidAuthToken(forceRefresh = false) {
  const firebaseToken = await getFirebaseIdToken(forceRefresh);
  if (firebaseToken) {
    return firebaseToken;
  }

  const token = getAuthToken();
  if (!token) {
    return null;
  }

  if (!forceRefresh && !shouldRefreshToken(token)) {
    return token;
  }

  const refreshed = await refreshWithStoredRefreshToken();
  return refreshed || token;
}

export function getStoredAuthUser() {
  return readStoredUser();
}

export function setAuthSession(response: AuthResponse) {
  setTokenValues(response.token, response.refreshToken);
  if (!response.refreshToken) {
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }
  writeStoredUser(response.user);
  emitAuthChange();
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  emitAuthChange();
}

async function authRequest(
  path: string,
  payload: Record<string, unknown>
): Promise<AuthResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseApiResponse(response);
  if (!response.ok) {
    throw new Error(body?.error || "Authentication request failed");
  }

  const parsed = authResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Received an invalid authentication response");
  }

  setAuthSession(parsed.data);
  return parsed.data;
}

export async function signupWithPassword(input: {
  email: string;
  password: string;
}) {
  const validated = signupSchema.safeParse(input);
  if (!validated.success) {
    const issue = validated.error.issues[0];
    throw new Error(issue?.message || "Invalid signup payload");
  }

  return authRequest("/api/auth/signup", validated.data);
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}) {
  const validated = loginSchema.safeParse(input);
  if (!validated.success) {
    const issue = validated.error.issues[0];
    throw new Error(issue?.message || "Invalid login payload");
  }

  return authRequest("/api/auth/login", validated.data);
}

export async function authenticateWithGoogle() {
  if (!firebaseEnabled || !auth) {
    throw new Error("Google login requires Firebase configuration");
  }

  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken(true);
  if (!idToken) {
    throw new Error("Failed to retrieve Google ID token");
  }

  return authRequest("/api/auth/google", { idToken });
}

export async function fetchCurrentUser() {
  const currentToken = await getValidAuthToken();
  if (!currentToken) {
    return null;
  }

  let token = currentToken;
  let response = await fetch("/api/user/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const refreshed = await getValidAuthToken(true);
    if (refreshed && refreshed !== token) {
      token = refreshed;
      response = await fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  if (response.status === 401 || response.status === 404) {
    clearAuthSession();
    return null;
  }

  const body = await parseApiResponse(response);
  if (!response.ok) {
    throw new Error(body?.error || "Failed to load user");
  }

  const parsed = authUserSchema.safeParse(body?.user);
  if (!parsed.success) {
    throw new Error("Received an invalid user payload");
  }

  writeStoredUser(parsed.data);
  return parsed.data;
}

export function subscribeAuthChanges(callback: () => void) {
  const onAuthChange = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === AUTH_TOKEN_KEY ||
      event.key === AUTH_REFRESH_TOKEN_KEY ||
      event.key === AUTH_USER_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, onAuthChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, onAuthChange);
    window.removeEventListener("storage", onStorage);
  };
}
