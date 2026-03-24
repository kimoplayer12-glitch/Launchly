import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { authFetch, readJson } from "@/lib/api-client";
import {
  WORKFLOW_NODE_LIBRARY,
  IF_ELSE_OPERATORS,
  type WorkflowGraph,
} from "@shared/workflow";
import { ChevronDown, Play, Save, Send, Zap } from "lucide-react";

type WorkflowRecord = {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  draftGraphJson?: WorkflowGraph;
};

type WorkflowVersion = {
  id: string;
  versionNumber: number;
  publishedAt?: string | null;
};

const nodeLibrary = WORKFLOW_NODE_LIBRARY;

function createNodeId() {
  return `node_${Math.random().toString(36).slice(2, 9)}`;
}

const WorkflowNodeCard = ({ data }: { data: any }) => {
  const isTrigger = data.nodeType?.startsWith("Trigger");
  const isIfElse = data.nodeType === "LogicIfElse";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground/80 shadow-sm relative">
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-white/60 border border-white/40"
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-2 h-2 bg-white/60 border border-white/40"
      />
      {isIfElse && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-2 h-2 bg-white/60 border border-white/40"
        />
      )}
      <div className="text-[10px] uppercase text-foreground/50">
        {data.nodeType}
      </div>
      <div className="font-semibold text-sm text-foreground">
        {data.label || data.nodeType}
      </div>
      {!isTrigger && <div className="text-[10px] mt-1 text-foreground/40">Input</div>}
      {isIfElse && <div className="text-[10px] mt-1 text-foreground/40">True / False</div>}
    </div>
  );
};

