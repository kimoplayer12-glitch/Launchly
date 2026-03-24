import crypto from "crypto";

const DEFAULT_NANGO_BASE_URL = "https://api.nango.dev";

function getNangoBaseUrl() {
  return process.env.NANGO_BASE_URL || DEFAULT_NANGO_BASE_URL;
}

function getNangoSecret() {
  const secret = process.env.NANGO_SECRET_KEY;
  if (!secret) {
    throw new Error("NANGO_SECRET_KEY is not set");
  }
  return secret;
}

export type ConnectSessionInput = {
  endUserId: string;
  endUserEmail?: string | null;
  allowedIntegrations: string[];
};

export async function createConnectSession(input: ConnectSessionInput) {
  const url = `${getNangoBaseUrl()}/connect/sessions`;
  const payload: Record<string, unknown> = {
    end_user: {
      id: input.endUserId,
      email: input.endUserEmail || undefined,
    },
    allowed_integrations: input.allowedIntegrations,
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
  const token =
    data?.token || data?.session_token || data?.sessionToken || data?.sessionTokenId;
  const connectUrl = data?.connect_link || data?.connectLink || data?.connect_url;

  if (!token && !connectUrl) {
    throw new Error("Nango connect session response missing token");
  }

  return {
    sessionToken: token as string | undefined,
    connectUrl: connectUrl as string | undefined,
  };
}

type ProxyRequestInput = {
  providerConfigKey: string;
  connectionId: string;
  method: string;
  endpoint: string;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  baseUrlOverride?: string;
};

export async function nangoProxyRequest<T = any>({
  providerConfigKey,
  connectionId,
  method,
  endpoint,
  query,
  headers,
  body,
  baseUrlOverride,
}: ProxyRequestInput): Promise<T> {
  const baseUrl = getNangoBaseUrl();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${baseUrl}/proxy/${providerConfigKey}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getNangoSecret()}`,
      "Content-Type": "application/json",
      "Connection-Id": connectionId,
      "Provider-Config-Key": providerConfigKey,
      ...(baseUrlOverride ? { "Base-Url-Override": baseUrlOverride } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Nango proxy error: ${response.status} ${message}`);
  }

  return (await response.json()) as T;
}

export async function deleteConnection(connectionId: string) {
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

  return true;
}

export function verifyNangoWebhookSignature(rawBody: string, signature: string) {
  const secret = getNangoSecret();
  const expected = crypto
    .createHash("sha256")
    .update(`${secret}${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
