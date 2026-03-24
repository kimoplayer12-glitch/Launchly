import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useCredits } from "@/hooks/use-credits";
import { authFetch, readJson } from "@/lib/api-client";
import {
  Zap,
  Share2,
  Sparkles,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Compass,
} from "lucide-react";
import FooterLinks from "@/components/FooterLinks";
import { toast } from "@/components/ui/use-toast";

type DailyMetric = {
  date: string;
  revenue?: { total?: number };
  payouts?: { total?: number };
  sales?: { orders?: number };
  socials?: {
    byProvider?: Record<string, { followersDelta?: number; views?: number }>;
  };
};

type Connection = {
  provider: string;
  status?: "connected" | "disconnected" | "error";
  lastSyncAt?: string | null;
  lastSyncStatus?: "ok" | "error" | null;
};

type AnalyticsOverview = {
  context: {
    totals: {
      revenue: number;
      payouts: number;
      orders: number;
      followersDelta: number;
      views: number;
      engagementRate: number;
    };
    range: { start: string; end: string; days: number };
  };
  daily: DailyMetric[];
  connections: Connection[];
};

function isAnalyticsOverview(payload: any): payload is AnalyticsOverview {
  return (
    !!payload?.context?.totals &&
    !!payload?.context?.range &&
    Array.isArray(payload?.daily) &&
    Array.isArray(payload?.connections)
  );
}

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

