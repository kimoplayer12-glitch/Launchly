import type { RequestHandler } from "express";
import admin from "firebase-admin";
import type { DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { WorkflowGraph } from "@shared/workflow";
import { encryptJson } from "../utils/crypto";
import { runWorkflowExecution } from "../workflow/engine";
import { generateWebhookSecret } from "../workflow/scheduler";

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const DEFAULT_GRAPH: WorkflowGraph = {
  nodes: [
    {
      id: "trigger-manual",
      type: "TriggerManual",
      position: { x: 120, y: 120 },
      data: {
        label: "Manual Trigger",
        params: {},
      },
    },
  ],
  edges: [],
};

type WorkflowDoc = {
  userId: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  draftGraphJson?: WorkflowGraph;
  webhookSecret?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

async function ensureWorkflowOwnership(workflowId: string, userId: string) {
  const ref = db.collection("workflows").doc(workflowId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Workflow not found");
  }
  const data = snap.data() as WorkflowDoc;
  if (!data || data.userId !== userId) {
    throw new Error("Forbidden");
  }
  return { ref, data };
}

async function getLatestVersion(workflowRef: DocumentReference) {
  const snapshot = await workflowRef
    .collection("versions")
    .orderBy("versionNumber", "desc")
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

function toPlain(doc: QueryDocumentSnapshot) {
  return { id: doc.id, ...doc.data() };
}

export const handleListWorkflows: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const snapshot = await db
      .collection("workflows")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const workflows = snapshot.docs.map(toPlain);
    return res.json({ workflows });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load workflows" });
  }
};

export const handleCreateWorkflow: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const name = req.body?.name || "Untitled Workflow";
    const ref = db.collection("workflows").doc();
    await ref.set({
      userId,
      name,
      status: "DRAFT",
      draftGraphJson: DEFAULT_GRAPH,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.json({ workflow: { id: ref.id, name, status: "DRAFT" } });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create workflow" });
  }
};

export const handleGetWorkflow: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { workflowId } = req.params;

    const { ref, data } = await ensureWorkflowOwnership(workflowId, userId);
    const latestVersion = await getLatestVersion(ref);

    const webhookUrl = data.webhookSecret
      ? `${req.protocol}://${req.get("host")}/api/automations/${workflowId}/webhook/${data.webhookSecret}`
      : null;

    return res.json({
      workflow: { id: workflowId, ...data },
      latestVersion,
      webhookUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow not found";
    return res.status(message === "Forbidden" ? 403 : 404).json({ error: message });
  }
};

export const handleUpdateWorkflow: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { workflowId } = req.params;

    const { ref } = await ensureWorkflowOwnership(workflowId, userId);

    const update: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (req.body?.name) update.name = req.body.name;
    if (req.body?.draftGraphJson) update.draftGraphJson = req.body.draftGraphJson;

    await ref.update(update);
    const updated = await ref.get();
    return res.json({ workflow: { id: workflowId, ...updated.data() } });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update workflow" });
  }
};

export const handlePublishWorkflow: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { workflowId } = req.params;

    const { ref, data } = await ensureWorkflowOwnership(workflowId, userId);
    const graph = data.draftGraphJson;
    if (!graph) {
      return res.status(400).json({ error: "No draft graph to publish" });
    }

    const latest = await getLatestVersion(ref);
    const versionNumber = (latest?.versionNumber || 0) + 1;

    const versionRef = ref.collection("versions").doc();
    await versionRef.set({
      versionNumber,
      graphJson: graph,
      createdAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    });

    const hasWebhook = graph.nodes.some(
      (node) => node.type === "TriggerWebhook"
    );
    const webhookSecret = hasWebhook
      ? data.webhookSecret || generateWebhookSecret()
      : data.webhookSecret;

    await ref.update({
      status: "PUBLISHED",
      webhookSecret,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.json({ version: { id: versionRef.id, versionNumber } });
  } catch (error) {
    return res.status(500).json({ error: "Failed to publish workflow" });
  }
};

export const handleRunWorkflow: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { workflowId } = req.params;
    const mode = req.body?.mode || "published";
    const triggerPayload = req.body?.triggerPayload || {};

    const { ref, data } = await ensureWorkflowOwnership(workflowId, userId);

    let graph: WorkflowGraph | null = null;
    let versionMeta: any = null;
    if (mode === "draft") {
      graph = data.draftGraphJson ?? null;
    } else {
      const latest = await getLatestVersion(ref);
      graph = (latest?.graphJson as WorkflowGraph) ?? null;
      versionMeta = latest;
    }

    if (!graph) {
      return res.status(400).json({ error: "No workflow graph available" });
    }

    const executionRef = ref.collection("executions").doc();
    await executionRef.set({
      executionId: executionRef.id,
      workflowId,
      userId,
      status: "RUNNING",
      triggerType: "manual",
      triggerPayloadJson: triggerPayload,
      workflowVersionId: versionMeta?.id || null,
      versionNumber: versionMeta?.versionNumber || 0,
      startedAt: FieldValue.serverTimestamp(),
    });

    setImmediate(() => {
      runWorkflowExecution({
        workflowId,
        executionId: executionRef.id,
        graph,
        triggerType: "manual",
        triggerPayload,
      }).catch((error) => {
        console.error("Workflow execution failed:", error);
      });
    });

    return res.json({ execution: { id: executionRef.id } });
  } catch (error) {
    return res.status(500).json({ error: "Failed to run workflow" });
  }
};

