import admin from "firebase-admin";
import { z } from "zod";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

type DailyMetric = {
  date: string;
  revenue?: { total?: number; byProvider?: Record<string, number> };
  payouts?: { total?: number; byProvider?: Record<string, number> };
  sales?: {
    orders?: number;
    byProvider?: Record<string, { orders?: number; gross?: number }>;
  };
  socials?: {
    byProvider?: Record<
      string,
      { followersDelta?: number; views?: number; engagement?: number }
    >;
  };
};

const requestSchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional(),
});

function initializeFirebase() {
  try {
    return admin.app();
  } catch {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    return admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
}

function getDb() {
  initializeFirebase();
  return admin.firestore();
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function readBearerToken(req: any) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function getUserId(req: any, res: any) {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return null;
  }

  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

function parseJsonBody(req: any) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

async function listMetricsByRange(uid: string, start: string, end: string) {
  const snapshot = await getDb()
    .collection("users")
    .doc(uid)
    .collection("metricsDaily")
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as DailyMetric);
}

function sumSocialMetric(
  item: DailyMetric,
  key: "followersDelta" | "views" | "engagement"
) {
  const providerData = item.socials?.byProvider;
  if (!providerData) return 0;
  return Object.values(providerData).reduce((sum, value) => sum + (value[key] || 0), 0);
}

function aggregateMetrics(daily: DailyMetric[]) {
  const totals = daily.reduce(
    (acc, item) => {
      acc.revenue += item.revenue?.total || 0;
      acc.payouts += item.payouts?.total || 0;
      acc.orders += item.sales?.orders || 0;
      acc.followersDelta += sumSocialMetric(item, "followersDelta");
      acc.views += sumSocialMetric(item, "views");
      acc.engagement += sumSocialMetric(item, "engagement");
      return acc;
    },
    { revenue: 0, payouts: 0, orders: 0, followersDelta: 0, views: 0, engagement: 0 }
  );

  const engagementRate =
    totals.views > 0 ? Number((totals.engagement / totals.views).toFixed(4)) : 0;

  return { totals, engagementRate };
}

function summarizeByProvider(daily: DailyMetric[]) {
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
        totals[provider].followersDelta =
          (totals[provider].followersDelta || 0) + (value.followersDelta || 0);
        totals[provider].views =
          (totals[provider].views || 0) + (value.views || 0);
      });
    }
  });

  return totals;
}

function detectAnomalies(daily: DailyMetric[]) {
  if (!daily.length) return [] as string[];
  const avgRevenue =
    daily.reduce((sum, item) => sum + (item.revenue?.total || 0), 0) /
    daily.length;

  return daily
    .filter((item) => (item.revenue?.total || 0) > 0 && (item.revenue?.total || 0) < avgRevenue * 0.4)
    .map((item) => `Revenue dip on ${item.date}`);
}

async function aiGenerateJson<T = any>(prompt: string): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return JSON only. Do not include code fences or extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI error: ${message}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("Failed to parse AI JSON response");
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await getUserId(req, res);
  if (!userId) return;

  const parsed = requestSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const days = parsed.data.days ?? 7;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const start = toDateKey(startDate);
    const end = toDateKey(endDate);
    const daily = await listMetricsByRange(userId, start, end);
    const { totals, engagementRate } = aggregateMetrics(daily);
    const byProvider = summarizeByProvider(daily);
    const anomaliesCandidates = detectAnomalies(daily);

    const context = {
      range: { start, end, days },
      totals: {
        revenue: totals.revenue,
        payouts: totals.payouts,
        orders: totals.orders,
        followersDelta: totals.followersDelta,
        views: totals.views,
        engagementRate,
      },
      byProvider,
      anomaliesCandidates,
    };

    const prompt = [
      "You are an analytics advisor. Use ONLY the JSON context below.",
      "Return JSON with keys: title, summaryMarkdown, highlights, anomalies, recommendations, risks.",
      "Do not invent numbers. If data is missing, say so explicitly.",
      "Context JSON:",
      JSON.stringify(context),
    ].join("\n");

    const brief = await aiGenerateJson<{
      title?: string;
      summaryMarkdown?: string;
      highlights?: string[];
      anomalies?: string[];
      recommendations?: string[];
      risks?: string[];
    }>(prompt);

    return res.status(200).json({ brief, context });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate brief";
    return res.status(500).json({ error: message });
  }
}
