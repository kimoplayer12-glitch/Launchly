import admin from "firebase-admin";
import { initializeFirebase } from "../firebase-init";
import type { ConnectionDoc, DailyMetricsDoc, ProviderKey } from "./types";

function getDb() {
  initializeFirebase();
  return admin.firestore();
}

export function connectionRef(uid: string, provider: ProviderKey) {
  return getDb().collection("users").doc(uid).collection("connections").doc(provider);
}

export function metricsRef(uid: string, date: string) {
  return getDb().collection("users").doc(uid).collection("metricsDaily").doc(date);
}

export function aiBriefRef(uid: string, weekKey: string) {
  return getDb().collection("users").doc(uid).collection("aiBriefs").doc(weekKey);
}

export function alertsRef(uid: string) {
  return getDb().collection("users").doc(uid).collection("alerts");
}

export async function getConnection(uid: string, provider: ProviderKey) {
  const snap = await connectionRef(uid, provider).get();
  return snap.exists ? (snap.data() as ConnectionDoc) : null;
}

export async function listConnections(uid: string) {
  const snapshot = await getDb().collection("users").doc(uid).collection("connections").get();
  return snapshot.docs.map((doc) => ({ provider: doc.id, ...(doc.data() as ConnectionDoc) }));
}

export async function upsertConnection(
  uid: string,
  provider: ProviderKey,
  data: Partial<ConnectionDoc>
) {
  const now = new Date().toISOString();
  const ref = connectionRef(uid, provider);
  const existing = await ref.get();
  const existingConnectedAt = existing.exists
    ? (existing.data() as ConnectionDoc).connectedAt
    : undefined;
  const payload = {
    ...data,
    provider,
    updatedAt: now,
    connectedAt: data.connectedAt ?? existingConnectedAt ?? now,
  } as ConnectionDoc;
  await ref.set(payload, { merge: true });
  return payload;
}

export async function markConnectionError(
  uid: string,
  provider: ProviderKey,
  error: { message: string; code?: string }
) {
  const now = new Date().toISOString();
  await connectionRef(uid, provider).set(
    {
      status: "error",
      lastSyncStatus: "error",
      lastError: { message: error.message, code: error.code, at: now },
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function upsertMetricsDaily(
  uid: string,
  date: string,
  metrics: DailyMetricsDoc
) {
  const now = new Date().toISOString();
  await metricsRef(uid, date).set(
    {
      ...metrics,
      date,
      updatedAt: now,
      createdAt: metrics.createdAt ?? now,
    },
    { merge: true }
  );
}

export async function createAlert(uid: string, alert: { type: string; severity: string; message: string }) {
  await alertsRef(uid).add({
    ...alert,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
}

export async function listMetricsByRange(uid: string, start: string, end: string) {
  const snapshot = await getDb()
    .collection("users")
    .doc(uid)
    .collection("metricsDaily")
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get();
  return snapshot.docs.map((doc) => doc.data() as DailyMetricsDoc);
}
