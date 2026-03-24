import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRICING_TIERS, TOP_UP_PACKS, UserTier } from "../lib/credits";
import { useCredits } from "../hooks/use-credits";
import { Check } from "lucide-react";
import FooterLinks from "@/components/FooterLinks";
import GlassCard from "@/components/GlassCard";
import FloatingCard from "@/components/FloatingCard";

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { credits, upgradeTier } = useCredits();
  const pricingOrder = [PRICING_TIERS.free, PRICING_TIERS.growth, PRICING_TIERS.scale];
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const planCopy: Record<
    UserTier,
    { label: string; subtitle: string; outcomes: string[] }
  > = {
    free: {
      label: "Free",
      subtitle: "A calm place to start your launch.",
      outcomes: [
        "Business plan + positioning generator",
        "Basic content generation",
        "Simple KPI dashboard",
        "Limited scheduling",
      ],
    },
    growth: {
      label: "Growth",
      subtitle: "Weekly growth engine for consistent launches.",
      outcomes: [
        "Weekly Growth Plan",
        "Content calendar + post generation",
        "AI ad copy generation",
        "Landing page / website builder tools",
        "Performance report",
      ],
    },
    scale: {
      label: "Scale",
      subtitle: "Automation + analytics for growing teams.",
      outcomes: [
        "Full marketing automation",
        "Multi-platform social scheduling",
        "Advanced analytics + insights",
        "Team access",
        "Priority speed",
      ],
    },
  };

  const handleUpgrade = (tier: UserTier) => {
    upgradeTier(tier);
    navigate("/credits");
  };

  return (
    <div className="page-shell">
      <div className="section">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="eyebrow">
            Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold mt-4 mb-4">
            Choose a premium growth system
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Pricing built around outcomes. Credits power the AI behind the scenes.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-12">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-full text-xs font-semibold border ${
              billing === "monthly"
                ? "border-neon-cyan bg-neon-cyan/15 text-foreground"
                : "border-white/10 text-foreground/60"
            }`}
          >
            Monthly
          </button>
          <button
            disabled
            className="px-4 py-2 rounded-full text-xs font-semibold border border-white/10 text-foreground/40 cursor-not-allowed"
          >
            Annual (coming soon)
          </button>
          <span className="text-xs text-foreground/40">Save 20%</span>
        </div>

        {/* Why Subscribe */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Why founders subscribe</h2>
            <p className="text-foreground/60">A weekly system that keeps growth on track.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Save 10+ hours/week", desc: "Automate planning, content, and reporting." },
              { title: "Stay consistent with marketing", desc: "A weekly plan that removes guesswork." },
              { title: "Make decisions with real data", desc: "Track what drives revenue and focus there." },
            ].map((item) => (
              <GlassCard key={item.title} variant="dark" className="border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/60">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pricingOrder.map((tier) => {
            const copy = planCopy[tier.tier];
            const price = tier.price ?? 0;
            return (
            <FloatingCard key={tier.tier} delay={tier.tier === "growth" ? 0 : 100}>
            <GlassCard
              variant="dark"
              glow={tier.tier === "growth"}
              className={`relative border transition-all duration-300 ${
                tier.tier === "growth"
                  ? "border-neon-cyan/60 lg:scale-105"
                  : "border-white/10"
              } hover:border-neon-cyan/40`}
            >
              {tier.tier === "growth" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[hsl(var(--neon-cyan))] text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  {copy.label}
                </h3>
                <p className="text-sm text-foreground/60 mb-4">{copy.subtitle}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price !== 0 && <span className="text-foreground/60">/month</span>}
                  </div>
                  <p className="text-xs text-foreground/50 mt-2">
                    {tier.monthlyCredits.toLocaleString()} credits/month
                  </p>
                  <p className="text-xs text-foreground/40">
                    {tier.monthlyCredits >= 150
                      ? "150 credits ≈ ~15 campaigns / month"
                      : "Credits scale with your launch pace."}
                  </p>
                </div>

                <button
                  onClick={() => handleUpgrade(tier.tier)}
                  disabled={credits?.tier === tier.tier}
                  className={`w-full py-2 rounded-full font-semibold transition-all duration-300 mb-6 ${
                    credits?.tier === tier.tier
                      ? "bg-white/10 text-foreground/50 cursor-not-allowed"
                      : tier.tier === "growth"
                        ? "btn-neon"
                        : "btn-glass border-white/20 hover:border-white/40"
                  }`}
                >
                    {credits?.tier === tier.tier ? "Current Plan" : "Choose Plan"}
                </button>
                <p className="text-center text-xs text-foreground/50 mb-6">
                  Cancel anytime. Secure checkout.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2 pt-3">
                    {copy.outcomes.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[hsl(var(--neon-cyan))] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
            </FloatingCard>
          );
          })}
        </div>

        {/* Usage Accordion */}
        <details className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12 backdrop-blur group">
          <summary className="flex items-center justify-between cursor-pointer text-lg font-semibold text-white">
            How usage works (credits)
            <span className="text-sm text-foreground/50 group-open:rotate-180 transition-transform">v</span>
          </summary>
          <div className="mt-6 space-y-8">
            <div className="grid md:grid-cols-3 gap-6 text-sm text-foreground/60">
              <div>
                <p className="text-white font-semibold mb-1">Monthly credit allotment</p>
                <p>Fresh credits every month on your billing date.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Different tasks, different costs</p>
                <p>Simple actions: 1 credit. Complex plans: up to 25 credits.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Buy more anytime</p>
                <p>Top-up packs available when you need extra credits.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-[hsl(var(--neon-cyan))] mb-3">
                  Text & Copy
                </h3>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex justify-between">
                    <span>Short text</span>
                    <span className="font-semibold">1 credit</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Social post</span>
                    <span className="font-semibold">2 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Product description</span>
                    <span className="font-semibold">3 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Ad copy</span>
                    <span className="font-semibold">5 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Email campaign</span>
                    <span className="font-semibold">8 credits</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--neon-purple))] mb-3">
                  Planning & Strategy
                </h3>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex justify-between">
                    <span>Business plan</span>
                    <span className="font-semibold">0 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Brand strategy</span>
                    <span className="font-semibold">0 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Website copy</span>
                    <span className="font-semibold">0 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Landing page</span>
                    <span className="font-semibold">0 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Full plan</span>
                    <span className="font-semibold">0 credits</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--neon-cyan))] mb-3">
                  Website & Store
                </h3>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex justify-between">
                    <span>Store description</span>
                    <span className="font-semibold">10 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Growth suggestion</span>
                    <span className="font-semibold">3 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Performance report</span>
                    <span className="font-semibold">5 credits</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </details>

        {/* Top-up Packs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white mb-6">
            Need more this month?
          </h2>
          <p className="text-foreground/60 mb-6">
            Top up credits anytime. Credits never expire while you're subscribed.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {TOP_UP_PACKS.map((pack, idx) => (
              <div
                key={idx}
                className="border border-white/10 rounded-xl p-4 bg-white/5 hover:border-neon-cyan/50 transition-colors"
              >
                <p className="font-semibold text-white mb-2">{pack.name}</p>
                <p className="text-2xl font-bold text-[hsl(var(--neon-cyan))] mb-2">
                  {pack.credits.toLocaleString()}
                </p>
                <p className="text-sm text-foreground/60 mb-3">credits</p>
                <button
                  className="w-full btn-glass py-2 rounded-full text-sm font-semibold"
                  onClick={() => navigate("/credits")}
                >
                  ${pack.price}
                </button>
              </div>
            ))}
          </div>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
};

export default Pricing;

