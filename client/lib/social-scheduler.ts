import { getDatabase, ref, push, set, get, query, orderByChild, equalTo, remove } from "firebase/database";

interface ScheduledPost {
  id: string;
  platform: "instagram" | "twitter" | "tiktok" | "youtube";
  caption: string;
  mediaUrl?: string;
  mediaType: "image" | "video";
  scheduledFor: number; // timestamp
  status: "scheduled" | "posted" | "failed";
  creditsCost: number;
  createdAt: number;
  postedAt?: number;
}

interface SocialAccount {
  id: string;
  platform: "instagram" | "twitter" | "tiktok" | "youtube";
  username: string;
  accessToken: string;
  connectedAt: number;
}

const PLATFORM_CREDIT_COSTS = {
  instagram: 5,
  twitter: 3,
  tiktok: 8,
  youtube: 10,
};

export async function saveSocialAccount(
  platform: string,
  username: string,
  accessToken: string,
  uid: string
) {
  if (!uid) throw new Error("User not authenticated");

  const db = getDatabase();
  const accountRef = ref(db, `users/${uid}/socialAccounts/${platform}`);

  const account: SocialAccount = {
    id: `${platform}_${uid}`,
    platform: platform as any,
    username,
    accessToken,
    connectedAt: Date.now(),
  };

  await set(accountRef, account);
  return account;
}

export async function getSocialAccounts(uid: string): Promise<SocialAccount[]> {
  const db = getDatabase();
  const accountsRef = ref(db, `users/${uid}/socialAccounts`);

  try {
    const snapshot = await get(accountsRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return [];
  }
}

export async function schedulePost(
  uid: string,
  platforms: ("instagram" | "twitter" | "tiktok")[],
  caption: string,
  mediaUrl: string | undefined,
  mediaType: "image" | "video",
  scheduledFor: Date
): Promise<ScheduledPost[]> {
  if (!uid) throw new Error("User not authenticated");

  const db = getDatabase();
  const postsRef = ref(db, `users/${uid}/scheduledPosts`);

  const createdPosts: ScheduledPost[] = [];
  const now = Date.now();

  for (const platform of platforms) {
    const newPostRef = push(postsRef);
    const post: ScheduledPost = {
      id: newPostRef.key!,
      platform,
      caption,
      mediaUrl,
      mediaType,
      scheduledFor: scheduledFor.getTime(),
      status: "scheduled",
      creditsCost: PLATFORM_CREDIT_COSTS[platform],
      createdAt: now,
    };

    await set(newPostRef, post);
    createdPosts.push(post);
  }

  return createdPosts;
}

export async function getScheduledPosts(uid: string): Promise<ScheduledPost[]> {
  const db = getDatabase();
  const postsRef = ref(db, `users/${uid}/scheduledPosts`);

  try {
    const snapshot = await get(postsRef);
    if (snapshot.exists()) {
      const posts = Object.values(snapshot.val()) as ScheduledPost[];
      return posts.sort((a, b) => a.scheduledFor - b.scheduledFor);
    }
    return [];
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return [];
  }
}

export async function deleteScheduledPost(uid: string, postId: string) {
  const db = getDatabase();
  const postRef = ref(db, `users/${uid}/scheduledPosts/${postId}`);

  try {
    await remove(postRef);
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    throw error;
  }
}

export async function disconnectSocialAccount(uid: string, platform: string) {
  const db = getDatabase();
  const accountRef = ref(db, `users/${uid}/socialAccounts/${platform}`);

  try {
    await remove(accountRef);
  } catch (error) {
    console.error("Error disconnecting social account:", error);
    throw error;
  }
}
