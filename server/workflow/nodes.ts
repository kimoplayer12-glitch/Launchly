import { aiExtractStructured, aiGenerateText } from "../services/ai";
import { resolveTemplates } from "./templating";
import type { WorkflowNode } from "@shared/workflow";
import dns from "dns/promises";

type NodeContext = {
  trigger: any;
  nodeOutputs: Record<string, any>;
  env: Record<string, string | undefined>;
  input?: any;
  inputs?: any[];
};

type ExecuteNodeArgs = {
  node: WorkflowNode;
  context: NodeContext;
  input: any;
  inputs: any[];
};

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

function isPrivateIp(ip: string) {
  if (PRIVATE_IP_RANGES.some((range) => range.test(ip))) return true;
  if (ip === "::1") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // fc00::/7
  if (ip.startsWith("fe80")) return true; // link-local
  return false;
}

async function assertPublicUrl(url: string) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs are allowed");
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) {
    throw new Error("Localhost URLs are not allowed");
  }

  const lookup = await dns.lookup(host);
  if (isPrivateIp(lookup.address)) {
    throw new Error("Private network URLs are not allowed");
  }
}

function evaluateCondition(left: any, operator: string, right: any) {
  switch (operator) {
    case "equals":
      return left === right;
    case "not_equals":
      return left !== right;
    case "contains":
      return String(left ?? "").includes(String(right ?? ""));
    case "not_contains":
      return !String(left ?? "").includes(String(right ?? ""));
    case "greater_than":
      return Number(left) > Number(right);
    case "less_than":
      return Number(left) < Number(right);
    case "is_true":
      return Boolean(left) === true;
    case "is_false":
      return Boolean(left) === false;
    default:
      return false;
  }
}

function normalizeHeaders(headers: Record<string, any>) {
  return Object.entries(headers || {}).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      acc[key] = String(value);
      return acc;
    },
    {}
  );
}

async function executeHttpRequest(params: Record<string, any>) {
  const url = params.url as string;
  if (!url) throw new Error("HTTP Request requires a URL");
  await assertPublicUrl(url);

  const method = (params.method || "GET").toUpperCase();
  const headers = normalizeHeaders(params.headers || {});
  const timeoutMs = Number(params.timeoutMs ?? 15000);
  const retries = Number(params.retries ?? 2);
  let body = params.body;
  if (body && typeof body === "object") {
    body = JSON.stringify(body);
    if (!headers["content-type"]) {
      headers["content-type"] = "application/json";
    }
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: ["GET", "HEAD"].includes(method) ? undefined : body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await response.text();
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch {
        // keep as text
      }
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) {
        throw error;
      }
      const backoff = Math.min(1000 * 2 ** attempt, 5000);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}

export async function executeNode({
  node,
  context,
  input,
  inputs,
}: ExecuteNodeArgs) {
  const params = resolveTemplates(node.data?.params ?? {}, {
    trigger: context.trigger,
    nodeOutputs: context.nodeOutputs,
    env: context.env,
    input,
    inputs,
  });

  switch (node.type) {
    case "TriggerManual":
    case "TriggerWebhook":
    case "TriggerSchedule":
      return {
        output: context.trigger ?? {},
        params,
      };
    case "CoreHttpRequest": {
      const response = await executeHttpRequest(params);
      return {
        output: response,
        params,
      };
    }
    case "LogicIfElse": {
      const left = params.left;
      const right = params.right;
      const operator = params.operator || "equals";
      const result = evaluateCondition(left, operator, right);
      return {
        output: { result },
        params,
      };
    }
    case "CoreSetFields": {
      const fields = Array.isArray(params.fields) ? params.fields : [];
      const output = fields.reduce<Record<string, any>>((acc, field) => {
        if (!field?.key) return acc;
        acc[field.key] = field.value;
        return acc;
      }, {});
      return {
        output,
        params,
      };
    }
    case "CoreDelay": {
      const delayMs = Number(params.delayMs ?? 0);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return {
        output: input ?? {},
        params,
      };
    }
    case "CoreMerge": {
      const strategy = params.strategy || "object";
      if (strategy === "array") {
        return {
          output: inputs,
          params,
        };
      }
      const merged = inputs.reduce<Record<string, any>>((acc, item) => {
        if (item && typeof item === "object") {
          return { ...acc, ...item };
        }
        return acc;
      }, {});
      return {
        output: merged,
        params,
      };
    }
    case "AiExtract": {
      const result = await aiExtractStructured({
        input: params.input ?? JSON.stringify(input ?? {}),
        schema: params.schema ?? {},
      });
      return {
        output: result,
        params,
      };
    }
    case "AiGenerate": {
      const text = await aiGenerateText({
        prompt: params.prompt ?? "",
      });
      return {
        output: { text },
        params,
      };
    }
    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}
