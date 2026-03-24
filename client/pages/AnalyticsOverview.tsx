import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from "recharts";
import { authFetch, readJson } from "@/lib/api-client";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Button } from "@/components/ui/button";

type DailyMetric = {
  date: string;
  revenue?: { total: number };
  payouts?: { total: number };
  sales?: { orders: number };
  socials?: { byProvider: Record<string, { followers?: number; views?: number }> };
};

type Connection = {
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSyncAt?: string | null;
  lastSyncStatus?: "ok" | "error" | null;
};

type OverviewResponse = {
  context: {
    totals: {
      revenue: number;
      payouts: number;
      orders: number;
      followersDelta: number;
      views: number;
      engagementRate: number;
    };
    range: { start: string; end: string };
  };
  daily: DailyMetric[];
  connections: Connection[];
};

function isOverviewResponse(payload: any): payload is OverviewResponse {
  return (
    !!payload?.context?.totals &&
    !!payload?.context?.range &&
    Array.isArray(payload?.daily) &&
    Array.isArray(payload?.connections)
  );
}

type Brief = {
  summaryMarkdown?: string;
  highlights?: string[];
  anomalies?: string[];
  recommendations?: string[];
  risks?: string[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function AnalyticsOverview() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiBrief, setAiBrief] = useState<Brief | null>(null);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiCitations, setAiCitations] = useState<string[]>([]);
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!loading && isAuthenticated) {
      loadOverview();
    }
  }, [loading, isAuthenticated, navigate]);

  const loadOverview = async () => {
    try {
      const response = await authFetch("/api/analytics/overview?range=30d");
      const json = await readJson<OverviewResponse>(response);
      if (!response.ok) {
        throw new Error((json as any)?.error || "Failed to load analytics");
      }
      if (!isOverviewResponse(json)) {
        throw new Error("Invalid analytics response");
      }
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    }
  };

  const revenueSeries = useMemo(
    () =>
      (data?.daily || []).map((item) => ({
        date: formatDate(item.date),
        value: item.revenue?.total || 0,
      })),
    [data]
  );

  const payoutsSeries = useMemo(
    () =>
      (data?.daily || []).map((item) => ({
        date: formatDate(item.date),
        value: item.payouts?.total || 0,
      })),
    [data]
  );

  const ordersSeries = useMemo(
    () =>
      (data?.daily || []).map((item) => ({
        date: formatDate(item.date),
        value: item.sales?.orders || 0,
      })),
    [data]
  );

  const socialSeries = useMemo(
    () =>
      (data?.daily || []).map((item) => ({
        date: formatDate(item.date),
        value: item.socials?.byProvider?.[platform]?.views || 0,
      })),
    [data, platform]
  );

  const handleGenerateBrief = async () => {
    setBusy(true);
    try {
      const response = await authFetch("/api/ai/brief", {
        method: "POST",
        body: JSON.stringify({ days: 7 }),
      });
      const json = await readJson<{ brief: Brief; error?: string }>(response);
      if (!response.ok) {
        throw new Error(json.error || "Failed to generate brief");
      }
      setAiBrief(json.brief);
    } catch (error) {
      setAiBrief({
        summaryMarkdown:
          error instanceof Error ? error.message : "AI brief unavailable.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setBusy(true);
    try {
      const response = await authFetch("/api/ai/ask", {
        method: "POST",
        body: JSON.stringify({ question, days: 30 }),
      });
      const json = await readJson<{ response?: { answer?: string; citations?: string[] }; error?: string }>(
        response
      );
      if (!response.ok) {
        throw new Error(json.error || "Failed to get answer");
      }
      setAiAnswer(json.response?.answer || "No answer yet.");
      setAiCitations(json.response?.citations || []);
    } catch (error) {
      setAiAnswer(error instanceof Error ? error.message : "AI unavailable.");
      setAiCitations([]);
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) {
    return (
      <div className="page-shell">
        <div className="clean-card">Loading analytics...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-shell">
        <div className="clean-card text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h1 className="page-title">Analytics Overview</h1>
        <p className="page-subtitle">Track revenue, growth, and engagement across platforms.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs text-foreground/60">Total Revenue (30d)</p>
          <p className="text-2xl font-semibold">${data.context.totals.revenue.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-foreground/60">Payouts (30d)</p>
          <p className="text-2xl font-semibold">${data.context.totals.payouts.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-foreground/60">Orders (30d)</p>
          <p className="text-2xl font-semibold">{data.context.totals.orders}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-foreground/60">Followers change (30d)</p>
          <p className="text-2xl font-semibold">{data.context.totals.followersDelta}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-foreground/60">Views (30d)</p>
          <p className="text-2xl font-semibold">{data.context.totals.views}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-foreground/60">Engagement rate (30d)</p>
          <p className="text-2xl font-semibold">{(data.context.totals.engagementRate * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-8">
        <div className="clean-card lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Revenue</h2>
              <p className="text-sm text-foreground/60">Last 30 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#7C5CFF" fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clean-card space-y-3">
          <h2 className="text-lg font-semibold">Payouts</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payoutsSeries}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#A855F7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clean-card lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">Orders</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersSeries}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6EE7B7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clean-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Social Views</h2>
            <div className="flex gap-2">
              <button
                className={`subtle-button ${platform === "instagram" ? "bg-white/10" : ""}`}
                onClick={() => setPlatform("instagram")}
              >
                Instagram
              </button>
              <button
                className={`subtle-button ${platform === "tiktok" ? "bg-white/10" : ""}`}
                onClick={() => setPlatform("tiktok")}
              >
                TikTok
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={socialSeries}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="clean-card mt-8">
        <h2 className="text-lg font-semibold mb-3">Connected Accounts</h2>
        <div className="space-y-2">
          {data.connections.length === 0 ? (
            <div className="text-sm text-foreground/60">No connections yet.</div>
          ) : (
            data.connections.map((connection) => (
              <div
                key={connection.provider}
                className="flex items-center justify-between border border-white/10 rounded-lg px-4 py-2"
              >
                <div>
                  <div className="text-sm font-medium capitalize">{connection.provider}</div>
                  <div className="text-xs text-foreground/60">
                    Last sync: {connection.lastSyncAt ? formatDate(connection.lastSyncAt) : "—"}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    connection.status === "connected" && connection.lastSyncStatus !== "error"
                      ? "border-emerald-500/40 text-emerald-300"
                      : "border-red-500/40 text-red-300"
                  }`}
                >
                  {connection.lastSyncStatus === "error" || connection.status === "error"
                    ? "Needs reconnect"
                    : "OK"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-8">
        <div className="clean-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Weekly AI Brief</h2>
            <Button onClick={handleGenerateBrief} disabled={busy}>
              {busy ? "Generating..." : "Generate Brief"}
            </Button>
          </div>
          {aiBrief ? (
            <div className="space-y-3 text-sm text-foreground/80">
              <p>{aiBrief.summaryMarkdown}</p>
              {aiBrief.highlights && aiBrief.highlights.length > 0 && (
                <div>
                  <p className="text-xs uppercase text-foreground/50">Highlights</p>
                  <ul className="list-disc list-inside">
                    {aiBrief.highlights.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground/60">Generate a weekly brief from your metrics.</p>
          )}
        </div>

        <div className="clean-card space-y-3">
          <h2 className="text-lg font-semibold">Ask AI about my metrics</h2>
          <div className="space-y-2">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about revenue, payouts, or engagement..."
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
              rows={4}
            />
            <Button onClick={handleAsk} disabled={busy}>
              {busy ? "Thinking..." : "Ask AI"}
            </Button>
            {aiAnswer && (
              <div className="space-y-2">
                <p className="text-sm text-foreground/80">{aiAnswer}</p>
                {aiCitations.length > 0 && (
                  <p className="text-xs text-foreground/60">
                    Sources: {aiCitations.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
