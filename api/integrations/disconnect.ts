import admin from "firebase-admin";

const SUPPORTED_PROVIDERS = ["stripe", "paypal", "shopify", "instagram", "tiktok"] as const;
type Provider = (typeof SUPPORTED_PROVIDERS)[number];

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

function readBearerToken(req: any) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function readUserIdHeader(req: any) {
  const value = req.headers["x-user-id"];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

async function getUserId(req: any) {
  const userIdFromHeader = readUserIdHeader(req);
  if (userIdFromHeader) {
    return userIdFromHeader;
  }
  const token = readBearerToken(req);
  if (!token) return null;
  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function isSupportedProvider(value: string): value is Provider {
  return SUPPORTED_PROVIDERS.includes(value as Provider);
}

function getNangoBaseUrl() {
  return process.env.NANGO_BASE_URL || "https://api.nango.dev";
}

function getNangoSecret() {
  const secret = process.env.NANGO_SECRET_KEY;
  if (!secret) {
    throw new Error("NANGO_SECRET_KEY is not set");
  }
  return secret;
}

async function deleteNangoConnection(connectionId: string) {
  const url = `${getNangoBaseUrl()}/connection/${connectionId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getNangoSecret()}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Nango delete connection failed: ${message}`);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const providerParam = String(req.body?.provider || "");
  if (!isSupportedProvider(providerParam)) {
    return res.status(400).json({ error: "Unsupported provider" });
  }

  try {
    const connectionRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc(providerParam);
    const snapshot = await connectionRef.get();
    const connection = snapshot.data() as { nangoConnectionId?: string } | undefined;

    if (!connection?.nangoConnectionId) {
      return res.status(404).json({ error: "Connection not found" });
    }

    await deleteNangoConnection(connection.nangoConnectionId);

    await connectionRef.set(
      {
        status: "disconnected",
        nangoConnectionId: "",
        updatedAt: new Date().toISOString(),
        lastSyncStatus: null,
        lastSyncAt: null,
        lastError: null,
      },
      { merge: true }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disconnect provider";
    return res.status(500).json({ error: message });
  }
}
