import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { authFetch, readJson } from "@/lib/api-client";

type Connection = {
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSyncAt?: string | null;
  lastSyncStatus?: "ok" | "error" | null;
  lastError?: { message: string } | null;
  metadata?: { accountName?: string; accountId?: string };
};

const PROVIDERS = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Revenue + payouts from connected accounts.",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Transactions and payouts from PayPal.",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Orders and sales from your Shopify store.",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Orders and revenue from WooCommerce.",
    comingSoon: true,
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    description: "Orders and sales from BigCommerce.",
    comingSoon: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Followers, impressions, and engagement (pro accounts only).",
  },
  {
    id: "facebook",
    name: "Facebook Pages",
    description: "Page followers and engagement.",
    comingSoon: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Followers and views from TikTok.",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Followers and engagement.",
    comingSoon: true,
  },
  {
    id: "snapchat",
    name: "Snapchat",
    description: "Views and engagement.",
    comingSoon: true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    description: "Pin impressions and engagement.",
    comingSoon: true,
  },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function SettingsConnections() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useFirebaseAuth();
  const [connections, setConnections] = useState<Record<string, Connection>>({});
  const [busy, setBusy] = useState<string | null>(null);


  const loadConnections = useCallback(async () => {
    if (!isAuthenticated) return;
    const response = await authFetch("/api/integrations/connections");
    const data = await readJson<{ connections: Connection[] }>(response);
    if (!response.ok) {
      throw new Error((data as any)?.error || "Failed to load connections");
    }
    const map: Record<string, Connection> = {};
    data.connections.forEach((connection) => {
      map[connection.provider] = connection;
    });
    setConnections(map);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!loading && isAuthenticated) {
      loadConnections().catch((err) => toast(err.message));
    }
  }, [loading, isAuthenticated, loadConnections, navigate]);

  const handleConnect = async (provider: string) => {
    setBusy(provider);
    try {
      const response = await authFetch("/api/integrations/connect", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      const data = await readJson<{ sessionToken?: string; connectUrl?: string; error?: string }>(
        response
      );
      if (!response.ok) {
        throw new Error(data.error || "Failed to start connect flow");
      }

      if (!data.connectUrl) {
        throw new Error("Missing Nango connect URL");
      }
      window.location.href = data.connectUrl;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!window.confirm("Disconnect this provider?")) {
      return;
    }
    setBusy(provider);
    try {
      const response = await authFetch("/api/integrations/disconnect", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      const data = await readJson<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect");
      }
      await loadConnections();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">Settings</p>
        <h1 className="page-title">Connections</h1>
        <p className="page-subtitle">
          Connect your revenue and social platforms to power analytics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const connection = connections[provider.id];
          const status = connection?.status || "disconnected";
          const isConnected = status === "connected";
          const isError = status === "error";
          const isComingSoon = (provider as any).comingSoon;
          return (
            <div key={provider.id} className="clean-card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <p className="text-sm text-foreground/60">{provider.description}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    isComingSoon
                      ? "border-white/10 text-foreground/50"
                      : isConnected
                        ? "border-emerald-500/40 text-emerald-300"
                        : isError
                          ? "border-red-500/40 text-red-300"
                          : "border-white/15 text-foreground/60"
                  }`}
                >
                  {isComingSoon
                    ? "Coming soon"
                    : isConnected
                      ? "Connected"
                      : isError
                        ? "Needs attention"
                        : "Not connected"}
                </span>
              </div>

              <div className="text-xs text-foreground/60 space-y-1">
                <div>
                  Last sync:{" "}
                  {isConnected && !connection?.lastSyncAt
                    ? "Syncing..."
                    : formatDate(connection?.lastSyncAt)}
                </div>
                {connection?.metadata?.accountName && (
                  <div>Account: {connection.metadata.accountName}</div>
                )}
                {connection?.lastError?.message && (
                  <div className="text-red-300">{connection.lastError.message}</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isComingSoon ? (
                  <Button variant="outline" disabled>
                    Coming soon
                  </Button>
                ) : isConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(provider.id)}
                    disabled={busy === provider.id}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(provider.id)}
                    disabled={busy === provider.id}
                  >
                    {busy === provider.id ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
