import { RequestHandler } from "express";

export const handleGenerateBusinessPlan: RequestHandler = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  // OpenAI integration removed — return a deterministic demo business plan
  const now = new Date().toISOString();
  const mocked = `# Business Plan (Demo Mode)\n\n**Generated:** ${now}\n\n## 1) Summary\n${prompt}\n\n## 2) Target Customer\nDefine one primary persona, one secondary persona, and the core pain point.\n\n## 3) Value Proposition\nA 1-sentence promise + 3 proof points.\n\n## 4) Monetization\nStart with a single paid tier, then add upsells after first traction.\n\n## 5) 30-Day Plan\n- Week 1: Validate with 10 interviews\n- Week 2: Build landing + waitlist\n- Week 3: MVP + first beta users\n- Week 4: Launch + iterate\n\n## 6) Metrics\nActivation, retention, CAC, LTV, conversion, weekly active users.`;

  res.json({ businessPlan: mocked, success: true, demoMode: true });
};
