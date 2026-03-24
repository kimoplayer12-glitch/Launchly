import { z } from "zod";

const coerceNumber = () =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number") {
      return value;
    }
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
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().int().nonnegative());

export const businessStageSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const riskToleranceSchema = z.enum(["conservative", "aggressive"]);

export const onboardingSchema = z.object({
  niche: z.string().trim().min(1, "Niche is required"),
  currentMonthlyRevenue: coerceNumber(),
  businessStage: businessStageSchema,
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
  riskTolerance: riskToleranceSchema,
  wantsBrutalAccountability: z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean()),
});

const roadmapSchema = z.object({
  month1: z.array(z.string()).default([]),
  month2: z.array(z.string()).default([]),
  month3: z.array(z.string()).default([]),
});

export const growthPlanSchema = z.object({
  positioningStrategy: z.string().default(""),
  monetizationPlan: z.string().default(""),
  offerStructure: z.string().default(""),
  trafficStrategy: z.string().default(""),
  salesFunnel: z.string().default(""),
  "90DayRoadmap": roadmapSchema,
  dailyExecutionFramework: z.array(z.string()).default([]),
  keyKPIs: z.array(z.string()).default([]),
  biggestRisk: z.string().default(""),
  scalingStrategy: z.string().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type GrowthPlanContent = z.infer<typeof growthPlanSchema>;
