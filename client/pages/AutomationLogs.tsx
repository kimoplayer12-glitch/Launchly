import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authFetch, readJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, RefreshCcw } from "lucide-react";

type Execution = {
  id: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: string;
  finishedAt?: string;
  triggerType: string;
};

type ExecutionStep = {
  id: string;
  nodeId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  inputJson?: any;
  outputJson?: any;
  errorJson?: any;
};

export default function AutomationLogs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workflowId = id || "";

  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const response = await authFetch(
        `/api/automations/${workflowId}/executions`
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to load logs");
      setExecutions(data.executions || []);
    } catch (error) {
      toast({
        title: "Failed to load logs",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionDetail = async (executionId: string) => {
    try {
      const response = await authFetch(`/api/executions/${executionId}`);
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to load details");
      setSelectedExecution(data.execution);
      setSteps(data.execution.steps || []);
    } catch (error) {
      toast({
        title: "Failed to load execution",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const replayExecution = async (executionId: string) => {
    try {
      const response = await authFetch(`/api/executions/${executionId}/replay`, {
        method: "POST",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Replay failed");
      toast({ title: "Replay started" });
      loadExecutions();
    } catch (error) {
      toast({
        title: "Replay failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [workflowId]);

  return (
    <div className="page-shell">
      <div className="page-header flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Execution Logs</p>
            <h1>Workflow Runs</h1>
            <p className="text-foreground/60 mt-2">
              Inspect each run and replay payloads.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/dashboard/automations/${workflowId}`)}>
              <ArrowLeft className="w-4 h-4" />
              Back to Builder
            </Button>
            <Button variant="secondary" onClick={loadExecutions}>
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="clean-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Executions</p>
          {loading && <p className="text-foreground/60">Loading...</p>}
          {!loading && executions.length === 0 && (
            <p className="text-foreground/60">No executions yet.</p>
          )}
          {!loading &&
            executions.map((execution) => (
              <button
                key={execution.id}
                onClick={() => loadExecutionDetail(execution.id)}
                className="w-full text-left rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {execution.triggerType}
                  </span>
                  <span className="text-xs text-foreground/50">
                    {execution.status}
                  </span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">
                  {new Date(execution.startedAt).toLocaleString()}
                </p>
              </button>
            ))}
        </div>

        <div className="clean-card p-4">
          {selectedExecution ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Execution {selectedExecution.id.slice(0, 6)}
                  </h3>
                  <p className="text-sm text-foreground/60">
                    Status: {selectedExecution.status}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => replayExecution(selectedExecution.id)}
                >
                  Replay
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {step.nodeId}
                      </p>
                      <span className="text-xs text-foreground/60">
                        {step.status}
                      </span>
                    </div>
                    <div className="text-xs text-foreground/60 mt-2">
                      Input:
                    </div>
                    <pre className="text-xs text-foreground/70 whitespace-pre-wrap">
                      {JSON.stringify(step.inputJson, null, 2)}
                    </pre>
                    <div className="text-xs text-foreground/60 mt-2">
                      Output:
                    </div>
                    <pre className="text-xs text-foreground/70 whitespace-pre-wrap">
                      {JSON.stringify(step.outputJson, null, 2)}
                    </pre>
                    {step.errorJson && (
                      <>
                        <div className="text-xs text-red-400 mt-2">Error:</div>
                        <pre className="text-xs text-red-300 whitespace-pre-wrap">
                          {JSON.stringify(step.errorJson, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-foreground/60">
              Select an execution to view details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
