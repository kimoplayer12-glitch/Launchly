import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const sub = decoded.sub;
  const email = decoded.email;
  if (!sub || typeof sub !== "string" || !email || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  return { sub, email };
}
