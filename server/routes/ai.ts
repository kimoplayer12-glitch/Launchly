import type { RequestHandler } from "express";
import { aiExtractStructured, aiGenerateText } from "../services/ai";

export const handleAiExtract: RequestHandler = async (req, res) => {
  try {
    const { input, schema } = req.body ?? {};
    if (!input || !schema) {
      return res.status(400).json({ error: "Missing input or schema" });
    }
    const result = await aiExtractStructured({ input, schema });
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "AI extract failed",
    });
  }
};

export const handleAiGenerate: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body ?? {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }
    const result = await aiGenerateText({ prompt });
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "AI generate failed",
    });
  }
};
