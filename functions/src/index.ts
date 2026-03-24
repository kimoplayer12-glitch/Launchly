import express, { Request, Response } from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

setGlobalOptions({ region: "us-central1" });

initializeApp();
const db = getFirestore();
const auth = getAuth();

type GeneratedFiles = {
  "index.html": string;
  "styles.css": string;
  "app.js": string;
};

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

async function requireAuth(req: Request, res: Response) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header" });
    return null;
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

function parseBody<T>(req: Request): T {
  if (typeof req.body === "string") {
    return JSON.parse(req.body) as T;
  }
  return req.body as T;
}

function validateFiles(files: GeneratedFiles) {
  const errors: string[] = [];
  const indexHtml = files["index.html"] ?? "";
  const stylesCss = files["styles.css"] ?? "";
  const appJs = files["app.js"] ?? "";

  if (!indexHtml || !stylesCss || !appJs) {
    errors.push("All three files are required.");
    return errors;
  }

  const requiredHtmlChecks = [
    /<div\s+id=["']app["']\s*>\s*<\/div>/i,
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']styles\.css["'][^>]*>/i,
  ];

  if (!requiredHtmlChecks[0].test(indexHtml)) {
    errors.push("index.html must include <div id=\"app\"></div>.");
  }
  if (!requiredHtmlChecks[1].test(indexHtml)) {
    errors.push("index.html must include a stylesheet link to styles.css.");
  }
  if (/<script/i.test(indexHtml)) {
    errors.push("index.html must NOT include <script> tags.");
  }
  if (/https?:\/\//i.test(indexHtml)) {
    errors.push("index.html must NOT include external assets.");
  }
  if (/\bimport\s+/i.test(appJs) || /\bexport\s+/i.test(appJs)) {
    errors.push("app.js must NOT contain import or export statements.");
  }

  return errors;
}

