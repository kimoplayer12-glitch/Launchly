import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import FloatingCard from "@/components/FloatingCard";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import FooterLinks from "@/components/FooterLinks";
import IntegrationModal from "@/components/IntegrationModal";
import { DollarSign, TrendingUp, Link as LinkIcon, Plus, ArrowUpRight, ArrowDownRight, X, Check, BarChart3, AlertCircle } from "lucide-react";
import { readJson } from "@/lib/api-client";
import { getStoredAuthUser } from "@/lib/auth-client";

interface RevenueStream {
  id: string;
  name: string;
  amount: number;
  change: number;
  icon: string;
  lastUpdated: number;
}

interface Platform {
  id: string;
  name: string;
  status: "connected" | "not-connected";
  users: number;
}

interface Integration {
  id: string;
  platform: string;
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  connectedAt: number;
  data?: Record<string, any>;
}

interface MonetizeData {
  totalRevenue: number;
  projectedMonthly: number;
  annualRevenue: number;
  revenueStreams: RevenueStream[];
  platforms: Platform[];
  lastUpdated: number;
}

export default function MonetizeHub() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [monetizeData, setMonetizeData] = useState<MonetizeData | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [integrationModal, setIntegrationModal] = useState<{
    isOpen: boolean;
    platform: string | null;
  }>({ isOpen: false, platform: null });

  // Fetch monetize data on mount, don't wait for auth
  useEffect(() => {
    fetchMonetizeData();
    fetchIntegrations();
  }, []);

  // Redirect unauthenticated users AFTER auth state resolves and data is loaded
  useEffect(() => {
    if (!loading && !isAuthenticated && monetizeData) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, monetizeData, navigate]);

  const fetchMonetizeData = async () => {
    try {
      setDataLoading(true);
      const user = getStoredAuthUser();
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user-id"] = user.id;
      }
      
      const response = await fetch("/api/monetize/data", { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch monetize data`);
      }
      const data = await readJson(response);
      setMonetizeData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching monetize data:", err);
      setError(err instanceof Error ? err.message : "Failed to load monetize data. Please try again.");
    } finally {
      setDataLoading(false);
    }
  };

  const getHeaders = async () => {
    const user = getStoredAuthUser();
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (user) {
      headers["x-user-id"] = user.id;
    }
    
    return headers;
  };

  const fetchIntegrations = async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch("/api/integrations", { headers });
      if (response.ok) {
        const data = await readJson(response);
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error("Error fetching integrations:", err);
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      const headers = await getHeaders();
      const response = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers,
        body: JSON.stringify({ integrationId }),
      });

      if (response.ok) {
        await fetchIntegrations();
      }
    } catch (err) {
      console.error("Error disconnecting integration:", err);
      setError("Failed to disconnect integration");
    }
  };

  const updateRevenueStream = async (streamId: string, amount: number) => {
    if (!monetizeData) return;

    try {
      const stream = monetizeData.revenueStreams.find((s) => s.id === streamId);
      if (!stream) return;

      const headers = await getHeaders();
      const response = await fetch("/api/monetize/revenue-stream", {
        method: "POST",
        headers,
        body: JSON.stringify({
          streamId,
          name: stream.name,
          amount,
          change: stream.change,
        }),
      });

      if (!response.ok) throw new Error("Failed to update revenue stream");

      // Refresh data
      await fetchMonetizeData();
    } catch (err) {
      console.error("Error updating revenue stream:", err);
      setError("Failed to update revenue stream");
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    try {
      setConnectingPlatform(platformId);
      const headers = await getHeaders();
      
      // Mock connection - in production, this would open OAuth flow
      const response = await fetch("/api/monetize/connect-platform", {
        method: "POST",
        headers,
        body: JSON.stringify({
          platformId,
          accessToken: "mock_token_" + platformId,
          users: Math.floor(Math.random() * 1000),
        }),
      });

      if (!response.ok) throw new Error("Failed to connect platform");

      // Refresh data
      await fetchMonetizeData();
    } catch (err) {
      console.error("Error connecting platform:", err);
      setError("Failed to connect platform");
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleConnectIntegration = async (platform: string, credentials: Record<string, string>) => {
    try {
      const headers = await getHeaders();
      const platformStr = String(platform || "").toLowerCase();
      
      if (!headers["x-user-id"]) {
        setError("User not authenticated. Please log in first.");
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({
          platform: platformStr,
          credentials,
          name: platformStr.charAt(0).toUpperCase() + platformStr.slice(1),
        }),
      });

      const responseData = await readJson(response);
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to connect integration");
      }

      setError(null);
      await fetchIntegrations();
    } catch (err) {
      console.error("Error connecting integration:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to connect integration";
      setError(errorMsg);
      throw err;
    }
  };

  const handleDisconnectPlatform = async (platformId: string) => {
    try {
      const headers = await getHeaders();
      const response = await fetch("/api/monetize/disconnect-platform", {
        method: "POST",
        headers,
        body: JSON.stringify({ platformId }),
      });

      if (!response.ok) throw new Error("Failed to disconnect platform");

      // Refresh data
      await fetchMonetizeData();
    } catch (err) {
      console.error("Error disconnecting platform:", err);
      setError("Failed to disconnect platform");
    }
  };

  const openIntegrationModal = (platformId?: string) => {
    setIntegrationModal({ isOpen: true, platform: platformId || null });
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (dataLoading || !monetizeData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading monetize data...</div>
        </div>
      </div>
    );
  }

  const revenueStreams = monetizeData.revenueStreams;
  const platforms = monetizeData.platforms;

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Monetize Hub</h1>
            <p className="text-foreground/60">
              Connect revenue streams and track earnings across all channels
            </p>
          </div>
        </div>

        {/* Total Revenue & Income */}
        <FloatingCard delay={0} className="mb-12">
          <GlassCard variant="dark" className="border-neon-cyan/30 p-8">
            <div className="space-y-6">
              <div>
                <p className="text-foreground/60 text-sm mb-2">Total Income (This Month)</p>
                <h2 className="text-5xl font-bold gradient-text mb-4">
                  ${monetizeData.totalRevenue.toLocaleString()}
                </h2>
                <p className="text-foreground/60">
                  <span className="text-green-400 font-semibold">+23%</span> from last month
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-foreground/60 text-xs mb-1">Monthly Income</p>
                  <p className="text-lg font-bold">
                    ${Math.round(monetizeData.totalRevenue).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/60 text-xs mb-1">Projected Monthly</p>
                  <p className="text-lg font-bold">
                    ${Math.round(monetizeData.projectedMonthly).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/60 text-xs mb-1">Annual Income</p>
                  <p className="text-lg font-bold">
                    ${Math.round(monetizeData.annualRevenue).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </FloatingCard>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 text-sm">
            {error}
          </div>
        )}

        {/* Social Media Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Social Media Performance</h2>
          {integrations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {integrations.map((platform, i) => {
                const data = platform.data || {};
                const statKeys = Object.entries(data)
                  .filter(([key]) => key !== "lastUpdated")
                  .slice(0, 3);
                
                return (
                  <FloatingCard key={platform.id} delay={i * 100}>
                    <GlassCard variant="dark" className="border-white/10">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{platform.icon}</div>
                            <div>
                              <p className="font-semibold">{platform.name}</p>
                              <p className="text-foreground/60 text-xs">Performance Metrics</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/10">
                          {statKeys.map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <p className="text-foreground/60 text-sm capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </p>
                              <p className="font-semibold text-lg">
                                {typeof value === "number" ? value.toLocaleString() : value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  </FloatingCard>
                );
              })}
            </div>
          ) : (
            <GlassCard variant="dark" className="border-white/10 p-8 text-center">
              <p className="text-foreground/60">Connect social platforms to view performance metrics</p>
            </GlassCard>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Connected Platforms */}
          <div className="lg:col-span-2">
            <FloatingCard delay={200}>
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Connected Platforms</h3>
                      <p className="text-foreground/60 text-sm mt-1">Manage your revenue integrations</p>
                    </div>
                    <button
                      className="btn-neon px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
                      onClick={() => openIntegrationModal()}
                    >
                      <Plus className="w-4 h-4" /> Connect
                    </button>
                  </div>

                  <div className="space-y-3">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <LinkIcon className="w-5 h-5 text-neon-cyan opacity-70" />
                            <div>
                              <p className="font-semibold">{platform.name}</p>
                              <p className="text-xs text-foreground/60">
                                {platform.users > 0
                                  ? `${platform.users.toLocaleString()} customers`
                                  : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {platform.status === "connected" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Connected
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/60">
                                Connected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </FloatingCard>
          </div>

          {/* Growth Tips */}
          <FloatingCard delay={300}>
            <GlassCard variant="dark" className="border-white/10 h-full">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Growth Tips</h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: "📈",
                      title: "Premium Tier",
                      desc: "Add a $99/mo option to increase ARPU",
                    },
                    {
                      icon: "🎁",
                      title: "Launch Bundles",
                      desc: "Create product combos for more value",
                    },
                    {
                      icon: "👥",
                      title: "Partnerships",
                      desc: "Partner with complementary businesses",
                    },
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-colors cursor-pointer group"
                    >
                      <div className="text-lg mb-1">{tip.icon}</div>
                      <p className="font-semibold text-sm group-hover:text-neon-cyan transition-colors">
                        {tip.title}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </FloatingCard>
        </div>

        {/* Integrations Section */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Connected Integrations</h2>
            <p className="text-foreground/60">
              Connect your sales platforms, payment processors, and social media accounts
            </p>
          </div>

          {/* Currently Connected Integrations */}
          {integrations.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4">Active Connections</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                  <FloatingCard key={integration.id}>
                    <GlassCard variant="dark" className="border-green-500/30">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{integration.icon}</div>
                            <div>
                              <h3 className="font-semibold">{integration.name}</h3>
                              <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                <Check className="w-3 h-3" /> Connected
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDisconnectIntegration(integration.id)}
                            className="p-2 hover:bg-cyan-400/15 rounded-lg transition-colors text-cyan-300"
                            title="Disconnect"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Stats Grid */}
                        {integration.data && (
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                            {Object.entries(integration.data)
                              .filter(([key]) => key !== "lastUpdated")
                              .slice(0, 4)
                              .map(([key, value]) => (
                                <div key={key} className="p-2 rounded bg-white/5">
                                  <p className="text-xs text-foreground/60 capitalize">
                                    {key.replace(/([A-Z])/g, " $1")}
                                  </p>
                                  <p className="text-sm font-semibold mt-1">
                                    {typeof value === "number"
                                      ? value.toLocaleString()
                                      : value}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Connected Date */}
                        <div className="text-xs text-foreground/50 flex items-center gap-2 pt-2 border-t border-white/10">
                          <BarChart3 className="w-3 h-3" />
                          Connected{" "}
                          {new Date(integration.connectedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </GlassCard>
                  </FloatingCard>
                ))}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <h3 className="text-lg font-semibold mb-4">
            {integrations.length > 0 ? "Add More Integrations" : "Get Started"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {
                id: "shopify",
                name: "Shopify",
                icon: "🛍️",
                description: "Online store",
              },
              {
                id: "stripe",
                name: "Stripe",
                icon: "💳",
                description: "Payments",
              },
              {
                id: "paddle",
                name: "Paddle",
                icon: "🏄",
                description: "Subscriptions",
              },
              {
                id: "instagram",
                name: "Instagram",
                icon: "📸",
                description: "Social media",
              },
              {
                id: "twitter",
                name: "Twitter",
                icon: "𝕏",
                description: "Social media",
              },
              {
                id: "tiktok",
                name: "TikTok",
                icon: "🎵",
                description: "Creator",
              },
              {
                id: "youtube",
                name: "YouTube",
                icon: "▶️",
                description: "Video platform",
              },
            ].map((platform) => (
              <FloatingCard key={platform.id}>
                <GlassCard
                  variant="dark"
                  className="border-white/10 cursor-pointer hover:border-neon-cyan/50 transition-all h-full flex flex-col"
                  onClick={() =>
                    setIntegrationModal({ isOpen: true, platform: platform.id })
                  }
                >
                  <div className="flex flex-col items-center justify-center space-y-3 h-full p-6">
                    <div className="text-4xl">{platform.icon}</div>
                    <div className="text-center">
                      <h3 className="font-semibold text-sm">{platform.name}</h3>
                      <p className="text-xs text-foreground/60">{platform.description}</p>
                    </div>
                    <button
                      className="w-full mt-auto px-3 py-1.5 bg-neon-cyan/20 hover:bg-neon-cyan/30 rounded text-xs font-medium transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                        openIntegrationModal(platform.id);
                      }}
                    >
                      Connect
                    </button>
                  </div>
                </GlassCard>
              </FloatingCard>
            ))}
          </div>
        </div>

        <FooterLinks />
      </div>

      {/* Integration Modal */}
      <IntegrationModal
        isOpen={integrationModal.isOpen}
        platform={integrationModal.platform || ""}
        onClose={() => setIntegrationModal({ isOpen: false, platform: null })}
        onConnect={(credentials) =>
          handleConnectIntegration(integrationModal.platform || "", credentials)
        }
      />
    </div>
  );
}

