import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import GlassCard from "@/components/GlassCard";
import ParallaxSection from "@/components/ParallaxSection";
import FooterLinks from "@/components/FooterLinks";
import {
  ArrowRight,
  ChevronRight,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Wand2,
  LineChart,
} from "lucide-react";
import { PRICING_TIERS } from "@/lib/credits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [showDemo, setShowDemo] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  const plans = [
    PRICING_TIERS.free,
    PRICING_TIERS.growth,
    PRICING_TIERS.scale,
  ];
  const planLabels = {
    free: "Free",
    growth: "Growth",
    scale: "Scale",
  } as const;

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[90vh] pt-28 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-[10%] w-[520px] h-[520px] bg-neon-cyan/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[420px] h-[420px] bg-neon-purple/15 rounded-full blur-[160px]" />
        </div>

        <div className="section grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div className="space-y-8">
            <div className="eyebrow bg-white/5 backdrop-blur text-foreground/70">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              The AI Growth System for Founders
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight">
              Build Smarter. Launch Faster. Scale with AI.
            </h1>
            <p className="text-base sm:text-lg text-foreground/60 max-w-xl">
              Launchly replaces fragmented tools with a calm, weekly growth
              system. Plan your offer, generate assets, publish, run ads, and
              track what actually moves revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="btn-neon px-8 py-4 rounded-full">
                Start Building Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowDemo(true)}
                className="btn-glass px-8 py-4 rounded-full"
              >
                Watch Demo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-foreground/50">
              Built for founders who care about speed and polish.
            </p>
          </div>

          <ParallaxSection speed={0.2} className="relative">
            <GlassCard variant="dark" className="border-white/10">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="text-xs text-foreground/50">Launchly Console</div>
                    <div className="text-lg font-semibold">Weekly Overview</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/80" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["Plan", "Build", "Launch"].map((label) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                        {label}
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-2">Active</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-foreground/50 mb-2">Pipeline health</div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-neon-cyan" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </ParallaxSection>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="section">
          <div className="text-center mb-12">
            <div className="eyebrow">
              Feature Pillars
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4">
              A minimal stack for serious founders
            </h2>
            <p className="text-base text-foreground/60 max-w-2xl mx-auto mt-3">
              Keep your workflow calm and decisive with three focused systems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wand2,
                title: "AI Strategy",
                bullets: [
                  "Offer positioning guidance",
                  "Weekly growth priorities",
                  "Clarity on next actions",
                ],
              },
              {
                icon: Layers,
                title: "Website Builder",
                bullets: [
                  "Instant landing pages",
                  "Launch-ready structure",
                  "Fast edits and publishing",
                ],
              },
              {
                icon: LineChart,
                title: "Growth Automation",
                bullets: [
                  "Content + ad generation",
                  "Scheduling workflows",
                  "Performance tracking",
                ],
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <GlassCard key={pillar.title} variant="dark" className="border-white/10">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <h3 className="text-lg font-semibold">{pillar.title}</h3>
                    <ul className="space-y-2 text-sm text-foreground/60">
                      {pillar.bullets.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6">
        <div className="section">
          <div className="text-center mb-12">
            <div className="eyebrow">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4">
              A calm 3-step launch workflow
            </h2>
            <p className="text-base text-foreground/60 max-w-2xl mx-auto mt-3">
              Launchly keeps you moving with clear steps and no noise.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Describe your business",
                desc: "Answer a few prompts to set your positioning and offer.",
              },
              {
                step: "02",
                title: "Generate assets + site",
                desc: "Create pages, copy, and campaigns from one workspace.",
              },
              {
                step: "03",
                title: "Publish + iterate",
                desc: "Launch, measure, and refine every week with clarity.",
              },
            ].map((item) => (
              <GlassCard key={item.step} variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <div className="text-sm text-neon-cyan font-semibold">{item.step}</div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-foreground/60">{item.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="section">
          <div className="text-center mb-10">
            <div className="eyebrow">
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4">
              Choose your growth system
            </h2>
            <p className="text-base text-foreground/60 max-w-2xl mx-auto mt-3">
              Premium, minimal pricing. Upgrade as your launch grows.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-10">
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

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((tier) => {
              const isPopular = tier.tier === "growth";
              return (
                <GlassCard
                  key={tier.tier}
                  variant="dark"
                  glow={isPopular}
                  className={`relative border transition-all duration-300 ${
                    isPopular ? "border-neon-cyan/60" : "border-white/10"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-neon-cyan text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-foreground/50 uppercase tracking-[0.2em]">
                      {planLabels[tier.tier]}
                      </div>
                      <div className="text-3xl font-semibold mt-2">
                        {tier.price === null ? "Free" : `$${tier.price}`}
                        {tier.price !== null && (
                          <span className="text-sm text-foreground/50">/mo</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/60">
                      {tier.monthlyCredits.toLocaleString()} credits per month
                    </p>
                    <p className="text-xs text-foreground/50">
                      {tier.monthlyCredits >= 150
                        ? "150 credits ≈ ~15 campaigns / month"
                        : "Credits scale with your launch pace."}
                    </p>
                    <Link to="/pricing" className="btn-neon w-full justify-center">
                      View pricing
                    </Link>
                    <p className="text-xs text-foreground/50 text-center">
                      Cancel anytime. Secure checkout.
                    </p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 px-6">
        <div className="section grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div className="space-y-4">
            <div className="eyebrow">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold">Answers founders need</h2>
            <p className="text-base text-foreground/60">
              Clear, straightforward answers about credits and subscriptions.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "What are credits?",
                a: "Credits are usage units that power AI outputs. Each plan includes a monthly allotment.",
              },
              {
                q: "Do credits roll over?",
                a: "Credits reset monthly on your billing date. You can top up anytime.",
              },
              {
                q: "What happens if I run out?",
                a: "You can purchase a top-up pack or upgrade your plan to keep moving.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. You can cancel from your account settings with no lock-in.",
              },
              {
                q: "Can I upgrade or downgrade?",
                a: "Plans can be changed anytime. New credits apply on your next cycle.",
              },
              {
                q: "Is this for SaaS only?",
                a: "Launchly works for SaaS, services, and product founders who need a clear growth system.",
              },
            ].map((item) => (
              <GlassCard key={item.q} variant="dark" className="border-white/10">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{item.q}</h3>
                  <p className="text-sm text-foreground/60">{item.a}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="section grid md:grid-cols-2 gap-6">
          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
                Security & Privacy
              </div>
              <h3 className="text-lg font-semibold">Secure by default</h3>
              <p className="text-sm text-foreground/60">
                Your data stays private. We use secure authentication and encrypted storage.
              </p>
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                Secure checkout and access controls.
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
                Trust
              </div>
              <h3 className="text-lg font-semibold">Built for founders shipping fast</h3>
              <p className="text-sm text-foreground/60">
                Launchly keeps your weekly decisions clear so you can move with confidence.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="section">
          <GlassCard variant="light" glow className="text-center border-neon-cyan/40">
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                Ready to build
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold">
                Start building your next launch today.
              </h2>
              <p className="text-base text-foreground/60 max-w-2xl mx-auto">
                A calm, premium system for your next launch.
              </p>
              <Link to="/signup" className="btn-neon inline-flex px-8 py-4 rounded-full">
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <FooterLinks />

      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="bg-[#111116] border border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle>Launchly Demo</DialogTitle>
            <DialogDescription className="text-foreground/60">
              A product walkthrough will be available soon. For now, reach out and
              we will send a private demo.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Link to="/contact" className="btn-neon w-full justify-center">
              Request demo access
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

