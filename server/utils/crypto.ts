import crypto from "crypto";

function getKey(): Buffer {
  const raw = process.env.WORKFLOW_CREDENTIALS_KEY;
  if (!raw) {
    throw new Error("WORKFLOW_CREDENTIALS_KEY is not set");
  }

  // Accept base64 or hex
  const maybeBase64 = Buffer.from(raw, "base64");
  if (maybeBase64.length === 32) {
    return maybeBase64;
  }

  const maybeHex = Buffer.from(raw, "hex");
  if (maybeHex.length === 32) {
    return maybeHex;
  }

  throw new Error(
    "WORKFLOW_CREDENTIALS_KEY must be 32 bytes (base64 or hex encoded)"
  );
}

export function encryptJson(payload: unknown): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptJson(ciphertext: string): unknown {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = ciphertext.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
