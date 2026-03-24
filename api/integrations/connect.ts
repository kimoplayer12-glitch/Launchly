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

function getProviderConfigKey(provider: Provider) {
  const envKey = `NANGO_INTEGRATION_${provider.toUpperCase()}`;
  return process.env[envKey] || provider;
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

async function createNangoConnectSession(input: {
  userId: string;
  email?: string | null;
  provider: Provider;
}) {
  const url = `${getNangoBaseUrl()}/connect/sessions`;
  const payload: Record<string, unknown> = {
    end_user: {
      id: input.userId,
      email: input.email || undefined,
    },
    allowed_integrations: [getProviderConfigKey(input.provider)],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getNangoSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Nango connect session failed: ${message}`);
  }

  const data = await response.json();
  const sessionToken =
    data?.token || data?.session_token || data?.sessionToken || data?.sessionTokenId;
  const connectUrl = data?.connect_link || data?.connectLink || data?.connect_url;

  if (!sessionToken && !connectUrl) {
    throw new Error("Nango connect session response missing token");
  }

  return {
    sessionToken: sessionToken as string | undefined,
    connectUrl: connectUrl as string | undefined,
  };
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
    const session = await createNangoConnectSession({
      userId,
      email: req.body?.email,
      provider: providerParam,
    });

    const now = new Date().toISOString();
    await getDb()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc(providerParam)
      .set(
        {
          provider: providerParam,
          status: "connected",
          nangoConnectionId: "",
          connectedAt: now,
          updatedAt: now,
          lastSyncAt: null,
          lastSyncStatus: null,
          lastError: null,
        },
        { merge: true }
      );

    const connectUrl =
      session.connectUrl ||
      (session.sessionToken && process.env.NANGO_CONNECT_URL
        ? `${process.env.NANGO_CONNECT_URL}?session_token=${session.sessionToken}`
        : undefined);

    return res.status(200).json({
      provider: providerParam,
      sessionToken: session.sessionToken,
      connectUrl,
      redirectUrl: connectUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect provider";
    return res.status(500).json({ error: message });
  }
}
