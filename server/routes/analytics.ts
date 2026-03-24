import type { RequestHandler } from "express";
import { z } from "zod";
import { createConnectSession, deleteConnection, verifyNangoWebhookSignature } from "../integrations/nango";
import { isSupportedProvider } from "../integrations/providers";
import { getProviderConfigKey, getProviderFromConfigKey } from "../integrations/provider-config";
import { listConnections, listMetricsByRange, upsertConnection } from "../integrations/firestore";
import { syncConnectionsForUser } from "../integrations/sync";
import { buildMetricsContext, generateWeeklyBrief, answerMetricsQuestion } from "../integrations/ai";

function sanitizeMetadata(input: any) {
  if (!input || typeof input !== "object") return undefined;
  return {
    accountName: input.accountName || input.account_name,
    accountId: input.accountId || input.account_id,
    currency: input.currency,
    shopDomain: input.shopDomain || input.shop || input.shop_domain,
    igUserId: input.igUserId || input.ig_user_id,
    tiktokUserId: input.tiktokUserId || input.tiktok_user_id,
  };
}


export const handleConnectProvider: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const provider = req.params.provider;
    if (!isSupportedProvider(provider)) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    const session = await createConnectSession({
      endUserId: userId,
      endUserEmail: req.body?.email,
      allowedIntegrations: [getProviderConfigKey(provider)],
    });

    await upsertConnection(userId, provider, {
      status: "connected",
      nangoConnectionId: "",
      lastSyncAt: null,
      lastSyncStatus: null,
      lastError: null,
    });

    const connectUrl =
      session.connectUrl ||
      (session.sessionToken && process.env.NANGO_CONNECT_URL
        ? `${process.env.NANGO_CONNECT_URL}?session_token=${session.sessionToken}`
        : undefined);

    return res.json({
      sessionToken: session.sessionToken,
      connectUrl,
      redirectUrl: connectUrl,
      provider,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to connect provider",
    });
  }
};

export const handleDisconnectProvider: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const provider = req.params.provider;
    if (!isSupportedProvider(provider)) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    const connections = await listConnections(userId);
    const connection = connections.find((item) => item.provider === provider);
    if (!connection?.nangoConnectionId) {
      return res.status(404).json({ error: "Connection not found" });
    }

    await deleteConnection(connection.nangoConnectionId);
    await upsertConnection(userId, provider, {
      status: "disconnected",
      nangoConnectionId: "",
      lastSyncStatus: null,
      lastSyncAt: null,
      lastError: null,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to disconnect provider",
    });
  }
};

export const handleProviderCallback: RequestHandler = async (req, res) => {
  const provider = req.params.provider;
  const redirectBase = process.env.APP_BASE_URL || "";
  return res.redirect(`${redirectBase}/settings/connections?connected=${provider}`);
};

export const handleListConnections: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const connections = await listConnections(userId);
    return res.json({ connections });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load connections" });
  }
};

export const handleNangoWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["x-nango-signature"] as string | undefined;
  const rawBody = (req as any).rawBody?.toString() || JSON.stringify(req.body || {});
  if (!signature || !verifyNangoWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body;
  const eventType = event?.type || event?.event;
  const data = event?.data || {};
  const integrationKey =
    data?.provider_config_key || data?.providerConfigKey || data?.integration_id;
  const connectionId = data?.connection_id || data?.connectionId;
  const endUserId = data?.end_user?.id || data?.endUser?.id;

  if (!integrationKey || !connectionId || !endUserId) {
    return res.status(200).json({ received: true });
  }

  const providerKey = getProviderFromConfigKey(integrationKey);
  if (!providerKey) {
    return res.status(200).json({ received: true });
  }

  if (eventType === "connection.deleted") {
    await upsertConnection(endUserId, providerKey, {
      status: "disconnected",
      nangoConnectionId: "",
      lastSyncStatus: null,
      lastSyncAt: null,
    });
    return res.json({ received: true });
  }

  await upsertConnection(endUserId, providerKey, {
    status: "connected",
    nangoConnectionId: connectionId,
    metadata: sanitizeMetadata(data?.metadata),
  });

  // Kick off a sync in the background for fresh metrics
  syncConnectionsForUser(endUserId, providerKey).catch(() => undefined);

  return res.json({ received: true });
};

export const handleSyncRun: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { uid, provider } = req.body ?? {};
    const adminUid = process.env.ADMIN_UID;
    const targetUid = adminUid && adminUid === userId && uid ? uid : userId;

    if (provider && !isSupportedProvider(provider)) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    await syncConnectionsForUser(targetUid, provider);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Sync failed",
    });
  }
};

export const handleAnalyticsOverview: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const rangeParam = (req.query.range as string) || "30d";
    const days = rangeParam === "7d" ? 7 : 30;
  const context = await buildMetricsContext(userId, days);
    const daily = await listMetricsByRange(userId, context.range.start, context.range.end);
    const connections = await listConnections(userId);
    return res.json({ context, connections, daily });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load analytics" });
  }
};

export const handleAiBrief: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const schema = z.object({ days: z.number().min(1).max(30).optional() });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const days = parsed.data.days ?? 7;
    const brief = await generateWeeklyBrief(userId, days);
    return res.json({ brief });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate brief",
    });
  }
};

export const handleAiAsk: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const schema = z.object({
      question: z.string().min(1),
      days: z.number().min(1).max(60).optional(),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const question = parsed.data.question;
    const days = parsed.data.days ?? 30;
    const result = await answerMetricsQuestion(userId, question, days);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to answer",
    });
  }
};
