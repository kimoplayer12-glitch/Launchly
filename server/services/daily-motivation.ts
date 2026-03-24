import { Resend } from "resend";
import { prisma } from "../prisma";
import { aiGenerateText } from "./ai";

const prismaClient = prisma as any;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Launchly <onboarding@resend.dev>";

const SYSTEM_PROMPT = `You are a disciplined billionaire mentor.
Write short, powerful, personalized motivation messages.`;

const inMemoryDailySendTracker = new Set<string>();

function clampToSentenceLimit(input: string, maxSentences = 4) {
  const sentences = input
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, maxSentences).join(" ");
}

function toDateKey(date: Date, timezone?: string) {
  if (!timezone) {
    return date.toISOString().slice(0, 10);
  }

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value || "0000";
    const month = parts.find((part) => part.type === "month")?.value || "00";
    const day = parts.find((part) => part.type === "day")?.value || "00";
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function getHourInTimezone(date: Date, timezone?: string) {
  if (!timezone) {
    return date.getHours();
  }

  try {
    const hourText = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date);

    return Number(hourText);
  } catch {
    return date.getHours();
  }
}

function buildFallbackMessage(profile: any) {
  return `Your ${profile.niche} business will not grow by waiting. Attack ${profile.biggestObstacle || "your biggest obstacle"} before noon and execute with zero excuses. Push hard toward your ${profile.threeMonthRevenueGoal || "90-day"} revenue target.`;
}

async function generateMotivationMessage(profile: any) {
  const prompt = `User niche: ${profile.niche}
Revenue goal: ${profile.threeMonthRevenueGoal ?? "Not provided"}
Obstacle: ${profile.biggestObstacle ?? "Not provided"}

Write a short motivational message (max 4 sentences).
Be direct and intense.`;

  try {
    const response = await aiGenerateText({
      system: SYSTEM_PROMPT,
      prompt,
    });

    const cleaned = clampToSentenceLimit(response, 4);
    return cleaned || buildFallbackMessage(profile);
  } catch (error) {
    console.error("Motivation generation failed, using fallback:", error);
    return buildFallbackMessage(profile);
  }
}

async function sendMotivationEmail(email: string, message: string) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: "Daily Motivation: Execute Today",
    text: message,
    html: `<p style="font-size:16px;line-height:1.6;">${message}</p>`,
  });
}

export async function runDailyMotivationCycle() {
  const users = await prismaClient.user.findMany({
    where: { onboardingCompleted: true },
    include: {
      businessProfile: true,
    },
  });

  const now = new Date();
  const summary = {
    totalUsers: users.length,
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const user of users) {
    const profile = user.businessProfile;
    if (!profile) {
      summary.skipped += 1;
      console.log(`[daily-motivation] skipped ${user.id}: no business profile`);
      continue;
    }

    const timezone = (user as any).timezone as string | undefined;
    const localHour = getHourInTimezone(now, timezone);
    if (localHour !== 8) {
      summary.skipped += 1;
      continue;
    }

    const dateKey = toDateKey(now, timezone);
    const dedupeKey = `${user.id}:${dateKey}`;
    if (inMemoryDailySendTracker.has(dedupeKey)) {
      summary.skipped += 1;
      continue;
    }

    summary.attempted += 1;

    try {
      const message = await generateMotivationMessage(profile);
      await sendMotivationEmail(user.email, message);
      inMemoryDailySendTracker.add(dedupeKey);
      summary.sent += 1;
      console.log(`[daily-motivation] sent to ${user.email}`);
    } catch (error) {
      summary.failed += 1;
      console.error(`[daily-motivation] failed for ${user.email}:`, error);
    }
  }

  return summary;
}
