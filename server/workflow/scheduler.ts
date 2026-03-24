import crypto from "crypto";

export function generateWebhookSecret() {
  return crypto.randomBytes(16).toString("hex");
}
