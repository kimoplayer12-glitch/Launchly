import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Sparkles, Palette, Type, Layout, Target, ArrowRight, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import FooterLinks from "@/components/FooterLinks";
import GlassCard from "@/components/GlassCard";

interface BrandData {
  businessName: string;
  tagline: string;
  industry: string;
  targetAudience: string;
  brandColor: string;
  tone: string;
}

export default function BrandStarter() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [brandData, setBrandData] = useState<BrandData>({
    businessName: "",
    tagline: "",
    industry: "",
    targetAudience: "",
    brandColor: "#00D9FF",
    tone: "professional",
  });
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
    window.scrollTo(0, 0);
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-neon-cyan border-t-transparent"></div>
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof BrandData, value: string) => {
    setBrandData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateBrand = async () => {
    if (!brandData.businessName || !brandData.industry || !brandData.targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Simulate brand generation
      const mockResults = {
          brandGuidelines: {
            brandVoice: `A ${brandData.tone} and authentic voice that resonates with ${brandData.targetAudience}. Communicate with clarity and confidence.`,
            missionStatement: `${brandData.businessName} empowers ${brandData.targetAudience} to achieve their goals through innovative solutions.`,
            coreValues: ["Innovation", "Integrity", "Customer-Centric", "Excellence", "Growth"],
            brandPromise: `We deliver exceptional value and unmatched service to ${brandData.targetAudience}.`,
          },
          visualIdentity: {
            primaryColor: brandData.brandColor,
            secondaryColor: "#9D4EDD",
            accentColor: "#3A86FF",
            typography: "Modern & Clean (Poppins, Inter)",
            logoStyle: "Minimalist geometric design",
          },
          contentStrategy: {
            channels: ["LinkedIn", "Twitter", "Blog", "YouTube"],
            contentPillars: [
              "Industry Insights",
              "Product Updates",
              "Customer Stories",
              "Educational Content"
            ],
            postingFrequency: "5x per week",
            bestTimes: "Tuesday-Thursday, 9 AM - 1 PM",
          },
          messaging: {
            headline: `${brandData.tagline || `Revolutionize ${brandData.industry}`}`,
            subheadline: `Designed for ${brandData.targetAudience} who demand excellence`,
            keyMessages: [
              `Transform your ${brandData.industry} workflow`,
              "Achieve measurable results",
              "Join industry leaders",
              "Scale with confidence",
            ],
          },
        };
        setResults(mockResults);
        setStep(3);
        toast({
          title: "Brand Strategy Generated!",
          description: "Your personalized brand strategy is ready",
        });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate brand strategy",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-cyan flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Brand Starter</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step 1: Brand Information */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold">Create Your Brand Identity</h2>
              <p className="text-foreground/70 text-lg">
                Tell us about your business and we'll generate a comprehensive brand strategy
              </p>
            </div>

            <div className="grid gap-6">
              {/* Business Name */}
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Type className="w-4 h-4 text-neon-cyan" />
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={brandData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="e.g., TechVenture Labs"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all"
                  />
                </div>
              </GlassCard>

              {/* Tagline */}
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neon-cyan" />
                    Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    value={brandData.tagline}
                    onChange={(e) => handleInputChange("tagline", e.target.value)}
                    placeholder="e.g., Innovate. Build. Scale."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all"
                  />
                </div>
              </GlassCard>

              {/* Industry */}
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layout className="w-4 h-4 text-neon-cyan" />
                    Industry *
                  </label>
                  <select
                    value={brandData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-neon-cyan/50 transition-all"
                  >
                    <option value="">Select an industry</option>
                    <option value="SaaS">SaaS</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </GlassCard>

              {/* Target Audience */}
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-neon-cyan" />
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    value={brandData.targetAudience}
                    onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                    placeholder="e.g., Startup founders aged 25-45"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all"
                  />
                </div>
              </GlassCard>

              {/* Brand Tone */}
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Brand Tone</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["professional", "casual", "playful", "inspiring"].map((tone) => (
                      <button
                        key={tone}
                        onClick={() => handleInputChange("tone", tone)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                          brandData.tone === tone
                            ? "bg-neon-cyan/30 border-neon-cyan/50 border-2"
                            : "bg-white/10 border border-white/20 hover:border-white/40"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Brand Color */}
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Primary Brand Color</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={brandData.brandColor}
                      onChange={(e) => handleInputChange("brandColor", e.target.value)}
                      className="w-16 h-16 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandData.brandColor}
                      onChange={(e) => handleInputChange("brandColor", e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 btn-glass px-6 py-3 rounded-lg font-semibold hover:glow-cyan transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateBrand}
                disabled={generating}
                className="flex-1 btn-neon px-6 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Brand Strategy"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold">Your Brand Strategy</h2>
              <p className="text-foreground/70">Customize and download your comprehensive brand guidelines</p>
            </div>

            {/* Brand Guidelines */}
            <GlassCard variant="light" className="border-neon-cyan/50">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-neon-cyan" />
                Brand Guidelines
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-foreground/60">Brand Voice</p>
                  <p className="font-medium">{results.brandGuidelines.brandVoice}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-foreground/60">Mission Statement</p>
                  <p className="font-medium">{results.brandGuidelines.missionStatement}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-foreground/60">Core Values</p>
                  <div className="flex flex-wrap gap-2">
                    {results.brandGuidelines.coreValues.map((value: string) => (
                      <span key={value} className="px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-sm font-medium">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Visual Identity */}
            <GlassCard variant="dark" className="border-white/10">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Palette className="w-6 h-6 text-neon-purple" />
                Visual Identity
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Primary Color</p>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-white/20"
                      style={{ backgroundColor: results.visualIdentity.primaryColor }}
                    ></div>
                    <span className="font-mono">{results.visualIdentity.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Typography</p>
                  <p className="font-medium">{results.visualIdentity.typography}</p>
                </div>
              </div>
            </GlassCard>

            {/* Content Strategy */}
            <GlassCard variant="dark" className="border-white/10">
              <h3 className="text-2xl font-bold mb-6">Content Strategy</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Best Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {results.contentStrategy.channels.map((channel: string) => (
                      <span key={channel} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Posting Frequency</p>
                  <p className="font-medium">{results.contentStrategy.postingFrequency}</p>
                </div>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8">
              <button
                onClick={() => {
                  setStep(1);
                  setResults(null);
                }}
                className="flex-1 btn-glass px-6 py-3 rounded-lg font-semibold hover:glow-cyan transition-all inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Another
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 btn-neon px-6 py-3 rounded-lg font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <FooterLinks />
    </div>
  );
}


