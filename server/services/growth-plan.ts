import type { GrowthPlanContent, OnboardingInput } from "@shared/onboarding";
import { growthPlanSchema } from "@shared/onboarding";
import { aiGenerateJson } from "./ai";

const SYSTEM_PROMPT = `You are a ruthless billionaire business strategist.
You create direct, actionable, zero-fluff 90-day execution plans.
You speak with authority and clarity.`;

function renderField(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === undefined || value === null || value === "") {
    return "Not provided";
  }
  return String(value);
}

function buildPrompt(input: OnboardingInput) {
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

export async function generateGrowthPlan(
  input: OnboardingInput
): Promise<GrowthPlanContent> {
  const raw = await aiGenerateJson<Record<string, unknown>>({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(input),
  });

  const parsed = growthPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("OpenAI returned an invalid growth plan format");
  }

  return parsed.data;
}
