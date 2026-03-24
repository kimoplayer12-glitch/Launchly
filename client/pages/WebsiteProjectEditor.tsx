import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { toast } from "@/components/ui/use-toast";
import { getIdToken, readJson } from "@/lib/api-client";

const apiBase = import.meta.env.VITE_FUNCTIONS_BASE_URL || "";

type ProjectResponse = {
  projectId: string;
  revision: number;
  indexHtml: string;
  stylesCss: string;
  appJs: string;
  error?: string;
};

const TABS = [
  { id: "index.html", label: "index.html" },
  { id: "styles.css", label: "styles.css" },
  { id: "app.js", label: "app.js" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function WebsiteProjectEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<TabId>("index.html");
  const [indexHtml, setIndexHtml] = useState("");
  const [stylesCss, setStylesCss] = useState("");
  const [appJs, setAppJs] = useState("");
  const [revision, setRevision] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  const fetchProject = async () => {
    if (!projectId) return;
    try {
      setFetching(true);
      const token = await getIdToken();
      const response = await fetch(`${apiBase}/api/projects/${projectId}?rev=latest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await readJson(response)) as ProjectResponse;
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load project.");
      }
      setIndexHtml(data.indexHtml || "");
      setStylesCss(data.stylesCss || "");
      setAppJs(data.appJs || "");
      setRevision(data.revision);
      setPreviewKey(Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load project.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const previewSrc = useMemo(() => {
    if (!projectId) return "";
    return `/preview/${projectId}?rev=latest&v=${previewKey}`;
  }, [projectId, previewKey]);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const idToken = await getIdToken();
        setToken(idToken);
      } catch (error) {
        toast({
          title: "Preview unavailable",
          description: "Authentication is required to load the preview.",
          variant: "destructive",
        });
      }
    };

    loadToken();
  }, [projectId]);

  const sendTokenToPreview = () => {
    if (!projectId || !iframeRef.current || !token) return;
    iframeRef.current.contentWindow?.postMessage(
      {
        type: "launchly-preview-token",
        token,
        projectId,
      },
      "*"
    );
  };

  useEffect(() => {
    sendTokenToPreview();
  }, [token, previewSrc]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      const response = await fetch(`${apiBase}/api/projects/${projectId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          indexHtml,
          stylesCss,
          appJs,
        }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save.");
      }
      setRevision(data.revision);
      setPreviewKey(Date.now());
      toast({
        title: "Saved",
        description: `Revision ${data.revision} created.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const tabContent = {
    "index.html": indexHtml,
    "styles.css": stylesCss,
    "app.js": appJs,
  } as Record<TabId, string>;

  const updateTabContent = (value: string) => {
    if (activeTab === "index.html") setIndexHtml(value);
    if (activeTab === "styles.css") setStylesCss(value);
    if (activeTab === "app.js") setAppJs(value);
  };

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="page-header">
          <div className="eyebrow">Website Editor</div>
          <h1 className="page-title">Edit generated files</h1>
          <p className="page-subtitle">
            Project ID: {projectId} {revision ? `• Revision ${revision}` : ""}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <GlassCard variant="dark" className="border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border ${
                      activeTab === tab.id
                        ? "border-neon-cyan/60 bg-neon-cyan/10 text-foreground"
                        : "border-white/10 text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || fetching}
                className="btn-neon px-4 py-2 text-sm rounded-lg"
              >
                {saving ? "Saving..." : "Save Revision"}
              </button>
            </div>

            <textarea
              value={tabContent[activeTab]}
              onChange={(e) => updateTabContent(e.target.value)}
              className="input-glass w-full min-h-[520px] font-mono text-xs"
              spellCheck={false}
              disabled={fetching}
            />
          </GlassCard>

          <GlassCard variant="dark" className="border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold">Preview</div>
                <div className="text-xs text-foreground/50">Latest saved revision</div>
              </div>
              <button
                onClick={() => setPreviewKey(Date.now())}
                className="subtle-button"
              >
                Refresh
              </button>
            </div>
            <div className="h-[560px] border border-white/10 rounded-xl overflow-hidden bg-white">
              <iframe
                ref={iframeRef}
                key={previewKey}
                src={previewSrc}
                title="Website preview"
                className="w-full h-full"
                sandbox="allow-scripts allow-forms"
                onLoad={sendTokenToPreview}
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
