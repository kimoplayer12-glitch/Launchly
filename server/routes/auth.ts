import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { googleAuthSchema, loginSchema, signupSchema } from "@shared/auth";
import { prisma } from "../prisma";
import { signAccessToken } from "../utils/jwt";

const prismaClient = prisma as any;
const SALT_ROUNDS = 12;

async function createOAuthPasswordHash() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}-google-oauth`;
  return bcrypt.hash(seed, SALT_ROUNDS);
}

function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    createdAt: user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : new Date(user.createdAt).toISOString(),
  };
}

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        issues: parsed.error.flatten(),
      });
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    const user = await prismaClient.user.create({
      data: {
        email,
        password: passwordHash,
        onboardingCompleted: false,
      },
    });

    const token = signAccessToken({ sub: user.id, email: user.email });
    return res.status(201).json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create account",
    });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        issues: parsed.error.flatten(),
      });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(parsed.data.password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signAccessToken({ sub: user.id, email: user.email });
    return res.json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to sign in",
    });
  }
};

export const handleGetMe: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load user profile",
    });
  }
};

export const handleGoogleAuth: RequestHandler = async (req, res) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        issues: parsed.error.flatten(),
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(parsed.data.idToken);
    const email = decodedToken.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Google account email is required" });
    }

    let user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          email,
          password: await createOAuthPasswordHash(),
          onboardingCompleted: false,
        },
      });
    }

    const token = signAccessToken({ sub: user.id, email: user.email });
    return res.json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(401).json({
      error: "Google authentication failed",
    });
  }
};
