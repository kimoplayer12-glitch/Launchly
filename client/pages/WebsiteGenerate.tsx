import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { toast } from "@/components/ui/use-toast";
import { getIdToken, readJson } from "@/lib/api-client";

const apiBase = import.meta.env.VITE_FUNCTIONS_BASE_URL || "";

export default function WebsiteGenerate() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Describe the website you want to generate.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getIdToken();
      const response = await fetch(`${apiBase}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate project.");
      }

      navigate(`/dashboard/projects/${data.projectId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="page-header">
          <div className="eyebrow">Website Generator</div>
          <h1 className="page-title">Generate a website</h1>
          <p className="page-subtitle">
            Describe the website you want. Launchly will generate HTML, CSS, and JS files you can refine.
          </p>
        </div>

        <GlassCard variant="dark" className="border-white/10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A premium SaaS landing page for an AI finance tool with a hero, features, pricing, and FAQ."
                className="input-glass w-full min-h-[180px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span>Output: index.html, styles.css, app.js</span>
              <span>Revisions are saved automatically after each save.</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={submitting}
              className="btn-neon w-full py-3 rounded-lg"
            >
              {submitting ? "Generating..." : "Generate Website"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