function normalizeJson(content: string) {
  try {
    return JSON.parse(content) as GeneratedFiles;
  } catch (error) {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(content.slice(start, end + 1)) as GeneratedFiles;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callOpenAI(prompt: string, attempt: number) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const system = [
    "You are a code generator.",
    "Return ONLY valid JSON with keys: \"index.html\", \"styles.css\", \"app.js\".",
    "index.html must include <div id=\"app\"></div> and <link rel=\"stylesheet\" href=\"styles.css\" />.",
    "index.html must NOT include any <script> tags or external assets (no http/https).",
    "app.js must be plain vanilla JS with no import/export statements.",
  ].join(" ");

  const user = attempt === 0
    ? `Generate a minimal, modern landing page based on: ${prompt}`
    : `Fix the output to satisfy all constraints. Only return the JSON. Original prompt: ${prompt}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return normalizeJson(content);
}

app.post("/api/generate", async (req, res) => {
  const uid = await requireAuth(req, res);
  if (!uid) return;

  try {
    const body = parseBody<{ prompt: string }>(req);
    if (!body?.prompt?.trim()) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    let files = await callOpenAI(body.prompt, 0);
    if (!files || Object.keys(files).length !== 3) {
      files = await callOpenAI(body.prompt, 1);
    }

    if (!files || Object.keys(files).length !== 3) {
      res.status(400).json({ error: "Model did not return valid JSON output." });
      return;
    }

    const errors = validateFiles(files);
    if (errors.length) {
      res.status(400).json({ error: "Output failed validation.", details: errors });
      return;
    }

    const projectRef = db.collection("projects").doc();
    const now = FieldValue.serverTimestamp();

    await projectRef.set({
      userId: uid,
      latestRevision: 1,
      createdAt: now,
      updatedAt: now,
    });

    await projectRef.collection("revisions").doc("1").set({
      indexHtml: files["index.html"],
      stylesCss: files["styles.css"],
      appJs: files["app.js"],
      createdAt: now,
    });

    res.json({ projectId: projectRef.id, revision: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    res.status(500).json({ error: message });
  }
});

app.get("/api/projects/:projectId", async (req, res) => {
  const uid = await requireAuth(req, res);
  if (!uid) return;

  try {
    const { projectId } = req.params;
    const projectRef = db.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      res.status(404).json({ error: "Project not found." });
      return;
    }

    const project = projectSnap.data();
    if (!project || project.userId !== uid) {
      res.status(403).json({ error: "Forbidden." });
      return;
    }

    const revParam = (req.query.rev as string | undefined) ?? "latest";
    const revision =
      revParam === "latest"
        ? project.latestRevision
        : Number.parseInt(revParam, 10);

    if (!revision || Number.isNaN(revision)) {
      res.status(400).json({ error: "Invalid revision parameter." });
      return;
    }

    const revisionSnap = await projectRef
      .collection("revisions")
      .doc(String(revision))
      .get();

    if (!revisionSnap.exists) {
      res.status(404).json({ error: "Revision not found." });
      return;
    }

    const revisionData = revisionSnap.data() || {};
    res.json({
      projectId,
      revision,
      indexHtml: revisionData.indexHtml,
      stylesCss: revisionData.stylesCss,
      appJs: revisionData.appJs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load project.";
    res.status(500).json({ error: message });
  }
});

  app.post("/api/projects/:projectId/save", async (req, res) => {
    const uid = await requireAuth(req, res);
    if (!uid) return;

  try {
    const { projectId } = req.params;
    const body = parseBody<{
      indexHtml: string;
      stylesCss: string;
      appJs: string;
    }>(req);

    const files: GeneratedFiles = {
      "index.html": body.indexHtml,
      "styles.css": body.stylesCss,
      "app.js": body.appJs,
    };

    const errors = validateFiles(files);
    if (errors.length) {
      res.status(400).json({ error: "Output failed validation.", details: errors });
      return;
    }

    const projectRef = db.collection("projects").doc(projectId);

    const newRevision = await db.runTransaction(async (trx) => {
      const projectSnap = await trx.get(projectRef);
      if (!projectSnap.exists) {
        throw new Error("Project not found.");
      }
      const project = projectSnap.data();
      if (!project || project.userId !== uid) {
        throw new Error("Forbidden.");
      }

      const nextRevision = (project.latestRevision || 0) + 1;
      trx.set(projectRef.collection("revisions").doc(String(nextRevision)), {
        indexHtml: files["index.html"],
        stylesCss: files["styles.css"],
        appJs: files["app.js"],
        createdAt: FieldValue.serverTimestamp(),
      });
      trx.update(projectRef, {
        latestRevision: nextRevision,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return nextRevision;
    });

    res.json({ revision: newRevision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed.";
    if (message === "Project not found.") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Forbidden.") {
      res.status(403).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
});

export const api = onRequest({ secrets: ["OPENAI_API_KEY"] }, app);

type ProviderKey = "stripe" | "paypal" | "shopify" | "instagram" | "tiktok";

type ConnectionDoc = {
  provider: ProviderKey;
  status: "connected" | "disconnected" | "error";
  nangoConnectionId?: string;
  lastSyncAt?: string | null;
  metadata?: { shopDomain?: string; igUserId?: string };
};

type ProviderDailyMetrics = {
  date: string;
  revenue?: { total: number; currency?: string };
  payouts?: { total: number; currency?: string };
  sales?: { orders: number; gross: number; net?: number; currency?: string };
  socials?: { followers: number; followersDelta?: number; views?: number; engagement?: number };
};

const NANGO_BASE_URL = process.env.NANGO_BASE_URL || "https://api.nango.dev";

function getProviderConfigKey(provider: ProviderKey) {
  const envKey = `NANGO_INTEGRATION_${provider.toUpperCase()}`;
  return process.env[envKey] || provider;
}

async function nangoProxyRequest<T = any>(params: {
  provider: ProviderKey;
  connectionId: string;
  method: string;
  endpoint: string;
  query?: Record<string, string | number | boolean | undefined>;
  baseUrlOverride?: string;
}) {
  const url = new URL(
    `${NANGO_BASE_URL}/proxy/${getProviderConfigKey(params.provider)}${params.endpoint}`
  );
  if (params.query) {
    Object.entries(params.query).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: params.method,
    headers: {
      Authorization: `Bearer ${process.env.NANGO_SECRET_KEY}`,
      "Connection-Id": params.connectionId,
      "Provider-Config-Key": getProviderConfigKey(params.provider),
      ...(params.baseUrlOverride ? { "Base-Url-Override": params.baseUrlOverride } : {}),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Nango proxy error: ${response.status} ${message}`);
  }

  return (await response.json()) as T;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeRange(lastSyncAt?: string | null) {
  const end = new Date();
  let start = lastSyncAt ? new Date(lastSyncAt) : new Date(end.getTime() - 30 * 86400000);
  if (Number.isNaN(start.getTime())) {
    start = new Date(end.getTime() - 7 * 86400000);
  }
  const maxLookback = new Date(end.getTime() - 30 * 86400000);
  if (start < maxLookback) start = maxLookback;
  return { start, end };
}

