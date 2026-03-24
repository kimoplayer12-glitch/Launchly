import admin from "firebase-admin";
import { z } from "zod";

const FIREBASE_IDENTITY_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const GROWTH_PLAN_SYSTEM_PROMPT = `You are a ruthless billionaire business strategist.
You create direct, actionable, zero-fluff 90-day execution plans.
You speak with authority and clarity.`;

const signupSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long"),
});

const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  onboardingCompleted: z.boolean(),
  createdAt: z.string(),
});

const coerceNumber = () =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().finite().nonnegative());

const coerceInt = () =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().int().nonnegative());

const onboardingSchema = z.object({
  niche: z.string().trim().min(1, "Niche is required"),
  currentMonthlyRevenue: coerceNumber(),
  businessStage: z.enum(["beginner", "intermediate", "advanced"]),
  primaryRevenueSource: z
    .string()
    .trim()
    .min(1, "Primary revenue source is required"),
  targetMarketCountry: z
    .string()
    .trim()
    .min(1, "Target market country is required"),
  monthlyBudget: coerceNumber(),
  teamSize: coerceInt(),
  hoursPerDayAvailable: coerceNumber(),
  skills: z.array(z.string().trim().min(1)).min(1, "At least one skill is required"),
  threeMonthRevenueGoal: coerceNumber(),
  oneYearRevenueGoal: coerceNumber(),
  biggestObstacle: z.string().trim().min(1, "Biggest obstacle is required"),
  riskTolerance: z.enum(["conservative", "aggressive"]),
  wantsBrutalAccountability: z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean()),
});

const growthPlanSchema = z.object({
  positioningStrategy: z.string().default(""),
  monetizationPlan: z.string().default(""),
  offerStructure: z.string().default(""),
  trafficStrategy: z.string().default(""),
  salesFunnel: z.string().default(""),
  "90DayRoadmap": z.object({
    month1: z.array(z.string()).default([]),
    month2: z.array(z.string()).default([]),
    month3: z.array(z.string()).default([]),
  }),
  dailyExecutionFramework: z.array(z.string()).default([]),
  keyKPIs: z.array(z.string()).default([]),
  biggestRisk: z.string().default(""),
  scalingStrategy: z.string().default(""),
});

type IdentityAuthResult = {
  localId: string;
  email?: string;
  idToken: string;
  refreshToken?: string;
};

type AuthedUser = {
  uid: string;
  email?: string;
};

type FirebaseUserProfile = z.infer<typeof authUserSchema>;

function nowIso() {
  return new Date().toISOString();
}

function json(res: any, status: number, payload: Record<string, unknown>) {
  return res.status(status).json(payload);
}

function parseJsonBody(req: any) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function getRoute(req: any) {
  const raw = req.query?.route;
  if (Array.isArray(raw)) {
    return String(raw[0] || "").replace(/^\/+/, "");
  }
  if (typeof raw === "string") {
    return raw.replace(/^\/+/, "");
  }
  return "";
}

function getBearerToken(req: any) {
  const header = req.headers?.authorization ?? "";
  if (typeof header !== "string") return null;
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function getFirebaseApiKey() {
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("FIREBASE_API_KEY is not configured");
  }
  return apiKey;
}

function initializeFirebase() {
  try {
    return admin.app();
  } catch {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    return admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
}

function getFirestoreDb() {
  initializeFirebase();
  return admin.firestore();
}

async function getAuthedUser(req: any): Promise<AuthedUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

function renderField(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null || value === "") return "Not provided";
  return String(value);
}

