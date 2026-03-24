import { nangoProxyRequest } from "../nango";
import { getProviderConfigKey } from "../provider-config";
import type { DateRange, ProviderFetchResult } from "../types";

type TikTokUserResponse = {
  data?: {
    user?: {
      open_id?: string;
      display_name?: string;
      follower_count?: number;
      following_count?: number;
      likes_count?: number;
    };
  };
};

type TikTokVideosResponse = {
  data?: {
    videos?: Array<{
      id: string;
      create_time?: number;
      view_count?: number;
    }>;
  };
};

export async function fetchTikTokMetrics(
  connectionId: string,
  range: DateRange
): Promise<ProviderFetchResult> {
  const userInfo = await nangoProxyRequest<TikTokUserResponse>({
    providerConfigKey: getProviderConfigKey("tiktok"),
    connectionId,
    method: "GET",
    endpoint: "/v2/user/info/",
    query: {
      fields:
        "open_id,display_name,follower_count,following_count,likes_count",
    },
  });

  const videos = await nangoProxyRequest<TikTokVideosResponse>({
    providerConfigKey: getProviderConfigKey("tiktok"),
    connectionId,
    method: "GET",
    endpoint: "/v2/video/list/",
    query: {
      fields: "id,create_time,view_count",
      max_count: 50,
    },
  });

  const viewsByDate: Record<string, number> = {};
  (videos.data?.videos || []).forEach((video) => {
    if (!video.create_time) return;
    const dateKey = new Date(video.create_time * 1000).toISOString().slice(0, 10);
    viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + (video.view_count || 0);
  });

  const metrics = Object.entries(viewsByDate).map(([date, views]) => ({
    date,
    socials: {
      followers: userInfo.data?.user?.follower_count || 0,
      followersDelta: 0,
      views,
      engagement: 0,
    },
  }));

  if (!metrics.length) {
    metrics.push({
      date: new Date(range.end).toISOString().slice(0, 10),
      socials: {
        followers: userInfo.data?.user?.follower_count || 0,
        followersDelta: 0,
        views: 0,
        engagement: 0,
      },
    });
  }

  return {
    metrics,
    metadata: {
      tiktokUserId: userInfo.data?.user?.open_id,
      accountName: userInfo.data?.user?.display_name,
    },
  };
}