async function fetchStripeMetrics(connectionId: string, range: { start: Date; end: Date }) {
  const start = Math.floor(range.start.getTime() / 1000);
  const end = Math.floor(range.end.getTime() / 1000);
  const metrics: Record<string, ProviderDailyMetrics> = {};

  let startingAfter: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await nangoProxyRequest<{
      data: Array<{ id: string; amount: number; currency: string; created: number; type: string }>;
      has_more: boolean;
    }>({
      provider: "stripe",
      connectionId,
      method: "GET",
      endpoint: "/v1/balance_transactions",
      query: {
        limit: 100,
        "created[gte]": start,
        "created[lte]": end,
        starting_after: startingAfter,
      },
    });

    response.data.forEach((tx) => {
      const day = dateKey(new Date(tx.created * 1000));
      if (!metrics[day]) metrics[day] = { date: day };
      if (tx.type === "charge") {
        metrics[day].revenue = {
          total: (metrics[day].revenue?.total || 0) + Math.abs(tx.amount) / 100,
          currency: tx.currency,
        };
      }
      if (tx.type === "payout") {
        metrics[day].payouts = {
          total: (metrics[day].payouts?.total || 0) + Math.abs(tx.amount) / 100,
          currency: tx.currency,
        };
      }
    });

    hasMore = response.has_more;
    startingAfter = response.data.length ? response.data[response.data.length - 1].id : undefined;
  }

  return Object.values(metrics);
}

async function fetchPayPalMetrics(connectionId: string, range: { start: Date; end: Date }) {
  const response = await nangoProxyRequest<{
    transaction_details?: Array<{
      transaction_info: { transaction_initiation_date: string; transaction_amount?: { value: string; currency_code: string } };
    }>;
  }>({
    provider: "paypal",
    connectionId,
    method: "GET",
    endpoint: "/v1/reporting/transactions",
    query: {
      start_date: range.start.toISOString(),
      end_date: range.end.toISOString(),
      fields: "all",
      page_size: 100,
    },
  });

  const metrics: Record<string, ProviderDailyMetrics> = {};
  (response.transaction_details || []).forEach((item) => {
    const info = item.transaction_info;
    if (!info?.transaction_amount?.value) return;
    const day = dateKey(new Date(info.transaction_initiation_date));
    if (!metrics[day]) metrics[day] = { date: day };
    metrics[day].revenue = {
      total: (metrics[day].revenue?.total || 0) + Number(info.transaction_amount.value),
      currency: info.transaction_amount.currency_code,
    };
  });

  return Object.values(metrics);
}

async function fetchShopifyMetrics(
  connectionId: string,
  range: { start: Date; end: Date },
  shopDomain?: string
) {
  if (!shopDomain) throw new Error("Shopify shop domain is missing.");
  const response = await nangoProxyRequest<{ orders: Array<{ created_at: string; total_price: string; currency?: string }> }>({
    provider: "shopify",
    connectionId,
    method: "GET",
    endpoint: "/admin/api/2024-01/orders.json",
    query: {
      status: "any",
      limit: 250,
      created_at_min: range.start.toISOString(),
      created_at_max: range.end.toISOString(),
    },
    baseUrlOverride: `https://${shopDomain}`,
  });

  const metrics: Record<string, ProviderDailyMetrics> = {};
  response.orders.forEach((order) => {
    const day = dateKey(new Date(order.created_at));
    if (!metrics[day]) metrics[day] = { date: day };
    const orders = (metrics[day].sales?.orders || 0) + 1;
    const gross = (metrics[day].sales?.gross || 0) + Number(order.total_price || 0);
    metrics[day].sales = {
      orders,
      gross,
      currency: order.currency || "USD",
    };
  });

  return Object.values(metrics);
}

