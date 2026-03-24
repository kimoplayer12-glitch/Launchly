import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import FloatingCard from "@/components/FloatingCard";
import { useCredits } from "@/hooks/use-credits";
import FooterLinks from "@/components/FooterLinks";
import { usePaddle } from "@/hooks/use-paddle";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { PRICING_TIERS } from "@/lib/credits";
import { Zap, TrendingUp, Check, Loader, Gift } from "lucide-react";
import { addUserCredits } from "@/lib/firebase-database";

// Credit packages - update these with your actual Paddle price IDs
const CREDIT_PACKAGES = [
  {
    id: "price_starter_credits",
    name: "Starter Pack",
    credits: 100,
    price: "$19",
    description: "Perfect for getting started",
  },
  {
    id: "price_pro_credits",
    name: "Pro Pack",
    credits: 500,
    price: "$79",
    description: "Most popular choice",
    popular: true,
  },
  {
    id: "price_enterprise_credits",
    name: "Enterprise Pack",
    credits: 2000,
    price: "$249",
    description: "For power users",
  },
];

const SUBSCRIPTIONS = [
  {
    id: "price_starter_monthly",
    name: "Starter",
    price: "$29",
    billing: "month",
    credits: 1000,
    features: [
      "1,000 credits/month",
      "Business Dashboard",
      "Basic Analytics",
      "Email support",
    ],
  },
  {
    id: "price_pro_monthly",
    name: "Pro",
    price: "$99",
    billing: "month",
    credits: 5000,
    features: [
      "5,000 credits/month",
      "Advanced Analytics",
      "Team Collaboration",
      "Priority support",
      "API Access",
    ],
    popular: true,
  },
  {
    id: "price_enterprise_monthly",
    name: "Enterprise",
    price: "Custom",
    billing: "contact us",
    credits: "Unlimited",
    features: [
      "Unlimited credits",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

export default function Credits() {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const { checkout, isLoading: paddleLoading, isAvailable } = usePaddle();
  const { isAuthenticated, loading, user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<"topup" | "subscriptions">("topup");
  const [processing, setProcessing] = useState<string | null>(null);
  const [addingTestCredits, setAddingTestCredits] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  const handleAddTestCredits = async () => {
    if (!user) return;
    setAddingTestCredits(true);
    try {
      await addUserCredits(user.uid, 1000);
      alert("✅ 1000 test credits added!");
    } catch (error) {
      console.error("Error adding test credits:", error);
      alert("❌ Failed to add test credits");
    } finally {
      setAddingTestCredits(false);
    }
  };


  const handlePurchase = async (priceId: string) => {
    setProcessing(priceId);
    try {
      await checkout(priceId);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to open checkout. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading || !credits) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-neon-cyan border-t-transparent mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  const tier = PRICING_TIERS[credits.tier];
  const usagePercentage = (credits.dailyUsedToday / credits.dailyLimit) * 100;

  if (!isAvailable) {
    return (
      <div className="page-shell">
        <div className="max-w-2xl mx-auto">
          <GlassCard variant="dark" className="border-yellow-500/20">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold">Paddle Not Configured</h2>
              <p className="text-foreground/60">
                Please configure your Paddle Vendor ID to enable payments
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-left">
                <p className="font-mono">
                  VITE_PADDLE_VENDOR_ID=your_vendor_id
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="text-4xl font-bold mb-2">Credits & Billing</h1>
          <p className="text-foreground/60">
            Manage your account credits and upgrade your plan
          </p>
        </div>

        {/* Current Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FloatingCard delay={0}>
            <GlassCard variant="dark" className="border-white/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground/60 text-sm">Current Credits</p>
                  <Zap className="w-5 h-5 text-neon-cyan" />
                </div>
                <p className="text-3xl font-bold">{credits.currentCredits}</p>
                <div className="text-xs text-foreground/60">
                  {credits.monthlyLimit} monthly limit
                </div>
              </div>
            </GlassCard>
          </FloatingCard>

          <FloatingCard delay={100}>
            <GlassCard variant="dark" className="border-white/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground/60 text-sm">Today's Usage</p>
                  <TrendingUp className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{credits.dailyUsedToday}</p>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-neon-cyan to-neon-blue h-full rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-foreground/60">
                    {credits.dailyLimit - credits.dailyUsedToday} left today
                  </p>
                </div>
              </div>
            </GlassCard>
          </FloatingCard>

          <FloatingCard delay={200}>
            <GlassCard variant="dark" className="border-white/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground/60 text-sm">Current Plan</p>
                  <div className="text-xs bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full font-medium">
                    {tier.name}
                  </div>
                </div>
                <p className="text-2xl font-bold capitalize">{credits.tier}</p>
                <p className="text-xs text-foreground/60">
                  Renews{" "}
                  {new Date(credits.renewalDate).toLocaleDateString()}
                </p>
              </div>
            </GlassCard>
          </FloatingCard>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 items-center">
          <button
            onClick={() => setActiveTab("topup")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "topup"
                ? "btn-neon"
                : "btn-glass text-foreground/70 hover:text-foreground"
            }`}
          >
            Top Up Credits
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "subscriptions"
                ? "btn-neon"
                : "btn-glass text-foreground/70 hover:text-foreground"
            }`}
          >
            Subscriptions
          </button>

          {/* Test Button (Development) */}
          <button
            onClick={handleAddTestCredits}
            disabled={addingTestCredits}
            className="ml-auto btn-glass px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 hover:glow-green transition-all disabled:opacity-50"
          >
            <Gift className="w-4 h-4" />
            {addingTestCredits ? "Adding..." : "Add 1000 Test Credits"}
          </button>
        </div>

        {/* Top Up Credits */}
        {activeTab === "topup" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {CREDIT_PACKAGES.map((pkg, i) => (
                <FloatingCard key={pkg.id} delay={i * 100}>
                  <GlassCard
                    variant="dark"
                    className={`border-white/10 space-y-6 ${
                      pkg.id === "price_pro_credits" ? "border-neon-cyan/50" : ""
                    }`}
                  >
                    <div>
                      <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                      <p className="text-foreground/60 text-sm">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-4xl font-bold">{pkg.credits}</p>
                      <p className="text-foreground/60 text-sm">credits</p>
                    </div>

                    <div className="text-3xl font-bold text-neon-cyan">
                      {pkg.price}
                    </div>

                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={processing === pkg.id || paddleLoading}
                      className="w-full btn-neon py-3 rounded-lg disabled:opacity-50"
                    >
                      {processing === pkg.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        "Purchase Now"
                      )}
                    </button>
                  </GlassCard>
                </FloatingCard>
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {SUBSCRIPTIONS.map((sub, i) => (
                <FloatingCard key={sub.id} delay={i * 100}>
                  <GlassCard
                    variant="dark"
                    className={`border-white/10 space-y-6 relative ${
                      sub.popular ? "border-neon-cyan/50 lg:scale-105" : ""
                    }`}
                  >
                    {sub.popular && (
                      <div className="absolute top-4 right-4 bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </div>
                    )}

                    <div>
                      <h3 className="text-2xl font-bold mb-2">{sub.name}</h3>
                      <div className="text-4xl font-bold text-neon-cyan">
                        {sub.price}
                      </div>
                      <p className="text-foreground/60 text-sm mt-1">
                        per {sub.billing}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-foreground/60 text-sm">
                        {sub.credits === "Unlimited"
                          ? "Unlimited"
                          : `${sub.credits.toLocaleString()} credits`}
                        {sub.billing === "month" && " per month"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {sub.features.map((feature, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePurchase(sub.id)}
                      disabled={
                        processing === sub.id ||
                        paddleLoading ||
                        sub.billing === "contact us"
                      }
                      className={`w-full py-3 rounded-lg disabled:opacity-50 ${
                        sub.popular ? "btn-neon" : "btn-glass"
                      }`}
                    >
                      {sub.billing === "contact us" ? (
                        "Contact Sales"
                      ) : processing === sub.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        "Subscribe Now"
                      )}
                    </button>
                  </GlassCard>
                </FloatingCard>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard variant="dark" className="border-white/10 space-y-3">
              <h3 className="font-bold">Do my credits expire?</h3>
              <p className="text-foreground/70 text-sm">
                No, your credits never expire. One-time purchases are yours
                forever.
              </p>
            </GlassCard>

            <GlassCard variant="dark" className="border-white/10 space-y-3">
              <h3 className="font-bold">Can I refund my purchase?</h3>
              <p className="text-foreground/70 text-sm">
                Yes! We offer 30-day money-back guarantee on all purchases.
              </p>
            </GlassCard>

            <GlassCard variant="dark" className="border-white/10 space-y-3">
              <h3 className="font-bold">Do subscriptions renew?</h3>
              <p className="text-foreground/70 text-sm">
                Yes, subscriptions auto-renew monthly. Cancel anytime from your
                account settings.
              </p>
            </GlassCard>

            <GlassCard variant="dark" className="border-white/10 space-y-3">
              <h3 className="font-bold">How do credits work?</h3>
              <p className="text-foreground/70 text-sm">
                Each action (plan, post, campaign) costs a certain amount of
                credits based on complexity.
              </p>
            </GlassCard>
          </div>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}

