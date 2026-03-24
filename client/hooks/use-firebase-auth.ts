import { useCallback, useEffect, useState } from "react";
import type { AuthUser as ApiAuthUser } from "@shared/auth";
import {
  clearAuthSession,
  fetchCurrentUser,
  getStoredAuthUser,
  subscribeAuthChanges,
} from "@/lib/auth-client";

let hydrationPromise: Promise<ApiAuthUser | null> | null = null;

async function loadCurrentUser() {
  if (!hydrationPromise) {
    hydrationPromise = fetchCurrentUser().finally(() => {
      hydrationPromise = null;
    });
  }
  return hydrationPromise;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

function toAuthUser(user: ApiAuthUser): AuthUser {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.email.split("@")[0] || "Founder",
    photoURL: null,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
  };
}

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredAuthUser();
    return stored ? toAuthUser(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateUser = useCallback(async () => {
    setLoading(true);

    try {
      const currentUser = await loadCurrentUser();
      setUser(currentUser ? toAuthUser(currentUser) : null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load user";
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateUser();
    const unsubscribe = subscribeAuthChanges(() => {
      hydrateUser();
    });
    return () => unsubscribe();
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    clearAuthSession();
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = Boolean(user);

  return {
    user,
    credits: null,
    loading,
    error,
    isAuthenticated,
    logout,
  };
};