async function fetchInstagramMetrics(connectionId: string, range: { start: Date; end: Date }) {
  const pages = await nangoProxyRequest<{ data?: Array<{ instagram_business_account?: { id: string } }> }>({
    provider: "instagram",
    connectionId,
    method: "GET",
    endpoint: "/me/accounts",
    query: { fields: "instagram_business_account" },
  });

  const igUserId = pages.data?.find((page) => page.instagram_business_account)?.instagram_business_account?.id;
  if (!igUserId) throw new Error("Instagram professional account not found.");

  const insights = await nangoProxyRequest<{ data?: Array<{ name: string; values: Array<{ value: number; end_time: string }> }> }>({
    provider: "instagram",
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

  const metrics: Record<string, ProviderDailyMetrics> = {};
  (insights.data || []).forEach((metric) => {
    metric.values.forEach((value) => {
      const day = dateKey(new Date(value.end_time));
      if (!metrics[day]) metrics[day] = { date: day };
      const views = metric.name === "impressions" ? value.value : 0;
      const engagement = metric.name === "reach" ? value.value : 0;
      metrics[day].socials = {
        followers: metrics[day].socials?.followers || 0,
        views: (metrics[day].socials?.views || 0) + views,
        engagement: (metrics[day].socials?.engagement || 0) + engagement,
      };
    });
  });

  return Object.values(metrics);
}

async function fetchTikTokMetrics(connectionId: string, range: { start: Date; end: Date }) {
  const response = await nangoProxyRequest<{ data?: { user?: { follower_count?: number } } }>({
    provider: "tiktok",
    connectionId,
    method: "GET",
    endpoint: "/v2/user/info/",
    query: {
      fields: "follower_count",
    },
  });

  const day = dateKey(range.end);
  return [
    {
      date: day,
      socials: {
        followers: response.data?.user?.follower_count || 0,
        followersDelta: 0,
        views: 0,
        engagement: 0,
      },
    },
  ];
}

async function fetchMetricsForProvider(
  provider: ProviderKey,
  connectionId: string,
  range: { start: Date; end: Date },
  metadata?: { shopDomain?: string }
) {
  switch (provider) {
    case "stripe":
      return fetchStripeMetrics(connectionId, range);
    case "paypal":
      return fetchPayPalMetrics(connectionId, range);
    case "shopify":
      return fetchShopifyMetrics(connectionId, range, metadata?.shopDomain);
    case "instagram":
      return fetchInstagramMetrics(connectionId, range);
    case "tiktok":
      return fetchTikTokMetrics(connectionId, range);
    default:
      return [];
  }
}

function mergeMetrics(existing: any, provider: ProviderKey, metric: ProviderDailyMetrics) {
  const revenueByProvider = { ...(existing?.revenue?.byProvider || {}) };
  const payoutsByProvider = { ...(existing?.payouts?.byProvider || {}) };
  const salesByProvider = { ...(existing?.sales?.byProvider || {}) };
  const socialsByProvider = { ...(existing?.socials?.byProvider || {}) };

  if (metric.revenue) revenueByProvider[provider] = metric.revenue.total;
  if (metric.payouts) payoutsByProvider[provider] = metric.payouts.total;
  if (metric.sales) salesByProvider[provider] = metric.sales;
  if (metric.socials) socialsByProvider[provider] = metric.socials;

  const revenueTotal = Object.values(revenueByProvider).reduce((sum, value) => sum + (value as number), 0);
  const payoutsTotal = Object.values(payoutsByProvider).reduce((sum, value) => sum + (value as number), 0);
  const ordersTotal = Object.values(salesByProvider).reduce((sum, value: any) => sum + (value.orders || 0), 0);
  const grossTotal = Object.values(salesByProvider).reduce((sum, value: any) => sum + (value.gross || 0), 0);

  return {
    date: metric.date,
    revenue: { total: revenueTotal, byProvider: revenueByProvider },
    payouts: { total: payoutsTotal, byProvider: payoutsByProvider },
    sales: { orders: ordersTotal, gross: grossTotal, byProvider: salesByProvider },
    socials: { byProvider: socialsByProvider },
    updatedAt: new Date().toISOString(),
  };
}

async function syncAllConnections() {
  const connectionsSnap = await db.collectionGroup("connections").get();

  for (const doc of connectionsSnap.docs) {
    const connection = doc.data() as ConnectionDoc;
    if (connection.status !== "connected" || !connection.nangoConnectionId) continue;
    const uid = doc.ref.parent.parent?.id;
    if (!uid) continue;
    const range = computeRange(connection.lastSyncAt);
    try {
      const resolvedMetadata = {
        ...connection.metadata,
        shopDomain:
          connection.metadata?.shopDomain ||
          (connection.metadata as any)?.shop ||
          (connection.metadata as any)?.shop_domain,
      };

      const metrics = await fetchMetricsForProvider(
        connection.provider,
        connection.nangoConnectionId,
        range,
        resolvedMetadata
      );
      for (const metric of metrics) {
        const metricsRef = db.collection("users").doc(uid).collection("metricsDaily").doc(metric.date);
        const snap = await metricsRef.get();
        const existing = snap.exists ? snap.data() : null;
        const merged = mergeMetrics(existing, connection.provider, metric);
        await metricsRef.set(merged, { merge: true });
      }

      await doc.ref.set(
        {
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: "ok",
          lastError: null,
        },
        { merge: true }
      );
    } catch (error) {
      await doc.ref.set(
        {
          lastSyncStatus: "error",
          lastError: {
            message: error instanceof Error ? error.message : "Sync failed",
            at: new Date().toISOString(),
          },
        },
        { merge: true }
      );
    }
  }
}

async function generateWeeklyBriefs() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set. Skipping AI briefs.");
    return;
  }

  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 86400000);
    const metricsSnap = await db
      .collection("users")
      .doc(uid)
      .collection("metricsDaily")
      .where("date", ">=", dateKey(start))
      .where("date", "<=", dateKey(end))
      .get();

    if (metricsSnap.empty) continue;
    const totals = metricsSnap.docs.reduce(
      (acc, doc) => {
        const data = doc.data() as any;
        acc.revenue += data.revenue?.total || 0;
        acc.payouts += data.payouts?.total || 0;
        acc.orders += data.sales?.orders || 0;
        return acc;
      },
      { revenue: 0, payouts: 0, orders: 0 }
    );

    const prompt = [
      "Return JSON with keys: title, summaryMarkdown, highlights, anomalies, recommendations, risks.",
      "Only use the numbers from this JSON context.",
      JSON.stringify({
        range: { start: dateKey(start), end: dateKey(end) },
        totals,
      }),
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) continue;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {}

    const weekKey = `${end.getUTCFullYear()}-W${String(
      Math.ceil((Number(end) - Number(new Date(Date.UTC(end.getUTCFullYear(), 0, 1)))) / 604800000)
    ).padStart(2, "0")}`;

    await db
      .collection("users")
      .doc(uid)
      .collection("aiBriefs")
      .doc(weekKey)
      .set({
        weekKey,
        range: { start: dateKey(start), end: dateKey(end) },
        summaryMarkdown: parsed.summaryMarkdown || "",
        highlights: parsed.highlights || [],
        anomalies: parsed.anomalies || [],
        recommendations: parsed.recommendations || [],
        risks: parsed.risks || [],
        createdAt: new Date().toISOString(),
      });

    if (totals.revenue === 0) {
      await db
        .collection("users")
        .doc(uid)
        .collection("alerts")
        .add({
          type: "revenue_drop",
          severity: "warn",
          message: "No revenue recorded in the last period.",
          createdAt: new Date().toISOString(),
          readAt: null,
        });
    }
  }
}

