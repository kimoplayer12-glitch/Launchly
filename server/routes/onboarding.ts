import type { RequestHandler } from "express";
import { onboardingSchema } from "@shared/onboarding";
import { prisma } from "../prisma";
import { generateGrowthPlan } from "../services/growth-plan";

const prismaClient = prisma as any;

export const handleSubmitOnboarding: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = onboardingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid onboarding data",
        issues: parsed.error.flatten(),
      });
    }

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prismaClient.businessProfile.upsert({
      where: { userId },
      create: {
        userId,
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
      },
      update: {
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
      },
    });

    let growthPlan;
    try {
      growthPlan = await generateGrowthPlan(parsed.data);
    } catch (error) {
      console.error("Growth plan generation failed:", error);
      return res.status(502).json({
        error:
          "Failed to generate your growth plan. Please try again in a moment.",
      });
    }

    await prismaClient.$transaction([
      prismaClient.growthPlan.upsert({
        where: { userId },
        create: {
          userId,
          content: growthPlan,
        },
        update: {
          content: growthPlan,
          generatedAt: new Date(),
        },
      }),
      prismaClient.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      growthPlan,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to complete onboarding",
    });
  }
};

export const handleGetGrowthPlan: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const growthPlan = await prismaClient.growthPlan.findUnique({
      where: { userId },
    });

    if (!growthPlan) {
      return res.status(404).json({ error: "Growth plan not found" });
    }

    return res.json({
      growthPlan: growthPlan.content,
      generatedAt: growthPlan.generatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load growth plan",
    });
  }
};
