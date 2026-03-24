import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import FloatingCard from "@/components/FloatingCard";
import { CreditConfirmModal } from "@/components/CreditConfirmModal";
import FooterLinks from "@/components/FooterLinks";
import { useCredits } from "@/hooks/use-credits";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { CREDIT_COSTS } from "@/lib/credits";
import { Sparkles, Plus, Copy, Trash2, RefreshCw, Zap, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function AdGen() {
  const navigate = useNavigate();
  const { credits, deductCredits, canAfford } = useCredits();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState("ad_creative_1");
  const [processingCredits, setProcessingCredits] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Redirect unauthenticated users AFTER auth state resolves
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const handleGenerateAdClick = () => {
    if (!credits) return;

    const creditCost = CREDIT_COSTS[selectedAdType] || 3;

    if (!canAfford(creditCost)) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditCost} credits but only have ${credits.currentCredits}. Upgrade your plan or buy credits.`,
        variant: "destructive",
      });
      return;
    }

    setShowCreditModal(true);
  };

  const handleConfirmCredits = async () => {
    const creditCost = CREDIT_COSTS[selectedAdType] || 3;
    setProcessingCredits(true);

    try {
      const success = await deductCredits(creditCost);
      if (success) {
        toast({
          title: "Credits Deducted",
          description: `${creditCost} credits used. Generating ads with AI...`,
        });
        setShowCreditModal(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deducting credits",
        variant: "destructive",
      });
    } finally {
      setProcessingCredits(false);
    }
  };

  const handleTemplateSelect = (name: string) => {
    setSelectedStyle(name);
    toast({
      title: "Template selected",
      description: `${name} style selected.`,
    });
  };

  const handleQuickAction = (label: string) => {
    if (label === "Generate Variations") {
      handleGenerateAdClick();
      return;
    }
    toast({
      title: "Action queued",
      description: `${label} is ready to run once generation completes.`,
    });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Ad copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const generatedAds = [
    {
      id: 1,
      title: "Limited Time Offer",
      text: "Get 50% off on our premium plan. Join 10K+ founders using Launchly today.",
      image: "📱",
      status: "published",
      ctr: "4.2%",
      roi: "3.8x",
    },
    {
      id: 2,
      title: "Product Launch",
      text: "We just launched our new AdGen feature. Create professional ads in seconds with AI.",
      image: "🚀",
      status: "published",
      ctr: "5.1%",
      roi: "4.2x",
    },
    {
      id: 3,
      title: "Community Feature",
      text: "Join our community of 10K+ founders building the future. Share ideas and grow together.",
      image: "👥",
      status: "draft",
      ctr: "-",
      roi: "-",
    },
    {
      id: 4,
      title: "Free Trial",
      text: "Try Launchly free for 14 days. No credit card required. Start your journey today.",
      image: "✨",
      status: "draft",
      ctr: "-",
      roi: "-",
    },
  ];

  const adStyles = [
    { name: "Modern Minimalist", emoji: "🎨", desc: "Clean and contemporary" },
    { name: "Bold & Vibrant", emoji: "🌈", desc: "Eye-catching and energetic" },
    { name: "Professional", emoji: "💼", desc: "Corporate and trustworthy" },
    { name: "Playful", emoji: "😄", desc: "Fun and approachable" },
  ];

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">AdGen AI</h1>
            <p className="text-foreground/60">
              Generate professional ads instantly with AI. Create, optimize, and publish
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Zap, label: "Ads Generated", value: "23", color: "neon-cyan" },
            { icon: TrendingUp, label: "Avg CTR", value: "4.7%", color: "neon-purple" },
            { icon: DollarSign, label: "Avg ROI", value: "4.0x", color: "neon-cyan" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <FloatingCard key={i} delay={i * 100}>
                <GlassCard variant="dark" className="border-white/10">
                  <div className="flex items-center gap-4">
                    <Icon className="w-8 h-8 text-neon-cyan opacity-70" />
                    <div>
                      <p className="text-foreground/60 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </GlassCard>
              </FloatingCard>
            );
          })}
        </div>

        {/* Generate New Ad */}
        <FloatingCard delay={0} className="mb-12">
          <GlassCard variant="light" className="border-neon-cyan/50 p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-neon-cyan" />
                <h2 className="text-2xl font-bold">Generate New Ad</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Product/Service
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SaaS product, coaching service..."
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Target Audience
                  </label>
                  <select className="input-glass w-full">
                    <option>Startup Founders</option>
                    <option>Small Business Owners</option>
                    <option>Marketing Professionals</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Ad Style
                  </label>
                  <select className="input-glass w-full">
                    <option>Modern Minimalist</option>
                    <option>Bold & Vibrant</option>
                    <option>Professional</option>
                    <option>Playful</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Primary CTA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Get Started, Learn More..."
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateAdClick}
                className="btn-neon w-full py-3 rounded-lg inline-flex items-center justify-center gap-2 font-medium"
              >
                <Sparkles className="w-4 h-4" /> Generate with AI {credits && `(${CREDIT_COSTS["ad_creative_1"]} credits)`}
              </button>
            </div>
          </GlassCard>
        </FloatingCard>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Ad Styles */}
          <div className="lg:col-span-2">
            <FloatingCard delay={100}>
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Ad Style Templates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {adStyles.map((style, i) => (
                      <button
                        key={i}
                        onClick={() => handleTemplateSelect(style.name)}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 transition-all duration-300 text-left group"
                      >
                        <div className="text-3xl mb-2">{style.emoji}</div>
                        <p className="font-semibold text-foreground group-hover:text-neon-cyan transition-colors">
                          {style.name}
                        </p>
                        <p className="text-xs text-foreground/60 mt-1">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </FloatingCard>
          </div>

          {/* Quick Actions */}
          <FloatingCard delay={200}>
            <GlassCard variant="dark" className="border-white/10 h-full">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Quick Actions</h3>
                <button
                  className="w-full btn-glass p-3 rounded-lg text-left hover:glow-cyan group text-sm"
                  onClick={() => handleQuickAction("Generate Variations")}
                >
                  <div className="font-semibold group-hover:text-neon-cyan transition-colors">
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Generate Variations
                  </div>
                  <div className="text-xs text-foreground/60 mt-1">Create multiple versions</div>
                </button>
                <button
                  className="w-full btn-glass p-3 rounded-lg text-left hover:glow-cyan group text-sm"
                  onClick={() => handleQuickAction("A/B Testing Setup")}
                >
                  <div className="font-semibold group-hover:text-neon-cyan transition-colors">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    A/B Testing Setup
                  </div>
                  <div className="text-xs text-foreground/60 mt-1">Compare performance</div>
                </button>
                <button
                  className="w-full btn-glass p-3 rounded-lg text-left hover:glow-cyan group text-sm"
                  onClick={() => handleQuickAction("Optimization Hints")}
                >
                  <div className="font-semibold group-hover:text-neon-cyan transition-colors">
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Optimization Hints
                  </div>
                  <div className="text-xs text-foreground/60 mt-1">Improve your ads</div>
                </button>
              </div>
            </GlassCard>
          </FloatingCard>
        </div>

        {/* Generated Ads */}
        <FloatingCard delay={300}>
          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Your Generated Ads</h3>
                <button
                  onClick={handleGenerateAdClick}
                  className="btn-neon px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> New Ad
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {generatedAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-lg border border-white/10 bg-white/5 overflow-hidden hover:border-neon-cyan/50 transition-all duration-300 group"
                  >
                    {/* Preview */}
                    <div className="bg-gradient-to-br from-white/5 to-white/2 p-4 border-b border-white/10">
                      <div className="text-4xl mb-3">{ad.image}</div>
                      <h4 className="font-bold mb-2">{ad.title}</h4>
                      <p className="text-xs text-foreground/70 leading-relaxed">{ad.text}</p>
                    </div>

                    {/* Stats */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/60">Status</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            ad.status === "published"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-foreground/10 text-foreground/60"
                          }`}
                        >
                          {ad.status}
                        </span>
                      </div>
                      {ad.status === "published" && (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground/60">CTR</span>
                            <span className="font-semibold">{ad.ctr}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground/60">ROI</span>
                            <span className="font-semibold text-green-400">{ad.roi}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="border-t border-white/10 p-3 flex gap-2">
                      <button
                        className="flex-1 btn-glass text-xs py-2 rounded hover:glow-cyan inline-flex items-center justify-center gap-1"
                        onClick={() => handleCopy(`${ad.title}\n${ad.text}`)}
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button
                        className="flex-1 btn-glass text-xs py-2 rounded hover:glow-cyan inline-flex items-center justify-center gap-1"
                        onClick={handleGenerateAdClick}
                      >
                        <RefreshCw className="w-3 h-3" /> Vary
                      </button>
                      <button
                        className="btn-glass text-xs py-2 px-3 rounded hover:glow-cyan"
                        onClick={() =>
                          toast({
                            title: "Delete ad",
                            description: "Ad deletion is coming soon.",
                          })
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </FloatingCard>

        {/* Credit Confirmation Modal */}
        {credits && (
          <CreditConfirmModal
            isOpen={showCreditModal}
            creditsNeeded={CREDIT_COSTS[selectedAdType] || 3}
            creditsAvailable={credits.currentCredits}
            actionName="Generate Ad Creative"
            onConfirm={handleConfirmCredits}
            onCancel={() => setShowCreditModal(false)}
            isProcessing={processingCredits}
          />
        )}
        <FooterLinks />
      </div>
    </div>
  );
}