export const analyticsSync = onSchedule(
  { schedule: "every 6 hours", secrets: ["NANGO_SECRET_KEY"] },
  async () => {
    await syncAllConnections();
  }
);

async function computeNightlyAggregates() {
  const usersSnap = await db.collection("users").get();
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86400000);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const metricsSnap = await db
      .collection("users")
      .doc(uid)
      .collection("metricsDaily")
      .where("date", ">=", dateKey(start))
      .where("date", "<=", dateKey(end))
      .get();

    if (metricsSnap.empty) continue;

    const totals = metricsSnap.docs.reduce(
      (acc, doc) => {
        const data = doc.data() as any;
        acc.revenue += data.revenue?.total || 0;
        acc.payouts += data.payouts?.total || 0;
        acc.orders += data.sales?.orders || 0;
        return acc;
      },
      { revenue: 0, payouts: 0, orders: 0 }
    );

    await db
      .collection("users")
      .doc(uid)
      .collection("metricsAggregates")
      .doc("30d")
      .set({
        range: { start: dateKey(start), end: dateKey(end) },
        totals,
        updatedAt: new Date().toISOString(),
      });
  }
}

export const analyticsWeeklyBrief = onSchedule(
  { schedule: "0 9 * * 1", secrets: ["OPENAI_API_KEY"] },
  async () => {
    await generateWeeklyBriefs();
  }
);

export const analyticsNightly = onSchedule("0 2 * * *", async () => {
  await computeNightlyAggregates();
});
