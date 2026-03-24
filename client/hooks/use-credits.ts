import { useState, useEffect, useCallback } from "react";
import {
  UserCredits,
  UserTier,
  checkMonthlyRenewal,
} from "../lib/credits";
import { useFirebaseAuth } from "./use-firebase-auth";
import {
  getUserCredits,
  subscribeToUserCredits,
  updateUserCredits,
  upgradeUserTier as upgradeUserTierFirebase,
  deductUserCredits as deductUserCreditsFirebase,
  addUserCredits as addUserCreditsFirebase,
} from "@/lib/firebase-database";

export const useCredits = () => {
  const { user } = useFirebaseAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to credits from Firestore
  useEffect(() => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToUserCredits(user.uid, (firestoreCredits) => {
        // TEMPORARY: Skip renewal check for infinite credits
        setCredits(firestoreCredits);
        setError(null);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load credits";
      setError(message);
      setLoading(false);
      console.error("Credits error:", err);
    }
  }, [user]);

  const deductCredits = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!credits || !user) return false;

      try {
        const success = await deductUserCreditsFirebase(user.uid, amount);
        return success;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to deduct credits";
        setError(message);
        console.error("Deduct credits error:", err);
        return false;
      }
    },
    [credits, user]
  );

  const addCredits = useCallback(
    async (amount: number): Promise<void> => {
      if (!user) return;

      try {
        await addUserCreditsFirebase(user.uid, amount);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add credits";
        setError(message);
        console.error("Add credits error:", err);
      }
    },
    [user]
  );

  const upgradeTier = useCallback(
    async (newTier: UserTier): Promise<void> => {
      if (!user) return;

      try {
        await upgradeUserTierFirebase(user.uid, newTier);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upgrade tier";
        setError(message);
        console.error("Upgrade tier error:", err);
      }
    },
    [user]
  );

  const canAfford = useCallback(
    (cost: number): boolean => {
      if (!credits) return false;
      return credits.currentCredits >= cost;
    },
    [credits]
  );

  const getRemainingCredits = useCallback((): number => {
    if (!credits) return 0;
    return credits.currentCredits;
  }, [credits]);

  return {
    credits,
    loading,
    error,
    deductCredits,
    addCredits,
    upgradeTier,
    canAfford,
    getRemainingCredits,
  };
};
