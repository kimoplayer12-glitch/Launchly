type AiExtractInput = {
  input: string;
  schema: Record<string, unknown> | string;
};

type AiGenerateInput = {
  prompt: string;
  system?: string;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return key;
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export async function aiExtractStructured({ input, schema }: AiExtractInput) {
  const schemaText = typeof schema === "string" ? schema : JSON.stringify(schema);
  const prompt = `You are a data extraction engine. Extract fields from the input to match this JSON schema.\n\nSchema:\n${schemaText}\n\nInput:\n${input}\n\nReturn JSON only.`;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You output JSON only. Do not wrap in code fences or extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI error: ${message}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error("Failed to parse AI JSON response");
  }
}

export async function aiGenerateText({ prompt, system }: AiGenerateInput) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: system || "Return clean text. Avoid extra formatting.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI error: ${message}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function aiGenerateJson<T = any>({
  prompt,
  system,
}: {
  prompt: string;
  system?: string;
}): Promise<T> {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            system ||
            "Return JSON only. Do not include code fences or extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI error: ${message}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error("Failed to parse AI JSON response");
  }
}
