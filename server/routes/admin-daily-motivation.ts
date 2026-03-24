import type { RequestHandler } from "express";
import { enqueueDailyMotivationNow } from "../queues/daily-motivation";

function isAuthorizedAdmin(req: Parameters<RequestHandler>[0]) {
  const headerToken = req.headers["x-admin-token"];
  const providedToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const expectedToken = process.env.ADMIN_TRIGGER_TOKEN;

  if (expectedToken && providedToken === expectedToken) {
    return true;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const requestEmail = req.user?.email?.toLowerCase();
  return Boolean(requestEmail && adminEmails.includes(requestEmail));
}

export const handleTriggerDailyMotivation: RequestHandler = async (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: "Admin access is required" });
  }

  try {
    const jobId = await enqueueDailyMotivationNow();
    return res.json({
      success: true,
      jobId,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to enqueue daily motivation job",
    });
  }
};
