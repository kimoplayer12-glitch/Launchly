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

interface BrandResults {
brandGuidelines: {
brandVoice: string;
missionStatement: string;
coreValues: string[];
brandPromise: string;
};
visualIdentity: {
primaryColor: string;
secondaryColor: string;
accentColor: string;
typography: string;
logoStyle: string;
};
contentStrategy: {
channels: string[];
contentPillars: string[];
postingFrequency: string;
bestTimes: string;
};
messaging: {
headline: string;
subheadline: string;
keyMessages: string[];
};
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
const [results, setResults] = useState<BrandResults | null>(null);

useEffect(() => {
if (!loading && !isAuthenticated) navigate("/login");
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
toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
return;
}

setGenerating(true);
try {
  const prompt = `You are an expert brand strategist. Create a comprehensive brand strategy for this business:

Business Name: ${brandData.businessName}
Tagline: ${brandData.tagline || "Not provided"}
Industry: ${brandData.industry}
Target Audience: ${brandData.targetAudience}
Brand Tone: ${brandData.tone}
Primary Color: ${brandData.brandColor}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
"brandGuidelines": {
"brandVoice": "2-3 sentence description of the brand voice",
"missionStatement": "1 sentence mission statement",
"coreValues": ["value1", "value2", "value3", "value4", "value5"],
"brandPromise": "1 sentence brand promise"
},
"visualIdentity": {
"primaryColor": "${brandData.brandColor}",
"secondaryColor": "hex color that complements primary",
"accentColor": "hex accent color",
"typography": "font pairing recommendation",
"logoStyle": "logo style description"
},
"contentStrategy": {
"channels": ["channel1", "channel2", "channel3", "channel4"],
"contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4"],
"postingFrequency": "recommended posting frequency",
"bestTimes": "best times to post"
},
"messaging": {
"headline": "compelling main headline",
"subheadline": "supporting subheadline",
"keyMessages": ["message1", "message2", "message3", "message4"]
}
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "AI generation failed");

  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  setResults(parsed);
  setStep(3);
  toast({ title: "Brand Strategy Generated!", description: "Your personalized brand strategy is ready." });
} catch (error) {
  toast({ title: "Generation Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
} finally {
  setGenerating(false);
}

};

return (
<div className="min-h-screen bg-background">
{/* Background */}
<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
<div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl"></div>
</div>

  {/* Header */}
  <div className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-cyan flex items-center justify-center">
          <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h1 className="text-lg sm:text-2xl font-bold">Brand Starter</h1>
      </div>
      <button onClick={() => navigate("/dashboard")} className="text-foreground/60 hover:text-foreground transition-colors text-xl">✕</button>
    </div>
  </div>

  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
    {step === 1 && (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-bold">Create Your Brand Identity</h2>
          <p className="text-foreground/70 text-sm sm:text-lg">Tell us about your business and we'll generate a comprehensive brand strategy</p>
        </div>

        <div className="grid gap-4">
          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2"><Type className="w-4 h-4 text-neon-cyan" />Business Name *</label>
              <input type="text" value={brandData.businessName} onChange={(e) => handleInputChange("businessName", e.target.value)} placeholder="e.g., TechVenture Labs" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all" />
            </div>
          </GlassCard>

          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-neon-cyan" />Tagline (Optional)</label>
              <input type="text" value={brandData.tagline} onChange={(e) => handleInputChange("tagline", e.target.value)} placeholder="e.g., Innovate. Build. Scale." className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all" />
            </div>
          </GlassCard>

          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2"><Layout className="w-4 h-4 text-neon-cyan" />Industry *</label>
              <select value={brandData.industry} onChange={(e) => handleInputChange("industry", e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-neon-cyan/50 transition-all">
                <option value="">Select an industry</option>
                {["SaaS", "E-commerce", "Fintech", "Healthcare", "Education", "Marketing", "Consulting", "Other"].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </GlassCard>

          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-neon-cyan" />Target Audience *</label>
              <input type="text" value={brandData.targetAudience} onChange={(e) => handleInputChange("targetAudience", e.target.value)} placeholder="e.g., Startup founders aged 25-45" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all" />
            </div>
          </GlassCard>

          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <label className="text-sm font-semibold">Brand Tone</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["professional", "casual", "playful", "inspiring"].map((tone) => (
                  <button key={tone} onClick={() => handleInputChange("tone", tone)} className={`px-4 py-3 rounded-lg font-medium transition-all capitalize text-sm ${brandData.tone === tone ? "bg-neon-cyan/30 border-neon-cyan/50 border-2" : "bg-white/10 border border-white/20 hover:border-white/40"}`}>{tone}</button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark" className="border-white/10">
            <div className="space-y-3">
              <label className="text-sm font-semibold">Primary Brand Color</label>
              <div className="flex gap-4 items-center">
                <input type="color" value={brandData.brandColor} onChange={(e) => handleInputChange("brandColor", e.target.value)} className="w-14 h-14 rounded-lg cursor-pointer border-0" />
                <input type="text" value={brandData.brandColor} onChange={(e) => handleInputChange("brandColor", e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:border-neon-cyan/50" />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="flex gap-3 sm:gap-4 pt-4">
          <button onClick={() => navigate("/dashboard")} className="flex-1 btn-glass px-6 py-3 rounded-lg font-semibold">Cancel</button>
          <button onClick={handleGenerateBrand} disabled={generating} className="flex-1 btn-neon px-6 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {generating ? (
              <><div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />Generating...</>
            ) : (
              <>Generate Brand Strategy<ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    )}

    {step === 3 && results && (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-bold">Your Brand Strategy</h2>
          <p className="text-foreground/70 text-sm sm:text-base">AI-generated brand guidelines for {brandData.businessName}</p>
        </div>

        <GlassCard variant="light" className="border-neon-cyan/50">
          <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan" />Brand Guidelines</h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">Brand Voice</p>
              <p className="font-medium text-sm sm:text-base">{results.brandGuidelines.brandVoice}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">Mission Statement</p>
              <p className="font-medium text-sm sm:text-base">{results.brandGuidelines.missionStatement}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">Brand Promise</p>
              <p className="font-medium text-sm sm:text-base">{results.brandGuidelines.brandPromise}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">Core Values</p>
              <div className="flex flex-wrap gap-2">
                {results.brandGuidelines.coreValues.map((value) => (
                  <span key={value} className="px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs sm:text-sm font-medium">{value}</span>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 sm:w-6 sm:h-6 text-neon-purple" />Messaging</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Headline</p>
              <p className="text-lg sm:text-xl font-bold">{results.messaging.headline}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Subheadline</p>
              <p className="font-medium text-sm sm:text-base">{results.messaging.subheadline}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-2">Key Messages</p>
              <ul className="space-y-2">
                {results.messaging.keyMessages.map((msg, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="text-neon-cyan mt-1">•</span>{msg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold mb-4">Visual Identity</h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-foreground/60 mb-2">Color Palette</p>
              <div className="flex gap-3">
                {[results.visualIdentity.primaryColor, results.visualIdentity.secondaryColor, results.visualIdentity.accentColor].map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg border-2 border-white/20" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-mono text-foreground/60">{color}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Typography</p>
              <p className="font-medium text-sm">{results.visualIdentity.typography}</p>
              <p className="text-sm text-foreground/60 mt-2 mb-1">Logo Style</p>
              <p className="font-medium text-sm">{results.visualIdentity.logoStyle}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold mb-4">Content Strategy</h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-foreground/60 mb-2">Best Channels</p>
              <div className="flex flex-wrap gap-2">
                {results.contentStrategy.channels.map((channel) => (
                  <span key={channel} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs sm:text-sm">{channel}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-2">Content Pillars</p>
              <ul className="space-y-1">
                {results.contentStrategy.contentPillars.map((pillar) => (
                  <li key={pillar} className="text-sm flex items-center gap-2"><span className="text-neon-cyan">•</span>{pillar}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Posting Frequency</p>
              <p className="font-medium text-sm">{results.contentStrategy.postingFrequency}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Best Times</p>
              <p className="font-medium text-sm">{results.contentStrategy.bestTimes}</p>
            </div>
          </div>
        </GlassCard>

        <div className="flex gap-3 sm:gap-4 pt-4">
          <button onClick={() => { setStep(1); setResults(null); }} className="flex-1 btn-glass px-6 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />New Brand
          </button>
          <button onClick={() => navigate("/dashboard")} className="flex-1 btn-neon px-6 py-3 rounded-lg font-semibold">Go to Dashboard</button>
        </div>
      </div>
    )}
  </div>
  <FooterLinks />
</div>

);
}