function buildGrowthPlanPrompt(input: z.infer<typeof onboardingSchema>) {
  return `Generate a complete business growth strategy based on:

Niche: ${renderField(input.niche)}
Current Revenue: ${renderField(input.currentMonthlyRevenue)}
Business Stage: ${renderField(input.businessStage)}
Revenue Source: ${renderField(input.primaryRevenueSource)}
Budget: ${renderField(input.monthlyBudget)}
Team Size: ${renderField(input.teamSize)}
Time Available Per Day: ${renderField(input.hoursPerDayAvailable)}
Skills: ${renderField(input.skills)}
3-Month Goal: ${renderField(input.threeMonthRevenueGoal)}
1-Year Goal: ${renderField(input.oneYearRevenueGoal)}
Biggest Obstacle: ${renderField(input.biggestObstacle)}
Risk Tolerance: ${renderField(input.riskTolerance)}
Brutal Accountability: ${renderField(input.wantsBrutalAccountability)}

Return structured JSON with:

{
  "positioningStrategy": "",
  "monetizationPlan": "",
  "offerStructure": "",
  "trafficStrategy": "",
  "salesFunnel": "",
  "90DayRoadmap": {
      "month1": [],
      "month2": [],
      "month3": []
  },
  "dailyExecutionFramework": [],
  "keyKPIs": [],
  "biggestRisk": "",
  "scalingStrategy": ""
}`;
}

async function aiGenerateJson<T = any>(prompt: string, system: string): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
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
  const content = data?.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("Failed to parse AI JSON response");
  }
}

async function generateGrowthPlan(input: z.infer<typeof onboardingSchema>) {
  const raw = await aiGenerateJson<Record<string, unknown>>(
    buildGrowthPlanPrompt(input),
    GROWTH_PLAN_SYSTEM_PROMPT
  );

  const parsed = growthPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("OpenAI returned an invalid growth plan format");
  }

  return parsed.data;
}

function toIdentityErrorCode(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message.trim();
  }
  return "AUTH_REQUEST_FAILED";
}

function mapIdentityError(code: string) {
  if (code === "EMAIL_EXISTS") {
    return { status: 409, message: "Email already in use" };
  }
  if (code === "EMAIL_NOT_FOUND" || code === "INVALID_PASSWORD") {
    return { status: 401, message: "Invalid email or password" };
  }
  if (code === "INVALID_LOGIN_CREDENTIALS") {
    return { status: 401, message: "Invalid email or password" };
  }
  if (code === "INVALID_EMAIL") {
    return { status: 400, message: "A valid email is required" };
  }
  if (code.startsWith("WEAK_PASSWORD")) {
    return { status: 400, message: "Password is too weak" };
  }
  if (code === "USER_DISABLED") {
    return { status: 403, message: "Account is disabled" };
  }
  if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
    return { status: 429, message: "Too many attempts. Try again later." };
  }
  if (code === "OPERATION_NOT_ALLOWED") {
    return { status: 500, message: "Firebase email/password auth is not enabled" };
  }
  if (code === "FIREBASE_API_KEY is not configured") {
    return { status: 500, message: "FIREBASE_API_KEY is not configured" };
  }
  return { status: 500, message: `Authentication request failed (${code})` };
}

