export type WorkflowStatus = "DRAFT" | "PUBLISHED";
export type ExecutionStatus = "RUNNING" | "SUCCESS" | "FAILED";

export type WorkflowNodeType =
  | "TriggerManual"
  | "TriggerWebhook"
  | "TriggerSchedule"
  | "CoreHttpRequest"
  | "LogicIfElse"
  | "CoreSetFields"
  | "CoreDelay"
  | "CoreMerge"
  | "AiExtract"
  | "AiGenerate";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label?: string;
    params?: Record<string, any>;
    credentialId?: string;
    ui?: Record<string, any>;
  };
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type NodeDefinition = {
  type: WorkflowNodeType;
  label: string;
  category: "Triggers" | "Logic" | "Core" | "AI" | "Apps";
  description: string;
  inputs: string[];
  outputs: string[];
  defaultParams?: Record<string, any>;
};

export const WORKFLOW_NODE_LIBRARY: NodeDefinition[] = [
  {
    type: "TriggerManual",
    label: "Manual Trigger",
    category: "Triggers",
    description: "Start a workflow manually from the UI.",
    inputs: [],
    outputs: ["payload"],
    defaultParams: {
      description: "Manual trigger payload",
    },
  },
  {
    type: "TriggerWebhook",
    label: "Webhook Trigger",
    category: "Triggers",
    description: "Trigger workflow when a webhook is called.",
    inputs: [],
    outputs: ["payload"],
    defaultParams: {
      description: "Incoming webhook payload",
    },
  },
  {
    type: "TriggerSchedule",
    label: "Schedule Trigger",
    category: "Triggers",
    description: "Run workflow on a cron schedule.",
    inputs: [],
    outputs: ["payload"],
    defaultParams: {
      cron: "0 9 * * 1-5",
    },
  },
  {
    type: "CoreHttpRequest",
    label: "HTTP Request",
    category: "Core",
    description: "Make an HTTP request with retries and templating.",
    inputs: ["input"],
    outputs: ["response"],
    defaultParams: {
      method: "GET",
      url: "",
      headers: {},
      body: "",
      timeoutMs: 15000,
      retries: 2,
    },
  },
  {
    type: "LogicIfElse",
    label: "If / Else",
    category: "Logic",
    description: "Branch based on a condition.",
    inputs: ["input"],
    outputs: ["true", "false"],
    defaultParams: {
      left: "",
      operator: "equals",
      right: "",
    },
  },
  {
    type: "CoreSetFields",
    label: "Set Fields",
    category: "Core",
    description: "Map or rename fields into a new object.",
    inputs: ["input"],
    outputs: ["output"],
    defaultParams: {
      fields: [
        {
          key: "result",
          value: "",
        },
      ],
    },
  },
  {
    type: "CoreDelay",
    label: "Delay",
    category: "Core",
    description: "Pause the workflow for a set time.",
    inputs: ["input"],
    outputs: ["output"],
    defaultParams: {
      delayMs: 1000,
    },
  },
  {
    type: "CoreMerge",
    label: "Merge",
    category: "Core",
    description: "Merge multiple inputs into one output.",
    inputs: ["input"],
    outputs: ["output"],
    defaultParams: {
      strategy: "object",
    },
  },
  {
    type: "AiExtract",
    label: "AI Extract",
    category: "AI",
    description: "Extract structured fields from text or JSON.",
    inputs: ["input"],
    outputs: ["output"],
    defaultParams: {
      input: "",
      schema: "{ \"field\": \"string\" }",
    },
  },
  {
    type: "AiGenerate",
    label: "AI Generate",
    category: "AI",
    description: "Generate text from a prompt.",
    inputs: ["input"],
    outputs: ["output"],
    defaultParams: {
      prompt: "",
    },
  },
];

export const IF_ELSE_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater_than",
  "less_than",
  "is_true",
  "is_false",
] as const;