function toTitleCase(input: string) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useFirebaseAuth();
  const { credits } = useCredits();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [loading, isAuthenticated, navigate, user]);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setAnalytics(null);
      setAnalyticsLoading(false);
      return;
    }

    let cancelled = false;
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const response = await authFetch("/api/analytics/overview?range=30d");
        const payload = await readJson<AnalyticsOverview & { error?: string }>(response);
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load analytics");
        }
        if (!isAnalyticsOverview(payload)) {
          throw new Error("Received invalid analytics response");
        }
        if (!cancelled) {
          setAnalytics(payload);
          setAnalyticsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setAnalytics(null);
          setAnalyticsError(
            error instanceof Error ? error.message : "Failed to load analytics"
          );
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.uid]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading your workspace...</div>
        </div>
      </div>
    );
  }

  const totals = analytics?.context.totals ?? {
    revenue: 0,
    payouts: 0,
    orders: 0,
    followersDelta: 0,
    views: 0,
    engagementRate: 0,
  };

  const fallbackRevenueBars = [35, 42, 38, 55, 48, 62, 58, 71, 65, 78];
  const revenueValues = (analytics?.daily ?? []).map(
    (item) => item.revenue?.total || 0
  );
  const revenueBars =
    revenueValues.length === 0
      ? fallbackRevenueBars
      : revenueValues.slice(-10).map((value, _, arr) => {
          const max = Math.max(...arr, 1);
          const normalized = Math.round((value / max) * 100);
          return Math.max(normalized, 8);
        });

  const stats = [
    {
      title: "Revenue (30d)",
      value: formatMoney(totals.revenue),
      change: totals.revenue > 0 ? "Live data" : "No data",
      positive: totals.revenue > 0,
      accent: false,
      spark: revenueBars,
    },
    {
      title: "Orders (30d)",
      value: totals.orders.toLocaleString(),
      change: totals.orders > 0 ? "Live data" : "No data",
      positive: totals.orders > 0,
      accent: false,
      spark: [8, 10, 9, 11, 10, 13, 12],
    },
    {
      title: "Views (30d)",
      value: totals.views.toLocaleString(),
      change: totals.views > 0 ? "Live data" : "No data",
      positive: totals.views > 0,
      accent: true,
      spark: [20, 18, 22, 26, 24, 28, 30],
    },
    {
      title: "Engagement Rate",
      value: `${(totals.engagementRate * 100).toFixed(2)}%`,
      change: totals.engagementRate > 0 ? "Live data" : "No data",
      positive: totals.engagementRate > 0,
      accent: false,
      spark: [3, 4, 3, 5, 4, 6, 5],
    },
  ];

  const connectionRows = (analytics?.connections ?? []).slice(0, 6).map((connection) => ({
    type: "Connection",
    title: `${toTitleCase(connection.provider)} account`,
    status:
      connection.status === "connected" && connection.lastSyncStatus !== "error"
        ? "Healthy"
        : "Needs Attention",
    date: connection.lastSyncAt ? new Date(connection.lastSyncAt) : new Date(),
    outcome:
      connection.status === "connected" && connection.lastSyncStatus !== "error"
        ? "Synced"
        : "Reconnect",
  }));

  const fallbackRows = [
    {
      type: "Analytics",
      title: "Connect Stripe, Shopify, or social channels",
      status: "Action Needed",
      date: new Date(),
      outcome: "No live sources",
    },
    {
      type: "Analytics",
      title: "Run your first metrics sync",
      status: "Action Needed",
      date: new Date(),
      outcome: "Data pending",
    },
  ];

  const rows = connectionRows.length ? connectionRows : fallbackRows;

  const handleAction = (label: string) => {
    switch (label) {
      case "Create Campaign":
      case "Generate Ad":
        navigate("/adgen");
        break;
      case "Schedule Post":
      case "View Calendar":
        navigate("/social-media-scheduler");
        break;
      case "Generate Website":
        navigate("/dashboard/generate");
        break;
      case "Open Analytics":
        navigate("/dashboard/analytics");
        break;
      default:
        toast({
          title: "Action unavailable",
          description: "This action is not configured yet.",
        });
    }
  };

  return (
    <div className="page-shell">
      <div className="section space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="section-header">
            <h1 className="section-title">Dashboard</h1>
            <p className="text-foreground/60">
              Live analysis is now embedded here and updates from your metrics feed.
            </p>
          </div>
          <button className="subtle-button" onClick={() => navigate("/pricing")}>
            Upgrade
          </button>
        </div>

        {analyticsError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Analytics unavailable: {analyticsError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((metric) => (
            <div key={metric.title} className="metric-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                    {metric.title}
                  </p>
                  <p
                    className={`text-3xl font-semibold mt-2 ${
                      metric.accent ? "text-neon-cyan/90" : "text-foreground"
                    }`}
                  >
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    metric.positive
                      ? "text-green-400/80 bg-green-400/10"
                      : "text-red-400/80 bg-red-400/10"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {metric.positive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/50">
                  {analyticsLoading ? "Refreshing..." : "30-day trend"}
                </span>
                <Sparkline data={metric.spark} className="text-foreground/40" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
          <div className="premium-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Revenue Analysis</h3>
                <p className="text-xs text-foreground/60 mt-1">
                  Last {analytics?.context.range.days ?? 30} days
                </p>
              </div>
              <button
                className="subtle-button"
                onClick={() => handleAction("Open Analytics")}
              >
                Full view
              </button>
            </div>
            <div className="h-52 flex items-end gap-2 mt-6">
              {revenueBars.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="flex-1 bg-white/10 rounded-t transition-opacity"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs text-foreground/50">Payouts (30d)</p>
                <p className="font-semibold">{formatMoney(totals.payouts)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs text-foreground/50">Followers Delta (30d)</p>
                <p className="font-semibold">{totals.followersDelta.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <h3 className="text-lg font-semibold">Actions</h3>
            <p className="text-xs text-foreground/60 mt-1">Your next moves</p>
            <div className="space-y-3 mt-5">
              {[
                { icon: Compass, label: "Open Analytics" },
                { icon: Zap, label: "Create Campaign" },
                { icon: Share2, label: "Schedule Post" },
                { icon: Sparkles, label: "Generate Ad" },
                { icon: Calendar, label: "View Calendar" },
                { icon: Globe, label: "Generate Website" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => handleAction(action.label)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-foreground/80 hover:bg-white/10 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-neon-cyan/70" />
                    <span className="font-medium flex-1 text-left">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Connected Data Sources</h3>
              <p className="text-xs text-foreground/60 mt-1">
                Latest sync status from integrations
              </p>
            </div>
            <span className="text-xs text-foreground/50">
              {analytics?.connections.length ?? 0} connected
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-foreground/50 text-[10px] uppercase tracking-[0.2em] border-b border-white/10">
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, index) => (
                  <tr
                    key={`${row.title}-${index}`}
                    className={`text-foreground/80 ${
                      index % 2 === 1 ? "bg-white/[0.03]" : ""
                    } hover:bg-white/[0.04]`}
                  >
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 max-w-xs truncate">{row.title}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          row.status === "Healthy"
                            ? "bg-neon-cyan/10 text-neon-cyan"
                            : row.status === "Action Needed" ||
                                row.status === "Needs Attention"
                              ? "bg-yellow-400/10 text-yellow-300"
                              : "bg-white/10 text-foreground/60"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground/60">
                      {row.date.toLocaleDateString()}
                    </td>
                    <td className="py-3 text-foreground/60">{row.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Account Snapshot</h3>
              <p className="text-xs text-foreground/60 mt-1">
                Quick health check for your workspace.
              </p>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs text-foreground/50">Credits Available</p>
              <p className="font-semibold">
                {credits?.currentCredits?.toLocaleString() ?? "0"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs text-foreground/50">Analytics Range Start</p>
              <p className="font-semibold">
                {formatDate(analytics?.context.range.start ?? null)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs text-foreground/50">Analytics Range End</p>
              <p className="font-semibold">
                {formatDate(analytics?.context.range.end ?? null)}
              </p>
            </div>
          </div>
        </div>

        <FooterLinks />
      </div>
    </div>
  );
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
      const y = 40 - ((value - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className={className} width="64" height="28">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
