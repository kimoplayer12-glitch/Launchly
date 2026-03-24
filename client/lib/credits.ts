// Credit system constants and types
export type UserTier = "free" | "growth" | "scale";

export interface PricingTier {
  tier: UserTier;
  name: string;
  price: number | null;
  monthlyCredits: number;
  description: string;
  features: string[];
}

export interface UserCredits {
  currentCredits: number;
  monthlyLimit: number;
  lastRenewalDate: string;
  tier: UserTier;
  renewalDate: string;
}

export interface CreditCost {
  action: string;
  cost: number;
  category: "text" | "social" | "products" | "ads" | "email" | "landing" | "business";
}

/**
 * Launchly Pricing Plans - Credit-based monthly model
 */
export const PRICING_TIERS: Record<UserTier, PricingTier> = {
  free: {
    tier: "free",
    name: "Starter",
    price: null,
    monthlyCredits: 10,
    description: "Test Launchly and hit limits quickly",
    features: [
      "10 AI credits per month",
      "Basic business plan generation",
      "Limited dashboard access",
      "No automation tools",
      "Launchly branding on content",
    ],
  },
  growth: {
    tier: "growth",
    name: "Growth",
    price: 39,
    monthlyCredits: 150,
    description: "Main plan for early founders scaling fast",
    features: [
      "150 AI credits per month",
      "Social media post generation",
      "AI ad copy generation",
      "Revenue dashboard access",
      "Website/landing page builder",
      "Store creation tools",
      "Stripe integration",
      "Monthly performance report",
    ],
  },
  scale: {
    tier: "scale",
    name: "Scale",
    price: 99,
    monthlyCredits: 600,
    description: "For founders scaling with full automation",
    features: [
      "600 AI credits per month",
      "Full marketing automation",
      "Multi-platform social posting",
      "Advanced analytics",
      "AI business assistant",
      "Priority AI speed",
      "Team access (multiple users)",
    ],
  },
};

/**
 * Credit costs for different actions
 * TEMPORARY: All costs set to 0 for demo mode
 */
export const CREDIT_COSTS: Record<string, number> = {
  // Text Generation
  short_text: 0,
  social_post: 0,
  product_description: 0,
  ad_copy: 0,
  email_campaign: 0,
  landing_page_copy: 0,

  // Business Tools
  business_plan: 0,
  full_plan: 0,
  business_plan_chat: 0,
  brand_strategy: 0,

  // Social Media
  social_posts_batch: 0,
  social_schedule: 0,

  // Website/Store
  website_copy: 0,
  store_description: 0,

  // Analytics & Reports
  growth_suggestion: 0,
  performance_report: 0,
};

export const TOP_UP_PACKS = [
  {
    name: "Quick Pack",
    credits: 50,
    price: 9,
  },
  {
    name: "Creator Pack",
    credits: 150,
    price: 24,
  },
  {
    name: "Business Pack",
    credits: 500,
    price: 69,
  },
  {
    name: "Pro Pack",
    credits: 1500,
    price: 179,
  },
];

/**
 * Get initial credits for a user based on their tier
 */
export const getInitialCredits = (tier: UserTier): UserCredits => {
  const pricingTier = PRICING_TIERS[tier];
  const now = new Date();
  const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    currentCredits: pricingTier.monthlyCredits,
    monthlyLimit: pricingTier.monthlyCredits,
    lastRenewalDate: now.toISOString(),
    tier,
    renewalDate: renewalDate.toISOString(),
  };
};

/**
 * Check if monthly credits need to be renewed
 */
export const checkMonthlyRenewal = (credits: UserCredits): UserCredits => {
  const renewalDate = new Date(credits.renewalDate);
  const now = new Date();

  // If we've passed the renewal date, reset credits
  if (now >= renewalDate) {
    const pricingTier = PRICING_TIERS[credits.tier];
    const nextRenewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      ...credits,
      currentCredits: pricingTier.monthlyCredits,
      monthlyLimit: pricingTier.monthlyCredits,
      lastRenewalDate: now.toISOString(),
      renewalDate: nextRenewalDate.toISOString(),
    };
  }

  return credits;
};
