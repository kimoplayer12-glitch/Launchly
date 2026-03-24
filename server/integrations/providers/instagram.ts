import { nangoProxyRequest } from "../nango";
import { getProviderConfigKey } from "../provider-config";
import type { DateRange, ProviderFetchResult } from "../types";

type FacebookPagesResponse = {
  data?: Array<{
    id: string;
    name: string;
    instagram_business_account?: { id: string };
  }>;
};

type InstagramInsightsResponse = {
  data?: Array<{
    name: string;
    values: Array<{ value: number; end_time: string }>;
  }>;
};

type InstagramUserResponse = {
  id: string;
  followers_count?: number;
  name?: string;
};

export async function fetchInstagramMetrics(
  connectionId: string,
  range: DateRange
): Promise<ProviderFetchResult> {
  const pages = await nangoProxyRequest<FacebookPagesResponse>({
    providerConfigKey: getProviderConfigKey("instagram"),
    connectionId,
    method: "GET",
    endpoint: "/me/accounts",
    query: {
      fields: "name,instagram_business_account",
    },
  });

  const igUserId = pages.data?.find((page) => page.instagram_business_account)?.instagram_business_account?.id;
  const accountName = pages.data?.find((page) => page.instagram_business_account)?.name;

  if (!igUserId) {
    throw new Error("Instagram professional account not found.");
  }

  const userInfo = await nangoProxyRequest<InstagramUserResponse>({
    providerConfigKey: getProviderConfigKey("instagram"),
    connectionId,
    method: "GET",
    endpoint: `/${igUserId}`,
    query: { fields: "followers_count,name" },
  });

  const insights = await nangoProxyRequest<InstagramInsightsResponse>({
    providerConfigKey: getProviderConfigKey("instagram"),
    connectionId,
    method: "GET",
    endpoint: `/${igUserId}/insights`,
    query: {
      metric: "impressions,reach,profile_views",
      period: "day",
      since: Math.floor(range.start.getTime() / 1000),
      until: Math.floor(range.end.getTime() / 1000),
    },
  });

  const metricsByDate: Record<
    string,
    { views: number; engagement: number }
  > = {};

  (insights.data || []).forEach((metric) => {
    metric.values.forEach((value) => {
      const dateKey = new Date(value.end_time).toISOString().slice(0, 10);
      if (!metricsByDate[dateKey]) {
        metricsByDate[dateKey] = { views: 0, engagement: 0 };
      }
      if (metric.name === "impressions") {
        metricsByDate[dateKey].views += value.value || 0;
      }
      if (metric.name === "reach") {
        metricsByDate[dateKey].engagement += value.value || 0;
      }
    });
  });

  const metrics = Object.entries(metricsByDate).map(([date, value]) => ({
    date,
    socials: {
      followers: userInfo.followers_count || 0,
      followersDelta: 0,
      views: value.views,
      engagement: value.engagement,
    },
  }));

  return {
    metrics,
    metadata: {
      igUserId,
      accountName: accountName || userInfo.name,
    },
  };
}
