import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { readJson } from "@/lib/api-client";

type PreviewData = {
  indexHtml: string;
  stylesCss: string;
  appJs: string;
};

const apiBase = import.meta.env.VITE_FUNCTIONS_BASE_URL || "";

function stripScripts(html: string) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function extractBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

export default function WebsitePreview() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(
    searchParams.get("token")
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rev = searchParams.get("rev") || "latest";

  const fetchPreview = async (authToken: string) => {
    if (!projectId) return;
    try {
      const response = await fetch(`${apiBase}/api/projects/${projectId}?rev=${rev}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load preview.");
      }
      setData({
        indexHtml: payload.indexHtml,
        stylesCss: payload.stylesCss,
        appJs: payload.appJs,
      });
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load preview.";
      setError(message);
    }
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const incoming = event.data;
      if (!incoming || incoming.type !== "launchly-preview-token") return;
      if (incoming.projectId && projectId && incoming.projectId !== projectId) return;
      if (incoming.token) {
        setToken(incoming.token);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [projectId]);

  useEffect(() => {
    if (token) {
      fetchPreview(token);
    }
  }, [token, projectId, rev]);

  const sanitizedHtml = useMemo(() => {
    if (!data?.indexHtml) return "";
    return stripScripts(extractBody(data.indexHtml));
  }, [data?.indexHtml]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const existing = container.querySelector("script[data-launchly]");
    if (existing) {
      existing.remove();
    }
    if (!data?.appJs) return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.dataset.launchly = "app";
    script.textContent = data.appJs;
    container.appendChild(script);
  }, [data?.appJs, sanitizedHtml]);

  return (
    <div className="min-h-screen bg-white text-black">
      {error && (
        <div className="p-4 text-sm text-red-600">{error}</div>
      )}
      {!data && !error && (
        <div className="p-4 text-sm text-gray-600">Loading preview...</div>
      )}
      {data && (
        <>
          <style>{data.stylesCss}</style>
          <div ref={containerRef} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </>
      )}
    </div>
  );
}
