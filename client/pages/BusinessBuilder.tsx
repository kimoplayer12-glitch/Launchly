import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BusinessPlanChat from "@/components/BusinessPlanChat";
import FooterLinks from "@/components/FooterLinks";
import GlassCard from "@/components/GlassCard";
import { useCredits } from "@/hooks/use-credits";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { CREDIT_COSTS } from "@/lib/credits";
import { Sparkles, Building2, ArrowRight, Zap, Target, BarChart3, Users, Briefcase } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function BusinessBuilder() {
  const navigate = useNavigate();
  const { credits, deductCredits, canAfford } = useCredits();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [showChat, setShowChat] = useState(false);
  const [processingCredits, setProcessingCredits] = useState(false);

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

  const handleStartChat = async () => {
    const creditCost = CREDIT_COSTS["full_plan"] ?? 0;

    // If cost is 0, allow free access
    if (creditCost === 0) {
      setShowChat(true);
      toast({
        title: "Ready to Plan!",
        description: "Start chatting with your AI business advisor",
      });
      return;
    }

    // Only check credits if there's a cost
    if (!credits) {
      toast({
        title: "Loading Credits",
        description: "Please wait while we load your credit information",
        variant: "default",
      });
      return;
    }

    if (!canAfford(creditCost)) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditCost} credits but only have ${credits.currentCredits}. Upgrade your plan or buy credits.`,
        variant: "destructive",
      });
      return;
    }

    setProcessingCredits(true);
    try {
      const success = await deductCredits(creditCost);
      if (success) {
        setShowChat(true);
        toast({
          title: "Ready to Plan!",
          description: "Start chatting with your AI business advisor",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    } finally {
      setProcessingCredits(false);
    }
  };

  // Show chat interface
  if (showChat) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-neon-cyan" />
              <div>
                <h1 className="text-xl font-bold">Business Plan Builder</h1>
                <p className="text-sm text-foreground/60">Chat with your AI business advisor</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-foreground/60 hover:text-foreground transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex flex-col">
          <BusinessPlanChat plan="" businessName="" />
        </div>

        <FooterLinks />
      </div>
    );
  }

  // Main page - Call to action
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-12">
        <div className="max-w-6xl w-full mx-auto space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-6 pt-12">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/50 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3 max-w-3xl mx-auto">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                Build Your Business Plan
              </h1>
              <p className="text-xl text-foreground/70">
                Create a winning business strategy in minutes with AI-powered guidance. Your personal business advisor is ready to help.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 pt-4">
              {[
                { icon: Zap, title: "Quick & Easy", desc: "Generate plans in minutes, not weeks" },
                { icon: BarChart3, title: "Data-Driven", desc: "Market insights & financial projections" },
                { icon: Users, title: "Expert Guidance", desc: "AI advisor with 100+ business models" },
              ].map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <GlassCard key={i} variant="dark" className="border-white/10">
                    <div className="space-y-3">
                      <Icon className="w-8 h-8 text-neon-cyan" />
                      <div>
                        <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                        <p className="text-sm text-foreground/60">{benefit.desc}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="pt-8 space-y-3">
              <button
                onClick={handleStartChat}
                disabled={processingCredits}
                className="mx-auto block btn-neon px-10 py-4 rounded-xl inline-flex items-center justify-center gap-2 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-cyan/50 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                {processingCredits ? "Starting..." : `Start Building (${CREDIT_COSTS["full_plan"] ?? 0} credits)`}
              </button>
              {credits && (
                <p className="text-sm text-foreground/60">
                  You have <span className="font-semibold text-neon-cyan">{credits.currentCredits}</span> credits available
                </p>
              )}
            </div>
          </div>

          {/* Plan Templates Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Choose Your Business Type</h2>
              <p className="text-foreground/60 mt-2">Get tailored advice based on your industry</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: "🚀", name: "SaaS", desc: "Software as a Service" },
                { icon: "🛒", name: "E-commerce", desc: "Online store" },
                { icon: "💡", name: "Consulting", desc: "Professional services" },
                { icon: "📱", name: "App", desc: "Mobile/Web application" },
              ].map((template, i) => (
                <button
                  key={i}
                  onClick={handleStartChat}
                  disabled={processingCredits}
                  className="p-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan/50 transition-all group"
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <h3 className="font-semibold text-foreground group-hover:text-neon-cyan transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-foreground/60 mt-1">{template.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* What You Get Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <GlassCard variant="dark" className="border-white/10">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-neon-cyan" />
                  What's Included
                </h3>
                <ul className="space-y-3">
                  {[
                    "Executive Summary",
                    "Market Analysis & Opportunity",
                    "Business Model & Revenue Streams",
                    "Go-to-Market Strategy",
                    "Financial Projections (5 years)",
                    "Team & Resource Requirements",
                    "Risk Assessment & Mitigation",
                    "Appendix & Supporting Materials",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/80">
                      <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            <GlassCard variant="dark" className="border-white/10">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Target className="w-6 h-6 text-neon-purple" />
                  Chat Features
                </h3>
                <ul className="space-y-3">
                  {[
                    "Ask follow-up questions",
                    "Refine strategies in real-time",
                    "Get market insights & trends",
                    "Review financial projections",
                    "Explore alternative approaches",
                    "Export your complete plan",
                    "Save for later review",
                    "Iterate and improve",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/80">
                      <div className="w-2 h-2 rounded-full bg-neon-purple"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          </div>

          {/* FAQ Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Frequently Asked</h2>
              <p className="text-foreground/60 mt-2">Everything you need to know</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  q: "How long does it take to create a plan?",
                  a: "Most plans take 15-30 minutes depending on complexity. You can take breaks and continue later.",
                },
                {
                  q: "Can I edit my plan after creation?",
                  a: "Yes! Chat with the advisor to refine any section. Changes are saved automatically.",
                },
                {
                  q: "What if I need help with a specific section?",
                  a: "Just ask the AI advisor. They can deep-dive into any part of your plan.",
                },
                {
                  q: "Can I export my business plan?",
                  a: "Yes, export as PDF, Word, or keep it in our editor for easy updates.",
                },
              ].map((item, i) => (
                <GlassCard key={i} variant="dark" className="border-white/10">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground/90">{item.q}</h4>
                    <p className="text-sm text-foreground/60">{item.a}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center space-y-4 py-8 border-t border-white/10">
            <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
            <p className="text-foreground/70">Transform your business idea into a winning strategy</p>
            <button
              onClick={handleStartChat}
              disabled={processingCredits}
              className="mx-auto block btn-neon px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-cyan/50 transition-all disabled:opacity-50"
            >
              Create Your Plan Now
            </button>
          </div>
        </div>
      </div>

      <FooterLinks />
    </div>
  );
}


