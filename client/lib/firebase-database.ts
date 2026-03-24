import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import { UserCredits, UserTier, PRICING_TIERS } from "./credits";

// -----------------------------
// Local mode storage keys
// -----------------------------

const LS_CREDITS_KEY = "lf_local_credits_v1";
const LS_PLANS_KEY = "lf_local_plans_v1";
const LS_POSTS_KEY = "lf_local_posts_v1";

function readLs<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLs<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

type CreditsMap = Record<string, UserCredits>;
type PlanRecord = { id: string; title: string; content: string; createdAt: string; updatedAt: string };
type PlansMap = Record<string, PlanRecord[]>; // uid -> plans
type PostRecord = { id: string; content: string; platforms: string[]; scheduledFor?: string; status: "draft"|"scheduled"|"published"; createdAt: string; updatedAt: string };
type PostsMap = Record<string, PostRecord[]>; // uid -> posts

function isPermissionDeniedError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? ((error as { code?: string }).code || "")
      : "";
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? ((error as { message?: string }).message || "")
      : "";

  return code.includes("permission-denied") || message.includes("insufficient permissions");
}

function ensureLocalCredits(uid: string): UserCredits {
  const map = readLs<CreditsMap>(LS_CREDITS_KEY, {});
  if (!map[uid]) {
    const tier = PRICING_TIERS.free;
    const now = new Date();
    const renewal = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    map[uid] = {
      currentCredits: tier.monthlyCredits,
      monthlyLimit: tier.monthlyCredits,
      dailyLimit: tier.dailyCapCredits,
      dailyUsedToday: 0,
      rolloverCredits: 0,
      lastRenewalDate: now.toISOString(),
      tier: "free",
      renewalDate: renewal.toISOString(),
    };
    writeLs(LS_CREDITS_KEY, map);
  }
  return map[uid];
}

function setLocalCredits(uid: string, credits: UserCredits) {
  const map = readLs<CreditsMap>(LS_CREDITS_KEY, {});
  map[uid] = credits;
  writeLs(LS_CREDITS_KEY, map);
}

/**
 * Get user credits from Firestore
 */
export const getUserCredits = async (uid: string): Promise<UserCredits | null> => {
  try {
    if (!firebaseEnabled || !db) {
      return ensureLocalCredits(uid);
    }
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.credits || null;
    }
    return null;
  } catch (error) {
    console.error("Get user credits error:", error);
    if (isPermissionDeniedError(error)) {
      return ensureLocalCredits(uid);
    }
    throw error;
  }
};

/**
 * Subscribe to user credits in real-time
 * TEMPORARY: Infinite credits for everyone
 */
export const subscribeToUserCredits = (
  uid: string,
  callback: (credits: UserCredits) => void
) => {
  if (!firebaseEnabled || !db) {
    // Local mode: emit once with infinite credits
    const infiniteCredits = {
      ...ensureLocalCredits(uid),
      currentCredits: 999999,
      monthlyLimit: 999999,
    };
    callback(infiniteCredits);
    return () => {};
  }
  const userDocRef = doc(db, "users", uid);
  return onSnapshot(
    userDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.credits) {
          const infiniteCredits = {
            ...data.credits,
            currentCredits: 999999,
            monthlyLimit: 999999,
          };
          callback(infiniteCredits);
          return;
        }
      }
      callback({
        ...ensureLocalCredits(uid),
        currentCredits: 999999,
        monthlyLimit: 999999,
      });
    },
    (error) => {
      if (!isPermissionDeniedError(error)) {
        console.error("Subscribe user credits error:", error);
      }
      callback({
        ...ensureLocalCredits(uid),
        currentCredits: 999999,
        monthlyLimit: 999999,
      });
    }
  );
};

/**
 * Update user credits in Firestore
 */
export const updateUserCredits = async (
  uid: string,
  credits: UserCredits
): Promise<void> => {
  try {
    if (!firebaseEnabled || !db) {
      setLocalCredits(uid, credits);
      return;
    }
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      credits,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Update user credits error:", error);
    if (isPermissionDeniedError(error)) {
      setLocalCredits(uid, credits);
      return;
    }
    throw error;
  }
};

/**
 * Deduct credits from user account
 * TEMPORARY: Infinite credits for everyone
 */
export const deductUserCredits = async (
  uid: string,
  amount: number
): Promise<boolean> => {
  try {
    // TEMPORARY: Always allow (infinite credits)
    return true;
  } catch (error) {
    console.error("Deduct credits error:", error);
    throw error;
  }
};

/**
 * Add credits to user account (for top-ups)
 */
