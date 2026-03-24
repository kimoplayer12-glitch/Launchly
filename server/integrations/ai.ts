import { aiGenerateJson } from "../services/ai";
import { listMetricsByRange, aiBriefRef, createAlert } from "./firestore";
import { aggregateMetrics } from "./metrics";
import type { DailyMetricsDoc } from "./types";

type MetricsContext = {
  range: { start: string; end: string; days: number };
  totals: {
    revenue: number;
    payouts: number;
    orders: number;
    followersDelta: number;
    views: number;
    engagementRate: number;
  };
  byProvider: Record<string, Record<string, number>>;
  topDays: Record<string, { date: string; value: number } | null>;
  anomaliesCandidates: string[];
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function buildMetricsContext(uid: string, days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const daily = await listMetricsByRange(uid, toDateKey(start), toDateKey(end));
  const { totals, engagementRate } = aggregateMetrics(daily);

  const byProvider = summarizeByProvider(daily);
  const topDays = {
    revenue: pickTopDay(daily, "revenue"),
    payouts: pickTopDay(daily, "payouts"),
    views: pickTopDay(daily, "views"),
  };
  const anomaliesCandidates = detectAnomalies(daily);

  const context: MetricsContext = {
    range: { start: toDateKey(start), end: toDateKey(end), days },
    totals: {
      revenue: totals.revenue,
      payouts: totals.payouts,
      orders: totals.orders,
      followersDelta: totals.followersDelta,
      views: totals.views,
      engagementRate,
    },
    byProvider,
    topDays,
    anomaliesCandidates,
  };

  return context;
}

export async function generateWeeklyBrief(uid: string, days = 7) {
  const context = await buildMetricsContext(uid, days);
  const prompt = [
    "You are an analytics advisor. Use ONLY the JSON context below.",
    "Return JSON with keys: title, summaryMarkdown, highlights, anomalies, recommendations, risks.",
    "Do not invent numbers. If data is missing, say so explicitly.",
    "Context JSON:",
    JSON.stringify(context),
  ].join("\n");

  const response = await aiGenerateJson<{
    title?: string;
    summaryMarkdown?: string;
    highlights?: string[];
    anomalies?: string[];
    recommendations?: string[];
    risks?: string[];
  }>({
    prompt,
  });

  const weekKey = getWeekKey(new Date());
  await aiBriefRef(uid, weekKey).set({
    weekKey,
    range: { start: context.range.start, end: context.range.end },
    summaryMarkdown: response.summaryMarkdown || "",
    highlights: response.highlights || [],
    anomalies: response.anomalies || [],
    recommendations: response.recommendations || [],
    risks: response.risks || [],
    createdAt: new Date().toISOString(),
  });

  if (context.totals.revenue === 0) {
    await createAlert(uid, {
      type: "revenue_drop",
      severity: "warn",
      message: "No revenue recorded in the last period.",
    });
  }

  return { weekKey, ...response, context };
}

export async function answerMetricsQuestion(
  uid: string,
  question: string,
  days = 30
) {
  const context = await buildMetricsContext(uid, days);
  const prompt = [
    "You are an analytics assistant.",
    "Answer the question using ONLY the JSON context below.",
    "Return JSON with keys: answer, citations.",
    "Citations must reference context keys like totals.revenue or byProvider.stripe.revenue.",
    "Context JSON:",
    JSON.stringify(context),
    "Question:",
    question,
  ].join("\n");

  const response = await aiGenerateJson<{ answer?: string; citations?: string[] }>(
    { prompt }
  );

  return { response, context };
}

function summarizeByProvider(daily: DailyMetricsDoc[]) {
  const totals: Record<string, Record<string, number>> = {};

  daily.forEach((item) => {
    if (item.revenue?.byProvider) {
      Object.entries(item.revenue.byProvider).forEach(([provider, value]) => {
        totals[provider] = totals[provider] || {};
        totals[provider].revenue = (totals[provider].revenue || 0) + value;
      });
    }
    if (item.payouts?.byProvider) {
      Object.entries(item.payouts.byProvider).forEach(([provider, value]) => {
        totals[provider] = totals[provider] || {};
        totals[provider].payouts = (totals[provider].payouts || 0) + value;
      });
    }
    if (item.sales?.byProvider) {
      Object.entries(item.sales.byProvider).forEach(([provider, value]) => {
        totals[provider] = totals[provider] || {};
        totals[provider].orders =
          (totals[provider].orders || 0) + (value.orders || 0);
        totals[provider].gross =
          (totals[provider].gross || 0) + (value.gross || 0);
      });
    }
    if (item.socials?.byProvider) {
      Object.entries(item.socials.byProvider).forEach(([provider, value]) => {
        totals[provider] = totals[provider] || {};
        totals[provider].followers =
          (totals[provider].followers || 0) + (value.followers || 0);
        totals[provider].followersDelta =
          (totals[provider].followersDelta || 0) +
          (value.followersDelta || 0);
        totals[provider].views =
          (totals[provider].views || 0) + (value.views || 0);
      });
    }
  });

  return totals;
}

function pickTopDay(
  daily: DailyMetricsDoc[],
  metric: "revenue" | "payouts" | "views"
) {
  let best: { date: string; value: number } | null = null;
  daily.forEach((item) => {
    const value =
      metric === "views"
        ? Object.values(item.socials?.byProvider || {}).reduce(
            (sum, social) => sum + (social.views || 0),
            0
          )
        : metric === "revenue"
          ? item.revenue?.total || 0
          : item.payouts?.total || 0;
    if (!best || value > best.value) {
      best = { date: item.date, value };
    }
  });
  return best;
}

function detectAnomalies(daily: DailyMetricsDoc[]) {
  if (!daily.length) return [];
  const avgRevenue =
    daily.reduce((sum, item) => sum + (item.revenue?.total || 0), 0) /
    daily.length;
  return daily
    .filter((item) => item.revenue?.total && item.revenue.total < avgRevenue * 0.4)
    .map((item) => `Revenue dip on ${item.date}`);
}

function getWeekKey(date: Date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
