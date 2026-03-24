import { RequestHandler } from "express";
import { aiGenerateText } from "../services/ai";

export const handleChatWithPlan: RequestHandler = async (req, res) => {
  const { message, businessPlan, businessName } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI adviser is not configured. Add OPENAI_API_KEY to enable it.",
    });
  }

  const planText =
    typeof businessPlan === "string" && businessPlan.trim()
      ? businessPlan.trim()
      : "No business plan provided yet.";

  const prompt = [
    "You are an AI business advisor helping founders refine their business plan.",
    "Be concise, actionable, and professional.",
    "Use bullets when helpful. Ask one clarifying question if needed.",
    "",
    `Business name: ${businessName || "Unknown"}`,
    "Business plan:",
    planText,
    "",
    "Founder question:",
    message.trim(),
  ].join("\n");

  try {
    const responseText = await aiGenerateText({ prompt });
    return res.json({ response: responseText, success: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "AI adviser failed",
    });
  }
};