export const addUserCredits = async (
  uid: string,
  amount: number
): Promise<void> => {
  try {
    const credits = await getUserCredits(uid);
    if (!credits) throw new Error("User credits not found");

    const updated: UserCredits = {
      ...credits,
      currentCredits: credits.currentCredits + amount,
    };

    await updateUserCredits(uid, updated);
  } catch (error) {
    console.error("Add credits error:", error);
    throw error;
  }
};

/**
 * Upgrade user tier
 */
export const upgradeUserTier = async (
  uid: string,
  newTier: UserTier
): Promise<void> => {
  try {
    const pricingTier = PRICING_TIERS[newTier];
    const now = new Date();
    const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const newCredits: UserCredits = {
      currentCredits: pricingTier.monthlyCredits,
      monthlyLimit: pricingTier.monthlyCredits,
      dailyLimit: pricingTier.dailyCapCredits,
      dailyUsedToday: 0,
      rolloverCredits: 0,
      lastRenewalDate: now.toISOString(),
      tier: newTier,
      renewalDate: renewalDate.toISOString(),
    };

    if (!firebaseEnabled || !db) {
      setLocalCredits(uid, newCredits);
      return;
    }

    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      tier: newTier,
      credits: newCredits,
      lastUpgrade: now.toISOString(),
    });
  } catch (error) {
    console.error("Upgrade tier error:", error);
    throw error;
  }
};

/**
 * Save business plan to Firestore
 */
export const saveBusinessPlan = async (
  uid: string,
  planData: {
    title: string;
    content: string;
    createdAt: string;
  }
): Promise<string> => {
  try {
    if (!firebaseEnabled || !db) {
      const map = readLs<PlansMap>(LS_PLANS_KEY, {});
      const id = `plan_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const record: PlanRecord = {
        id,
        title: planData.title,
        content: planData.content,
        createdAt: planData.createdAt || now,
        updatedAt: now,
      };
      map[uid] = [record, ...(map[uid] || [])];
      writeLs(LS_PLANS_KEY, map);
      return id;
    }
    const plansCollectionRef = collection(db, "users", uid, "businessPlans");
    const planDocRef = doc(plansCollectionRef);

    await setDoc(planDocRef, {
      ...planData,
      updatedAt: new Date().toISOString(),
    });

    return planDocRef.id;
  } catch (error) {
    console.error("Save business plan error:", error);
    throw error;
  }
};

/**
 * Get user's business plans
 */
export const getUserBusinessPlans = async (uid: string) => {
  try {
    if (!firebaseEnabled || !db) {
      const map = readLs<PlansMap>(LS_PLANS_KEY, {});
      return map[uid] || [];
    }
    const plansQuery = query(
      collection(db, "users", uid, "businessPlans")
    );

    return new Promise((resolve, reject) => {
      onSnapshot(
        plansQuery,
        (snapshot) => {
          const plans = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          resolve(plans);
        },
        (error) => {
          if (isPermissionDeniedError(error)) {
            const map = readLs<PlansMap>(LS_PLANS_KEY, {});
            resolve(map[uid] || []);
            return;
          }
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error("Get business plans error:", error);
    throw error;
  }
};

/**
 * Save social posts to Firestore
 */
export const saveSocialPost = async (
  uid: string,
  postData: {
    content: string;
    platforms: string[];
    scheduledFor?: string;
    status: "draft" | "scheduled" | "published";
  }
): Promise<string> => {
  try {
    if (!firebaseEnabled || !db) {
      const map = readLs<PostsMap>(LS_POSTS_KEY, {});
      const id = `post_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const record: PostRecord = {
        id,
        content: postData.content,
        platforms: postData.platforms,
        scheduledFor: postData.scheduledFor,
        status: postData.status,
        createdAt: now,
        updatedAt: now,
      };
      map[uid] = [record, ...(map[uid] || [])];
      writeLs(LS_POSTS_KEY, map);
      return id;
    }
    const postsCollectionRef = collection(db, "users", uid, "socialPosts");
    const postDocRef = doc(postsCollectionRef);

    await setDoc(postDocRef, {
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return postDocRef.id;
  } catch (error) {
    console.error("Save social post error:", error);
    throw error;
  }
};

/**
 * Get user's social posts
 */
export const getUserSocialPosts = async (uid: string) => {
  try {
    if (!firebaseEnabled || !db) {
      const map = readLs<PostsMap>(LS_POSTS_KEY, {});
      return map[uid] || [];
    }
    const postsQuery = query(
      collection(db, "users", uid, "socialPosts")
    );

    return new Promise((resolve, reject) => {
      onSnapshot(
        postsQuery,
        (snapshot) => {
          const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          resolve(posts);
        },
        (error) => {
          if (isPermissionDeniedError(error)) {
            const map = readLs<PostsMap>(LS_POSTS_KEY, {});
            resolve(map[uid] || []);
            return;
          }
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error("Get social posts error:", error);
    throw error;
  }
};
