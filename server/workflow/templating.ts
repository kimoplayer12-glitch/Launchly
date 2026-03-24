type TemplateContext = {
  trigger: any;
  nodeOutputs: Record<string, any>;
  env: Record<string, string | undefined>;
  input?: any;
  inputs?: any[];
};

function getPathValue(obj: any, path: string) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function resolveExpression(expression: string, context: TemplateContext) {
  const trimmed = expression.trim();

  if (trimmed.startsWith("$trigger")) {
    const path = trimmed.replace("$trigger.", "");
    return getPathValue(context.trigger, path);
  }

  if (trimmed.startsWith("$env")) {
    const path = trimmed.replace("$env.", "");
    return context.env[path];
  }

  if (trimmed.startsWith("$input")) {
    const path = trimmed.replace("$input.", "");
    return getPathValue(context.input, path);
  }

  if (trimmed.startsWith("$inputs")) {
    const path = trimmed.replace("$inputs.", "");
    return getPathValue(context.inputs, path);
  }

  const nodeMatch = trimmed.match(/^\$node\[(["'])(.+?)\1\]\.(.+)$/);
  if (nodeMatch) {
    const nodeId = nodeMatch[2];
    const path = nodeMatch[3];
    const nodeOutput = context.nodeOutputs[nodeId];
    if (path === "output") return nodeOutput;
    if (path.startsWith("output.")) {
      return getPathValue(nodeOutput, path.replace("output.", ""));
    }
    return getPathValue(nodeOutput, path);
  }

  return undefined;
}

export function resolveTemplates<T>(value: T, context: TemplateContext): T {
  if (typeof value === "string") {
    return value.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
      const resolved = resolveExpression(expr, context);
      if (resolved === undefined || resolved === null) {
        return "";
      }
      return typeof resolved === "string" ? resolved : JSON.stringify(resolved);
    }) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplates(item, context)) as T;
  }

  if (typeof value === "object" && value !== null) {
    const result: Record<string, any> = {};
    Object.entries(value as Record<string, any>).forEach(([key, val]) => {
      result[key] = resolveTemplates(val, context);
    });
    return result as T;
  }

  return value;
}
