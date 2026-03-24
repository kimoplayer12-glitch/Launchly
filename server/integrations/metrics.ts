import type {
  DailyMetricsDoc,
  ProviderDailyMetrics,
  ProviderKey,
} from "./types";

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function mergeProviderMetrics(
  existing: DailyMetricsDoc | null,
  provider: ProviderKey,
  incoming: ProviderDailyMetrics
): DailyMetricsDoc {
  const revenueByProvider = {
    ...(existing?.revenue?.byProvider || {}),
  };
  const payoutsByProvider = {
    ...(existing?.payouts?.byProvider || {}),
  };
  const salesByProvider = {
    ...(existing?.sales?.byProvider || {}),
  };
  const socialsByProvider = {
    ...(existing?.socials?.byProvider || {}),
  };

  if (incoming.revenue) {
    revenueByProvider[provider] = incoming.revenue.total;
  }
  if (incoming.payouts) {
    payoutsByProvider[provider] = incoming.payouts.total;
  }
  if (incoming.sales) {
    salesByProvider[provider] = {
      orders: incoming.sales.orders,
      gross: incoming.sales.gross,
      net: incoming.sales.net,
    };
  }
  if (incoming.socials) {
    socialsByProvider[provider] = {
      followers: incoming.socials.followers,
      followersDelta: incoming.socials.followersDelta,
      views: incoming.socials.views,
      engagement: incoming.socials.engagement,
    };
  }

  const revenueTotal = sum(Object.values(revenueByProvider));
  const payoutsTotal = sum(Object.values(payoutsByProvider));
  const ordersTotal = sum(Object.values(salesByProvider).map((item) => item.orders));
  const grossTotal = sum(Object.values(salesByProvider).map((item) => item.gross));
  const netTotal = sum(
    Object.values(salesByProvider).map((item) => item.net ?? item.gross)
  );

  const engagementRate = (() => {
    const socials = Object.values(socialsByProvider);
    if (!socials.length) return undefined;
    const totalEngagement = sum(
      socials.map((item) => (item.engagement ? item.engagement : 0))
    );
    const totalViews = sum(socials.map((item) => (item.views ? item.views : 0)));
    if (!totalViews) return undefined;
    return Number((totalEngagement / totalViews).toFixed(4));
  })();

  const aov = ordersTotal ? Number((grossTotal / ordersTotal).toFixed(2)) : undefined;

  return {
    date: existing?.date || incoming.date,
    revenue: {
      total: revenueTotal,
      currency: incoming.revenue?.currency || existing?.revenue?.currency,
      byProvider: revenueByProvider,
    },
    payouts: {
      total: payoutsTotal,
      currency: incoming.payouts?.currency || existing?.payouts?.currency,
      byProvider: payoutsByProvider,
    },
    sales: {
      orders: ordersTotal,
      gross: grossTotal,
      net: netTotal,
      currency: incoming.sales?.currency || existing?.sales?.currency,
      byProvider: salesByProvider,
    },
    socials: {
      byProvider: socialsByProvider,
    },
    computed: {
      engagementRate,
      aov,
    },
  };
}

export function aggregateMetrics(daily: DailyMetricsDoc[]) {
  const totals = daily.reduce(
    (acc, item) => {
      acc.revenue += item.revenue?.total || 0;
      acc.payouts += item.payouts?.total || 0;
      acc.orders += item.sales?.orders || 0;
      acc.followersDelta += sumSocialDeltas(item);
      acc.views += sumSocialViews(item);
      acc.engagement += sumSocialEngagement(item);
      return acc;
    },
    {
      revenue: 0,
      payouts: 0,
      orders: 0,
      followersDelta: 0,
      views: 0,
      engagement: 0,
    }
  );

  const engagementRate =
    totals.views > 0 ? Number((totals.engagement / totals.views).toFixed(4)) : 0;

  return { totals, engagementRate };
}

function sumSocialDeltas(item: DailyMetricsDoc) {
  if (!item.socials?.byProvider) return 0;
  return Object.values(item.socials.byProvider).reduce(
    (total, social) => total + (social.followersDelta ?? 0),
    0
  );
}

function sumSocialViews(item: DailyMetricsDoc) {
  if (!item.socials?.byProvider) return 0;
  return Object.values(item.socials.byProvider).reduce(
    (total, social) => total + (social.views ?? 0),
    0
  );
}

function sumSocialEngagement(item: DailyMetricsDoc) {
  if (!item.socials?.byProvider) return 0;
  return Object.values(item.socials.byProvider).reduce(
    (total, social) => total + (social.engagement ?? 0),
    0
  );
}