async function callIdentityToolkit(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<IdentityAuthResult> {
  const apiKey = getFirebaseApiKey();
  const url = `${FIREBASE_IDENTITY_BASE_URL}/${endpoint}?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code =
      typeof data?.error?.message === "string"
        ? data.error.message
        : "AUTH_REQUEST_FAILED";
    throw new Error(code);
  }

  return data as IdentityAuthResult;
}

async function ensureUserProfile(
  uid: string,
  emailFallback?: string | null
): Promise<FirebaseUserProfile> {
  const db = getFirestoreDb();
  const ref = db.collection("users").doc(uid);
  const snapshot = await ref.get();
  const current = snapshot.exists ? snapshot.data() || {} : {};

  const createdAt =
    typeof current?.createdAt === "string" && current.createdAt
      ? current.createdAt
      : nowIso();
  const email =
    typeof current?.email === "string" && current.email
      ? current.email
      : typeof emailFallback === "string"
        ? emailFallback
        : "";

  if (!email) {
    throw new Error("User email is missing");
  }

  const onboardingCompleted = Boolean(current?.onboardingCompleted);
  const normalized = authUserSchema.parse({
    id: uid,
    email: email.toLowerCase(),
    onboardingCompleted,
    createdAt,
  });

  await ref.set(
    {
      email: normalized.email,
      onboardingCompleted: normalized.onboardingCompleted,
      createdAt: normalized.createdAt,
      updatedAt: nowIso(),
    },
    { merge: true }
  );

  return normalized;
}

async function handleSignup(req: any, res: any) {
  const parsed = signupSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) {
    return json(res, 400, {
      error: "Invalid request body",
      issues: parsed.error.flatten(),
    });
  }

  try {
    const authResult = await callIdentityToolkit("accounts:signUp", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      returnSecureToken: true,
    });

    const user = await ensureUserProfile(authResult.localId, authResult.email);
    return json(res, 201, {
      token: authResult.idToken,
      refreshToken: authResult.refreshToken,
      user,
    });
  } catch (error) {
    const code = toIdentityErrorCode(error);
    console.error("[auth/signup] identity error:", code);
    const { status, message } = mapIdentityError(code);
    return json(res, status, { error: message });
  }
}

async function handleLogin(req: any, res: any) {
  const parsed = loginSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) {
    return json(res, 400, {
      error: "Invalid request body",
      issues: parsed.error.flatten(),
    });
  }

  try {
    const authResult = await callIdentityToolkit("accounts:signInWithPassword", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      returnSecureToken: true,
    });

    const user = await ensureUserProfile(authResult.localId, authResult.email);
    return json(res, 200, {
      token: authResult.idToken,
      refreshToken: authResult.refreshToken,
      user,
    });
  } catch (error) {
    const code = toIdentityErrorCode(error);
    console.error("[auth/login] identity error:", code);
    const { status, message } = mapIdentityError(code);
    return json(res, status, { error: message });
  }
}

async function handleGoogleAuth(req: any, res: any) {
  const parsed = googleAuthSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) {
    return json(res, 400, {
      error: "Invalid request body",
      issues: parsed.error.flatten(),
    });
  }

  try {
    initializeFirebase();
    const decodedToken = await admin.auth().verifyIdToken(parsed.data.idToken);
    const email = decodedToken.email?.toLowerCase();
    if (!email) {
      return json(res, 400, { error: "Google account email is required" });
    }

    const user = await ensureUserProfile(decodedToken.uid, email);
    return json(res, 200, {
      token: parsed.data.idToken,
      user,
    });
  } catch {
    return json(res, 401, { error: "Google authentication failed" });
  }
}

async function handleGetMe(req: any, res: any) {
  const auth = await getAuthedUser(req);
  if (!auth) {
    return json(res, 401, { error: "Invalid or expired token" });
  }

  try {
    const user = await ensureUserProfile(auth.uid, auth.email);
    return json(res, 200, { user });
  } catch {
    return json(res, 500, { error: "Failed to load user profile" });
  }
}

async function handleOnboarding(req: any, res: any) {
  const auth = await getAuthedUser(req);
  if (!auth) {
    return json(res, 401, { error: "Invalid or expired token" });
  }

  const parsed = onboardingSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) {
    return json(res, 400, {
      error: "Invalid onboarding data",
      issues: parsed.error.flatten(),
    });
  }

  try {
    const db = getFirestoreDb();
    const profileRef = db.collection("businessProfiles").doc(auth.uid);
    const existingProfileSnapshot = await profileRef.get();
    const existingProfile = existingProfileSnapshot.exists
      ? existingProfileSnapshot.data() || {}
      : {};
    const timestamp = nowIso();

    await profileRef.set(
      {
        userId: auth.uid,
        niche: parsed.data.niche,
        currentMonthlyRevenue: parsed.data.currentMonthlyRevenue,
        businessStage: parsed.data.businessStage,
        primaryRevenueSource: parsed.data.primaryRevenueSource,
        targetMarketCountry: parsed.data.targetMarketCountry,
        monthlyBudget: parsed.data.monthlyBudget,
        teamSize: parsed.data.teamSize,
        hoursPerDayAvailable: parsed.data.hoursPerDayAvailable,
        skills: parsed.data.skills,
        threeMonthRevenueGoal: parsed.data.threeMonthRevenueGoal,
        oneYearRevenueGoal: parsed.data.oneYearRevenueGoal,
        biggestObstacle: parsed.data.biggestObstacle,
        riskTolerance: parsed.data.riskTolerance,
        wantsBrutalAccountability: parsed.data.wantsBrutalAccountability,
        createdAt:
          typeof existingProfile?.createdAt === "string"
            ? existingProfile.createdAt
            : timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    let growthPlan;
    try {
      growthPlan = await generateGrowthPlan(parsed.data);
    } catch {
      return json(res, 502, {
        error: "Failed to generate your growth plan. Please try again in a moment.",
      });
    }

    await db.collection("growthPlans").doc(auth.uid).set(
      {
        userId: auth.uid,
        content: growthPlan,
        generatedAt: timestamp,
      },
      { merge: true }
    );

    await db.collection("users").doc(auth.uid).set(
      {
        onboardingCompleted: true,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    return json(res, 200, { success: true, growthPlan });
  } catch {
    return json(res, 500, { error: "Failed to complete onboarding" });
  }
}

async function handleGrowthPlan(req: any, res: any) {
  const auth = await getAuthedUser(req);
  if (!auth) {
    return json(res, 401, { error: "Invalid or expired token" });
  }

  try {
    const snapshot = await getFirestoreDb()
      .collection("growthPlans")
      .doc(auth.uid)
      .get();
    if (!snapshot.exists) {
      return json(res, 404, { error: "Growth plan not found" });
    }

    const value = snapshot.data() || {};
    return json(res, 200, {
      growthPlan: value?.content ?? null,
      generatedAt: value?.generatedAt ?? null,
    });
  } catch {
    return json(res, 500, { error: "Failed to load growth plan" });
  }
}

async function handleAdminTrigger(req: any, res: any) {
  const auth = await getAuthedUser(req);
  if (!auth) {
    return json(res, 401, { error: "Invalid or expired token" });
  }

  const headerToken = req.headers?.["x-admin-token"];
  const providedToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const expectedToken = process.env.ADMIN_TRIGGER_TOKEN;

  if (expectedToken && providedToken === expectedToken) {
    return json(res, 503, {
      error:
        "Daily motivation queue trigger is not available in this Vercel function. Use the backend worker process.",
    });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!auth.email || !adminEmails.includes(auth.email.toLowerCase())) {
    return json(res, 403, { error: "Admin access is required" });
  }

  return json(res, 503, {
    error:
      "Daily motivation queue trigger is not available in this Vercel function. Use the backend worker process.",
  });
}

export default async function handler(req: any, res: any) {
  const route = getRoute(req);
  const method = String(req.method || "GET").toUpperCase();

  if (route === "ping" && method === "GET") {
    return json(res, 200, { message: process.env.PING_MESSAGE ?? "ping" });
  }
  if (route === "auth/signup" && method === "POST") {
    return handleSignup(req, res);
  }
  if (route === "auth/login" && method === "POST") {
    return handleLogin(req, res);
  }
  if (route === "auth/google" && method === "POST") {
    return handleGoogleAuth(req, res);
  }
  if (route === "user/me" && method === "GET") {
    return handleGetMe(req, res);
  }
  if (route === "onboarding" && method === "POST") {
    return handleOnboarding(req, res);
  }
  if (route === "growth-plan" && method === "GET") {
    return handleGrowthPlan(req, res);
  }
  if (route === "admin/trigger-daily-motivation" && method === "POST") {
    return handleAdminTrigger(req, res);
  }

  return json(res, 404, { error: "Not found" });
}