export const handleListVersions: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { workflowId } = req.params;

    const { ref } = await ensureWorkflowOwnership(workflowId, userId);
    const snapshot = await ref
      .collection("versions")
      .orderBy("versionNumber", "desc")
      .get();

    const versions = snapshot.docs.map(toPlain);
    return res.json({ versions });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load versions" });
  }
};

export const handleListExecutions: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { workflowId } = req.params;

    const { ref } = await ensureWorkflowOwnership(workflowId, userId);
    const snapshot = await ref
      .collection("executions")
      .orderBy("startedAt", "desc")
      .get();

    const executions = snapshot.docs.map(toPlain);
    return res.json({ executions });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load executions" });
  }
};

export const handleGetExecution: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { executionId } = req.params;

    const execSnapshot = await db
      .collectionGroup("executions")
      .where("executionId", "==", executionId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (execSnapshot.empty) {
      return res.status(404).json({ error: "Execution not found" });
    }

    const execDoc = execSnapshot.docs[0];
    const stepsSnap = await execDoc.ref
      .collection("steps")
      .orderBy("startedAt", "asc")
      .get();

    return res.json({
      execution: {
        id: execDoc.id,
        ...execDoc.data(),
        steps: stepsSnap.docs.map(toPlain),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load execution" });
  }
};

export const handleReplayExecution: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { executionId } = req.params;

    const workflows = await db
      .collection("workflows")
      .where("userId", "==", userId)
      .get();

    for (const wf of workflows.docs) {
      const execRef = wf.ref.collection("executions").doc(executionId);
      const execSnap = await execRef.get();
      if (!execSnap.exists) continue;
      const execution = execSnap.data() || {};

      const graph =
        (execution.versionNumber && execution.versionNumber > 0
          ? (await getLatestVersion(wf.ref))?.graphJson
          : wf.data().draftGraphJson) || null;

      if (!graph) {
        return res.status(400).json({ error: "No workflow graph found" });
      }

      const newExecRef = wf.ref.collection("executions").doc();
      await newExecRef.set({
        executionId: newExecRef.id,
        workflowId: wf.id,
        userId,
        status: "RUNNING",
        triggerType: execution.triggerType || "manual",
        triggerPayloadJson: execution.triggerPayloadJson || {},
        workflowVersionId: execution.workflowVersionId || null,
        versionNumber: execution.versionNumber || 0,
        startedAt: FieldValue.serverTimestamp(),
      });

      setImmediate(() => {
        runWorkflowExecution({
          workflowId: wf.id,
          executionId: newExecRef.id,
          graph: graph as WorkflowGraph,
          triggerType: execution.triggerType || "manual",
          triggerPayload: execution.triggerPayloadJson || {},
        }).catch((error) => {
          console.error("Workflow replay failed:", error);
        });
      });

      return res.json({ execution: { id: newExecRef.id } });
    }

    return res.status(404).json({ error: "Execution not found" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to replay execution" });
  }
};

export const handleWebhookTrigger: RequestHandler = async (req, res) => {
  try {
    const { workflowId, secret } = req.params;
    const ref = db.collection("workflows").doc(workflowId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Webhook not found" });
    }
    const workflow = snap.data() as WorkflowDoc;
    if (!workflow || workflow.webhookSecret !== secret) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    const latest = await getLatestVersion(ref);
    const graph = (latest?.graphJson as WorkflowGraph) ?? null;
    if (!graph) {
      return res.status(400).json({ error: "No published workflow found" });
    }

    const executionRef = ref.collection("executions").doc();
    await executionRef.set({
      executionId: executionRef.id,
      workflowId,
      userId: workflow.userId,
      status: "RUNNING",
      triggerType: "webhook",
      triggerPayloadJson: req.body ?? {},
      workflowVersionId: latest?.id || null,
      versionNumber: latest?.versionNumber || 0,
      startedAt: FieldValue.serverTimestamp(),
    });

    setImmediate(() => {
      runWorkflowExecution({
        workflowId,
        executionId: executionRef.id,
        graph,
        triggerType: "webhook",
        triggerPayload: req.body ?? {},
      }).catch((error) => {
        console.error("Webhook execution failed:", error);
      });
    });

    return res.json({ received: true, executionId: executionRef.id });
  } catch (error) {
    return res.status(500).json({ error: "Webhook failed" });
  }
};

export const handleListCredentials: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const snapshot = await db
      .collection("credentials")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    const credentials = snapshot.docs.map(toPlain);
    return res.json({ credentials });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load credentials" });
  }
};

export const handleCreateCredential: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, type, values } = req.body ?? {};
    if (!name || !type || !values) {
      return res.status(400).json({ error: "Missing credential fields" });
    }

    const encryptedJson = encryptJson(values);
    const ref = db.collection("credentials").doc();
    await ref.set({
      userId,
      name,
      type,
      encryptedJson,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.json({ credential: { id: ref.id, name, type } });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create credential" });
  }
};
