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

const planCopy: Record<UserTier, { label: string; subtitle: string; outcomes: string[] }> = {
free: {
label: "Free",
subtitle: "A calm place to start your launch.",
outcomes: ["Business plan + positioning generator", "Basic content generation", "Simple KPI dashboard", "Limited scheduling"],
},
growth: {
label: "Growth",
subtitle: "Weekly growth engine for consistent launches.",
outcomes: ["Weekly Growth Plan", "Content calendar + post generation", "AI ad copy generation", "Landing page / website builder tools", "Performance report"],
},
scale: {
label: "Scale",
subtitle: "Automation + analytics for growing teams.",
outcomes: ["Full marketing automation", "Multi-platform social scheduling", "Advanced analytics + insights", "Team access", "Priority speed"],
},
};

const handleUpgrade = (tier: UserTier) => {
upgradeTier(tier);
navigate("/credits");
};

return (
<div className="page-shell">
<div className="section px-3 sm:px-0">
{/* Header */}
<div className="text-center mb-8 sm:mb-10">
<div className="eyebrow">Pricing</div>
<h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mt-4 mb-4">
Choose a premium growth system
</h1>
<p className="text-sm sm:text-lg text-foreground/60 max-w-2xl mx-auto">
Pricing built around outcomes. Credits power the AI behind the scenes.
</p>
</div>

    <div className="flex items-center justify-center gap-2 mb-8 sm:mb-12">
      <button
        onClick={() => setBilling("monthly")}
        className={`px-4 py-2 rounded-full text-xs font-semibold border ${billing === "monthly" ? "border-neon-cyan bg-neon-cyan/15 text-foreground" : "border-white/10 text-foreground/60"}`}
      >
        Monthly
      </button>
      <button
        disabled
        className="px-4 py-2 rounded-full text-xs font-semibold border border-white/10 text-foreground/40 cursor-not-allowed"
      >
        Annual (soon)
      </button>
    </div>

    {/* Why Subscribe */}
    <div className="mb-8 sm:mb-12">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Why founders subscribe</h2>
        <p className="text-foreground/60 text-sm">A weekly system that keeps growth on track.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-6">
        {[
          { title: "Save 10+ hours/week", desc: "Automate planning, content, and reporting." },
          { title: "Stay consistent with marketing", desc: "A weekly plan that removes guesswork." },
          { title: "Make decisions with real data", desc: "Track what drives revenue and focus there." },
        ].map((item) => (
          <GlassCard key={item.title} variant="dark" className="border-white/10">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-foreground/60">{item.desc}</p>
          </GlassCard>
        ))}
      </div>
    </div>

    {/* Pricing Cards */}
    <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
      {pricingOrder.map((tier) => {
        const copy = planCopy[tier.tier];
        const price = tier.price ?? 0;
        const isPopular = tier.tier === "growth";
        return (
          <FloatingCard key={tier.tier} delay={isPopular ? 0 : 100}>
            <GlassCard
              variant="dark"
              glow={isPopular}
              className={`relative border transition-all duration-300 h-full ${isPopular ? "border-neon-cyan/60 sm:scale-105" : "border-white/10"} hover:border-neon-cyan/40`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[hsl(var(--neon-cyan))] text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
                </div>
              )}

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">{copy.label}</h3>
                  <p className="text-xs sm:text-sm text-foreground/60">{copy.subtitle}</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price !== 0 && <span className="text-foreground/60 text-sm">/month</span>}
                  </div>
                  <p className="text-xs text-foreground/50 mt-1">{tier.monthlyCredits.toLocaleString()} credits/month</p>
                </div>

                <button
                  onClick={() => handleUpgrade(tier.tier)}
                  disabled={credits?.tier === tier.tier}
                  className={`w-full py-2.5 rounded-full font-semibold transition-all duration-300 text-sm ${
                    credits?.tier === tier.tier
                      ? "bg-white/10 text-foreground/50 cursor-not-allowed"
                      : isPopular ? "btn-neon" : "btn-glass border-white/20 hover:border-white/40"
                  }`}
                >
                  {credits?.tier === tier.tier ? "Current Plan" : "Choose Plan"}
                </button>

                <ul className="space-y-2">
                  {copy.outcomes.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--neon-cyan))] flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-foreground/70">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          </FloatingCard>
        );
      })}
    </div>

    {/* Top-up Packs */}
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-8 backdrop-blur">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-6">Need more this month?</h2>
      <p className="text-foreground/60 text-sm mb-4 sm:mb-6">Top up credits anytime. Credits never expire while you're subscribed.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {TOP_UP_PACKS.map((pack, idx) => (
          <div key={idx} className="border border-white/10 rounded-xl p-3 sm:p-4 bg-white/5 hover:border-neon-cyan/50 transition-colors">
            <p className="font-semibold text-white text-sm mb-1">{pack.name}</p>
            <p className="text-xl sm:text-2xl font-bold text-[hsl(var(--neon-cyan))] mb-1">{pack.credits.toLocaleString()}</p>
            <p className="text-xs text-foreground/60 mb-2 sm:mb-3">credits</p>
            <button className="w-full btn-glass py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold" onClick={() => navigate("/credits")}>
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
