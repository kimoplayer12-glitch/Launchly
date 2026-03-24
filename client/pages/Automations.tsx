import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, readJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

type Workflow = {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  createdAt: string;
};

export default function Automations() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await authFetch("/api/automations");
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to load workflows");
      }
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreate = async () => {
    try {
      const response = await authFetch("/api/automations", {
        method: "POST",
        body: JSON.stringify({ name: "New Workflow" }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to create workflow");
      }
      navigate(`/dashboard/automations/${data.workflow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workflow");
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Automations</p>
          <h1>Workflow Builder</h1>
          <p className="text-muted-foreground mt-2">
            Build, test, and publish automations with a visual canvas.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-4">
        {loading && (
          <div className="clean-card p-6 text-foreground/70">Loading workflows…</div>
        )}
        {error && (
          <div className="clean-card p-6 text-red-400">{error}</div>
        )}
        {!loading && !error && workflows.length === 0 && (
          <div className="clean-card p-6 text-foreground/70">
            No workflows yet. Create your first automation.
          </div>
        )}
        {!loading &&
          !error &&
          workflows.map((workflow) => (
            <button
              key={workflow.id}
              onClick={() => navigate(`/dashboard/automations/${workflow.id}`)}
              className="clean-card p-5 text-left transition hover:border-white/20 hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-foreground/60 mt-1">
                    Status: {workflow.status}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/60" />
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
