import type { WorkflowGraph, WorkflowNode, WorkflowEdge } from "@shared/workflow";
import admin from "firebase-admin";
import { executeNode } from "./nodes";

type RunExecutionArgs = {
  workflowId: string;
  executionId: string;
  graph: WorkflowGraph;
  triggerType: string;
  triggerPayload: any;
};

function buildTopoOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const indegree = new Map<string, number>();
  nodes.forEach((node) => indegree.set(node.id, 0));
  edges.forEach((edge) => {
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const queue = nodes
    .filter((node) => (indegree.get(node.id) || 0) === 0)
    .map((node) => node.id);

  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    edges
      .filter((edge) => edge.source === id)
      .forEach((edge) => {
        const next = (indegree.get(edge.target) || 0) - 1;
        indegree.set(edge.target, next);
        if (next === 0) queue.push(edge.target);
      });
  }

  if (order.length !== nodes.length) {
    return nodes.map((node) => node.id);
  }

  return order;
}

function findTriggerNode(nodes: WorkflowNode[], triggerType: string) {
  const triggerMap: Record<string, string> = {
    manual: "TriggerManual",
    webhook: "TriggerWebhook",
    schedule: "TriggerSchedule",
  };
  const desired = triggerMap[triggerType] ?? "TriggerManual";
  return nodes.find((node) => node.type === desired) ?? nodes[0];
}

function collectParents(
  nodeId: string,
  edges: WorkflowEdge[],
  outputs: Record<string, any>
) {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => outputs[edge.source])
    .filter((output) => output !== undefined);
}

export async function runWorkflowExecution({
  workflowId,
  executionId,
  graph,
  triggerType,
  triggerPayload,
}: RunExecutionArgs) {
  const db = admin.firestore();
  const executionRef = db
    .collection("workflows")
    .doc(workflowId)
    .collection("executions")
    .doc(executionId);
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];

  if (nodes.length === 0) {
    await executionRef.update({
      status: "FAILED",
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new Error("Workflow graph has no nodes");
  }

  const triggerNode = findTriggerNode(nodes, triggerType);
  if (!triggerNode) {
    await executionRef.update({
      status: "FAILED",
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new Error("No trigger node found");
  }

  const order = buildTopoOrder(nodes, edges);
  const reachable = new Set<string>([triggerNode.id]);
  const outputs: Record<string, any> = {};

  for (const nodeId of order) {
    if (!reachable.has(nodeId)) continue;
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) continue;

    const parentOutputs = collectParents(nodeId, edges, outputs);
    const input = parentOutputs.length === 1 ? parentOutputs[0] : parentOutputs;

    const stepRef = executionRef.collection("steps").doc();
    await stepRef.set({
      nodeId,
      status: "RUNNING",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      inputJson: {
        input,
        params: node.data?.params ?? {},
      },
    });

    try {
      const { output, params } = await executeNode({
        node,
        context: {
          trigger: triggerPayload,
          nodeOutputs: outputs,
          env: process.env,
          input,
          inputs: parentOutputs,
        },
        input,
        inputs: parentOutputs,
      });

      outputs[nodeId] = output;

      await stepRef.update({
        status: "SUCCESS",
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        outputJson: output,
        inputJson: {
          input,
          params,
        },
      });

      const outgoing = edges.filter((edge) => edge.source === nodeId);
      if (node.type === "LogicIfElse") {
        const branch = output?.result ? "true" : "false";
        outgoing
          .filter((edge) => (edge.sourceHandle || "true") === branch)
          .forEach((edge) => reachable.add(edge.target));
      } else {
        outgoing.forEach((edge) => reachable.add(edge.target));
      }
    } catch (error) {
      await stepRef.update({
        status: "FAILED",
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        errorJson: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });

      await executionRef.update({
        status: "FAILED",
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  }

  await executionRef.update({
    status: "SUCCESS",
    finishedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return outputs;
}
