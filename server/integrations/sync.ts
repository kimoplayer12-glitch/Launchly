import { metricsRef, listConnections, markConnectionError, upsertConnection, upsertMetricsDaily } from "./firestore";
import { mergeProviderMetrics } from "./metrics";
import { fetchProviderMetrics } from "./providers";
import type { ProviderKey } from "./types";

function computeRange(lastSyncAt?: string | null) {
  const end = new Date();
  let start: Date;
  if (lastSyncAt) {
    start = new Date(lastSyncAt);
    if (Number.isNaN(start.getTime())) {
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  } else {
    start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const maxLookback = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (start < maxLookback) {
    start = maxLookback;
  }

  return { start, end };
}

export async function syncConnectionsForUser(uid: string, provider?: ProviderKey) {
  const connections = await listConnections(uid);
  const filtered = provider
    ? connections.filter((connection) => connection.provider === provider)
    : connections;

  for (const connection of filtered) {
    if (connection.status !== "connected") continue;
    if (!connection.nangoConnectionId) continue;
    await syncSingleConnection(uid, connection.provider as ProviderKey, connection);
  }
}

async function syncSingleConnection(
  uid: string,
  provider: ProviderKey,
  connection: any
) {
  const range = computeRange(connection.lastSyncAt);
  try {
    const resolvedMetadata = {
      ...connection.metadata,
      shopDomain:
        connection.metadata?.shopDomain ||
        connection.metadata?.shop ||
        connection.metadata?.shop_domain,
    };

    const { metrics, metadata } = await fetchProviderMetrics(
      provider,
      connection.nangoConnectionId,
      range,
      resolvedMetadata
    );

    for (const metric of metrics) {
      const snap = await metricsRef(uid, metric.date).get();
      const existing = snap.exists ? (snap.data() as any) : null;
      const merged = mergeProviderMetrics(existing, provider, metric);
      await upsertMetricsDaily(uid, metric.date, merged);
    }

    await upsertConnection(uid, provider, {
      status: "connected",
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: "ok",
      lastError: null,
      metadata: {
        ...resolvedMetadata,
        ...metadata,
      },
    });
  } catch (error) {
    await markConnectionError(uid, provider, {
      message: error instanceof Error ? error.message : "Sync failed",
    });
  }
}