export default function AutomationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workflowId = id || "";

  const [workflow, setWorkflow] = useState<WorkflowRecord | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const clipboardRef = useRef<Node[]>([]);

  const nodeTypes = useMemo(
    () => ({
      workflowNode: WorkflowNodeCard,
    }),
    []
  );

  const pushHistory = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    if (isRestoringRef.current) return;
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push({ nodes: nextNodes, edges: nextEdges });
    historyRef.current = history.slice(-50);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    isRestoringRef.current = true;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    isRestoringRef.current = false;
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    isRestoringRef.current = true;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    isRestoringRef.current = false;
  }, []);

  const loadWorkflow = useCallback(async () => {
    if (!workflowId) return;
    try {
      setLoading(true);
      const response = await authFetch(`/api/automations/${workflowId}`);
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to load workflow");

      const graph =
        data.workflow?.draftGraphJson ||
        data.latestVersion?.graphJson || { nodes: [], edges: [] };

      const nextNodes = (graph.nodes || []).map((node: any) => ({
        id: node.id,
        type: "workflowNode",
        position: node.position,
        data: {
          ...node.data,
          nodeType: node.type,
          label: node.data?.label || node.type,
        },
      }));

      const nextEdges = (graph.edges || []).map((edge: any) => ({
        ...edge,
        type: "smoothstep",
      }));

      setWorkflow(data.workflow);
      setWebhookUrl(data.webhookUrl);
      setNodes(nextNodes);
      setEdges(nextEdges);
      pushHistory(nextNodes, nextEdges);

      const versionResponse = await authFetch(
        `/api/automations/${workflowId}/versions`
      );
      const versionData = await readJson(versionResponse);
      if (versionResponse.ok) {
        setVersions(versionData.versions || []);
      }
    } catch (error) {
      toast({
        title: "Failed to load workflow",
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [workflowId, pushHistory]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        pushHistory(next, edges);
        return next;
      });
    },
    [edges, pushHistory]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        pushHistory(nodes, next);
        return next;
      });
    },
    [nodes, pushHistory]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          { ...connection, type: "smoothstep" },
          eds
        );
        pushHistory(nodes, next);
        return next;
      });
    },
    [nodes, pushHistory]
  );

  const onSelectionChange = useCallback((selection: any) => {
    const node = selection?.nodes?.[0];
    setSelectedNodes(selection?.nodes || []);
    setSelectedEdges(selection?.edges || []);
    setSelectedNodeId(node?.id ?? null);
  }, []);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedDefinition = nodeLibrary.find(
    (node) => node.type === selectedNode?.data?.nodeType
  );

  const filteredNodes = nodeLibrary.filter((node) =>
    node.label.toLowerCase().includes(search.toLowerCase())
  );

  const addNode = (type: string) => {
    const definition = nodeLibrary.find((node) => node.type === type);
    if (!definition) return;
    const newNode: Node = {
      id: createNodeId(),
      type: "workflowNode",
      position: { x: 250 + Math.random() * 120, y: 120 + Math.random() * 120 },
      data: {
        nodeType: definition.type,
        label: definition.label,
        params: definition.defaultParams || {},
      },
    };
    setNodes((nds) => {
      const next = [...nds, newNode];
      pushHistory(next, edges);
      return next;
    });
  };

  const serializeGraph = (): WorkflowGraph => {
    return {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data?.nodeType,
        position: node.position,
        data: {
          label: node.data?.label,
          params: node.data?.params || {},
          credentialId: node.data?.credentialId,
        },
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };
  };

  const handleSaveDraft = async () => {
    try {
      const response = await authFetch(`/api/automations/${workflowId}`, {
        method: "PATCH",
        body: JSON.stringify({
          draftGraphJson: serializeGraph(),
          name: workflow?.name,
        }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to save");
      toast({ title: "Draft saved" });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handlePublish = async () => {
    try {
      await handleSaveDraft();
      const response = await authFetch(
        `/api/automations/${workflowId}/publish`,
        { method: "POST" }
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Publish failed");
      toast({ title: "Workflow published" });
      loadWorkflow();
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleRun = async () => {
    try {
      const response = await authFetch(`/api/automations/${workflowId}/run`, {
        method: "POST",
        body: JSON.stringify({ mode: "draft", triggerPayload: {} }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Run failed");
      toast({ title: "Test run started" });
    } catch (error) {
      toast({
        title: "Run failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleRename = (value: string) => {
    if (!workflow) return;
    setWorkflow({ ...workflow, name: value });
  };

  const updateNodeParams = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((prev) => {
      const next = prev.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                params: {
                  ...node.data.params,
                  [key]: value,
                },
              },
            }
          : node
      );
      pushHistory(next, edges);
      return next;
    });
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        undo();
      }
      if (event.ctrlKey && (event.key === "y" || event.key === "Z")) {
        event.preventDefault();
        redo();
      }
      if (event.ctrlKey && event.key.toLowerCase() === "c") {
        if (selectedNodes.length) {
          clipboardRef.current = selectedNodes.map((node) => ({
            ...node,
            data: { ...node.data },
          }));
        }
      }
      if (event.ctrlKey && event.key.toLowerCase() === "v") {
        if (clipboardRef.current.length) {
          const offset = 40;
          const cloned = clipboardRef.current.map((node) => ({
            ...node,
            id: createNodeId(),
            position: {
              x: node.position.x + offset,
              y: node.position.y + offset,
            },
          }));
          setNodes((prev) => {
            const next = [...prev, ...cloned];
            pushHistory(next, edges);
            return next;
          });
        }
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNodeId) {
          setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
          setEdges((prev) =>
            prev.filter(
              (edge) =>
                edge.source !== selectedNodeId && edge.target !== selectedNodeId
            )
          );
        } else if (selectedEdges.length) {
          const ids = new Set(selectedEdges.map((edge) => edge.id));
          setEdges((prev) => prev.filter((edge) => !ids.has(edge.id)));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNodeId, selectedNodes, selectedEdges, undo, redo, edges, pushHistory]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="clean-card p-6">Loading workflow…</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Workflow Builder</p>
            <div className="mt-3 flex items-center gap-3">
              <Input
                value={workflow?.name || ""}
                onChange={(event) => handleRename(event.target.value)}
                className="max-w-sm"
              />
              <span className="text-xs text-foreground/50">
                {workflow?.status}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleSaveDraft}>
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button variant="secondary" onClick={handleRun}>
              <Play className="w-4 h-4" />
              Run Test
            </Button>
            <Button onClick={handlePublish}>
              <Send className="w-4 h-4" />
              Publish
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/automations/${workflowId}/logs`)}
            >
              Logs
            </Button>
            <div className="relative">
              <select className="input-glass pr-8 text-sm">
                <option>Versions</option>
                {versions.map((version) => (
                  <option key={version.id}>
                    v{version.versionNumber}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr_320px] gap-4">
          <div className="clean-card p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Node Library</p>
              <Input
                placeholder="Search nodes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-3"
              />
            </div>
            <div className="space-y-3">
              {["Triggers", "Logic", "Core", "AI", "Apps"].map((category) => (
                <div key={category}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-2">
                    {category}
                  </p>
                  <div className="space-y-2">
                    {filteredNodes
                      .filter((node) => node.category === category)
                      .map((node) => (
                        <button
                          key={node.type}
                          onClick={() => addNode(node.type)}
                          className="w-full text-left rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground/80 hover:border-white/20 hover:bg-white/10"
                        >
                          {node.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="clean-card p-2 h-[70vh]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[16, 16]}
            >
              <Background gap={16} size={1} color="#222" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          <div className="clean-card p-4 space-y-4">
            {selectedNode ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/40">
                    Node Inspector
                  </p>
                  <h3 className="text-lg font-semibold text-foreground mt-2">
                    {selectedDefinition?.label || selectedNode.data?.label}
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    {selectedDefinition?.description}
                  </p>
                {selectedDefinition && (
                  <div className="text-xs text-foreground/60 mt-3 space-y-1">
                      <p>
                        Inputs:{" "}
                        <span className="text-foreground/80">
                          {selectedDefinition.inputs.join(", ") || "None"}
                        </span>
                      </p>
                      <p>
                        Outputs:{" "}
                        <span className="text-foreground/80">
                          {selectedDefinition.outputs.join(", ") || "None"}
                        </span>
                      </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/60">Label</label>
                <Input
                  value={selectedNode.data?.label || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNodes((prev) => {
                      const next = prev.map((node) =>
                        node.id === selectedNode.id
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                label: value,
                              },
                            }
                          : node
                      );
                      pushHistory(next, edges);
                      return next;
                    });
                  }}
                />
              </div>

                {selectedDefinition?.type === "TriggerSchedule" && (
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Cron</label>
                    <Input
                      value={selectedNode.data?.params?.cron || ""}
                      onChange={(event) =>
                        updateNodeParams("cron", event.target.value)
                      }
                    />
                  </div>
                )}

                {selectedDefinition?.type === "CoreHttpRequest" && (
                  <div className="space-y-3">
                    <label className="text-xs text-foreground/60">Method</label>
                    <Input
                      value={selectedNode.data?.params?.method || ""}
                      onChange={(event) =>
                        updateNodeParams("method", event.target.value)
                      }
                    />
                    <label className="text-xs text-foreground/60">URL</label>
                    <Input
                      value={selectedNode.data?.params?.url || ""}
                      onChange={(event) =>
                        updateNodeParams("url", event.target.value)
                      }
                    />
                    <label className="text-xs text-foreground/60">Headers (JSON)</label>
                    <Textarea
                      value={JSON.stringify(
                        selectedNode.data?.params?.headers || {},
                        null,
                        2
                      )}
                      onChange={(event) => {
                        try {
                          updateNodeParams("headers", JSON.parse(event.target.value));
                        } catch {
                          // keep last valid JSON
                        }
                      }}
                    />
                    <label className="text-xs text-foreground/60">Body</label>
                    <Textarea
                      value={selectedNode.data?.params?.body || ""}
                      onChange={(event) =>
                        updateNodeParams("body", event.target.value)
                      }
                    />
                  </div>
                )}

                {selectedDefinition?.type === "LogicIfElse" && (
                  <div className="space-y-3">
                    <label className="text-xs text-foreground/60">Left</label>
                    <Input
                      value={selectedNode.data?.params?.left || ""}
                      onChange={(event) =>
                        updateNodeParams("left", event.target.value)
                      }
                    />
                    <label className="text-xs text-foreground/60">Operator</label>
                    <select
                      className="input-glass"
                      value={selectedNode.data?.params?.operator || "equals"}
                      onChange={(event) =>
                        updateNodeParams("operator", event.target.value)
                      }
                    >
                      {IF_ELSE_OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                    <label className="text-xs text-foreground/60">Right</label>
                    <Input
                      value={selectedNode.data?.params?.right || ""}
                      onChange={(event) =>
                        updateNodeParams("right", event.target.value)
                      }
                    />
                  </div>
                )}

                {selectedDefinition?.type === "CoreSetFields" && (
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">
                      Fields (JSON Array)
                    </label>
                    <Textarea
                      value={JSON.stringify(
                        selectedNode.data?.params?.fields || [],
                        null,
                        2
                      )}
                      onChange={(event) => {
                        try {
                          updateNodeParams(
                            "fields",
                            JSON.parse(event.target.value)
                          );
                        } catch {
                          // keep last valid JSON
                        }
                      }}
                    />
                  </div>
                )}

                {selectedDefinition?.type === "CoreDelay" && (
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Delay (ms)</label>
                    <Input
                      value={selectedNode.data?.params?.delayMs || ""}
                      onChange={(event) =>
                        updateNodeParams("delayMs", event.target.value)
                      }
                    />
                  </div>
                )}

                {selectedDefinition?.type === "CoreMerge" && (
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Strategy</label>
                    <select
                      className="input-glass"
                      value={selectedNode.data?.params?.strategy || "object"}
                      onChange={(event) =>
                        updateNodeParams("strategy", event.target.value)
                      }
                    >
                      <option value="object">object</option>
                      <option value="array">array</option>
                    </select>
                  </div>
                )}

                {selectedDefinition?.type === "AiExtract" && (
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Input</label>
                    <Textarea
                      value={selectedNode.data?.params?.input || ""}
                      onChange={(event) =>
                        updateNodeParams("input", event.target.value)
                      }
                    />
                    <label className="text-xs text-foreground/60">Schema (JSON)</label>
                    <Textarea
                      value={selectedNode.data?.params?.schema || ""}
                      onChange={(event) =>
                        updateNodeParams("schema", event.target.value)
                      }
                    />
                  </div>
                )}

                {selectedDefinition?.type === "AiGenerate" && (
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Prompt</label>
                    <Textarea
                      value={selectedNode.data?.params?.prompt || ""}
                      onChange={(event) =>
                        updateNodeParams("prompt", event.target.value)
                      }
                    />
                  </div>
                )}

                <div className="pt-2">
                  <Button variant="secondary" onClick={handleRun} className="w-full">
                    <Zap className="w-4 h-4" />
                    Test Node (Run Draft)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-foreground/60">
                Select a node to edit settings.
              </div>
            )}

            {webhookUrl && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/40">
                  Webhook URL
                </p>
                <p className="text-xs text-foreground/70 break-all mt-2">
                  {webhookUrl}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
