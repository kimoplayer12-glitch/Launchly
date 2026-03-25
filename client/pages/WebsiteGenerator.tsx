import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import FloatingCard from "@/components/FloatingCard";
import { CreditConfirmModal } from "@/components/CreditConfirmModal";
import { useCredits } from "@/hooks/use-credits";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { CREDIT_COSTS } from "@/lib/credits";
import { Globe, Plus, Copy, Eye, Code, Download, Zap, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type GenResp = {
  success: boolean;
  template: string;
  files: { path: string; content: string }[];
};

export default function WebsiteGenerator() {
  const navigate = useNavigate();
  const { credits, deductCredits, canAfford } = useCredits();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [processingCredits, setProcessingCredits] = useState(false);
  const [prompt, setPrompt] = useState("A futuristic fitness app for busy professionals");
  const [style, setStyle] = useState<"Modern" | "Futuristic" | "Minimal" | "Luxury">("Modern");
  const [brandName, setBrandName] = useState("Launchly Site");
  const [tagline, setTagline] = useState("Start faster. Grow smarter. Monetize everything.");
  const [primaryColor, setPrimaryColor] = useState("#00D9FF");
  const [accentColor, setAccentColor] = useState("#D946EF");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<GenResp | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
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

  const handleGenerateWebsite = async () => {
    if (!brandName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your brand name",
        variant: "destructive",
      });
      return;
    }

    if (!credits || !canAfford(CREDIT_COSTS.website_generation ?? 0)) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${CREDIT_COSTS.website_generation || 15} credits. Please upgrade your plan.`,
        variant: "destructive",
      });
      return;
    }

    setShowCreditModal(true);
  };

  const handleConfirmCredits = async () => {
    const creditCost = CREDIT_COSTS.website_generation || 15;
    setProcessingCredits(true);

    try {
      const success = await deductCredits(creditCost);
      if (success) {
        // Now generate the website
        await generateWebsite();
        setShowCreditModal(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process credits",
        variant: "destructive",
      });
    } finally {
      setProcessingCredits(false);
    }
  };

  const generateWebsite = async () => {
    setBusy(true);
    setProgressStep(0);
    try {
      // playful progress animation
      setProgressStep(1); // Writing content
      await new Promise((r) => setTimeout(r, 700));
      setProgressStep(2); // Designing layout
      await new Promise((r) => setTimeout(r, 800));
      setProgressStep(3); // Preparing preview

      const res = await fetch("/api/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, tagline, primaryColor, accentColor, style, prompt }),
      });
      const data = (await res.json()) as GenResp & { siteId?: string; previewUrl?: string };
      if (!res.ok || !data.success) throw data;
      setOut({ success: true, template: '', files: data.files });
      setSiteId(data.siteId || null);
      setPreviewUrl(data.previewUrl || `/preview/${data.siteId}/index.html`);

      toast({ title: 'Website ready!', description: 'Preview is ready below' });
      setProgressStep(4);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.error || 'Failed to generate website template', variant: 'destructive' });
    } finally {
      setBusy(false);
      setTimeout(() => setProgressStep(0), 800);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "File content copied to clipboard",
    });
  };

  const templates = [
    { name: "Landing", emoji: "🚀", features: "Hero, CTA, testimonials" },
    { name: "Portfolio", emoji: "🎨", features: "Projects, about, contact" },
    { name: "SaaS", emoji: "⚙️", features: "Features, pricing, blog" },
    { name: "E-commerce", emoji: "🛍️", features: "Products, cart, checkout" },
  ];

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-neon-cyan" />
            <h1 className="text-4xl font-bold">Website Generator</h1>
          </div>
          <p className="text-foreground/60">
            Create a professional website in minutes with AI. No coding required.
          </p>
        </div>

        {/* Generator Form */}
        <FloatingCard delay={0}>
          <GlassCard variant="light" className="border-neon-cyan/50 p-8 mb-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Describe your business</h2>

              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your business... e.g. A futuristic fitness app for busy professionals"
                  className="w-full p-4 rounded-xl bg-black/20 text-lg min-h-[120px]"
                />
              </div>

              <div className="flex gap-3 items-center">
                <label className="text-sm font-medium text-foreground/80">Style</label>
                <div className="flex gap-2">
                  {['Modern','Futuristic','Minimal','Luxury'].map((s) => (
                    <button key={s} onClick={() => setStyle(s as any)} className={`px-3 py-1 rounded ${style===s? 'bg-neon-cyan text-black':'bg-white/5'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Brand Name (optional)</label>
                  <input type="text" value={brandName} onChange={(e)=>setBrandName(e.target.value)} className="input-glass w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Tagline (optional)</label>
                  <input type="text" value={tagline} onChange={(e)=>setTagline(e.target.value)} className="input-glass w-full" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={async () => {
                    const cost = CREDIT_COSTS.website_generation ?? 0;
                    if (cost === 0) { await generateWebsite(); return; }
                    handleGenerateWebsite();
                  }}
                  disabled={busy}
                  className="btn-neon flex-1 py-3 rounded-lg inline-flex items-center justify-center gap-2 font-medium">
                  {busy ? '🚀 Building your website...' : '✨ Generate My Website'}
                </button>
                <button onClick={() => { setBrandName(''); setTagline(''); setPrompt(''); setPreviewUrl(null); setOut(null); }} className="btn-glass px-4">Reset</button>
              </div>

              {/* Progress */}
              {progressStep > 0 && (
                <div className="mt-4 text-sm text-foreground/70">
                  <div>{progressStep >= 1 ? '✔️ Writing content...' : 'Writing content...'}</div>
                  <div>{progressStep >= 2 ? '✔️ Designing layout...' : 'Designing layout...'}</div>
                  <div>{progressStep >= 3 ? '✔️ Preparing preview...' : 'Preparing preview...'}</div>
                </div>
              )}

            </div>
          </GlassCard>
        </FloatingCard>

        {/* Preview Section */}
        {previewUrl && (
          <FloatingCard delay={150}>
            <GlassCard variant="dark" className="border-neon-cyan/50 p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-neon-cyan" />
                  <div>
                    <div className="font-semibold">Preview</div>
                    <div className="text-xs text-foreground/60">Your generated site (draft)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.open(previewUrl, '_blank')} className="btn-glass px-3">🌍 Open in new tab</button>
                  <button onClick={() => { setOut(null); generateWebsite(); }} className="btn-glass px-3">🔁 Regenerate</button>
                  <button onClick={async () => {
                    if (!siteId) return toast({ title: 'No site', description: 'Generate the site first', variant: 'destructive' });
                    toast({ title: 'Publishing', description: 'Deploying to Vercel...' });
                    const res = await fetch(`/api/websites/${siteId}/publish`, { method: 'POST' });
                    const data = await res.json();
                    if (res.ok && data.success && data.url) {
                      toast({ title: 'Your site is live!', description: data.url });
                      window.open(data.url, '_blank');
                    } else {
                      toast({ title: 'Deploy Failed', description: data.error || 'Check server logs', variant: 'destructive' });
                    }
                  }} className="btn-neon px-4">🚀 Publish</button>
                  <button onClick={() => setShowCode((s)=>!s)} className="btn-glass px-3">{showCode? 'Hide Code':'View Code'}</button>
                </div>
              </div>

              <div style={{height: '640px'}} className="bg-black/10">
                <iframe title="site-preview" src={previewUrl} className="w-full h-full border-0" />
              </div>
            </GlassCard>
          </FloatingCard>
        )}

        {/* Code Viewer / Download */}
        {showCode && out && (
          <FloatingCard delay={250}>
            <GlassCard variant="dark" className="border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Files</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!siteId) return toast({ title: 'No site', description: 'Generate first', variant: 'destructive' });
                      const a = document.createElement('a');
                      a.href = `/api/websites/${siteId}/download`;
                      a.download = `${siteId}.tar.gz`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                    className="btn-glass px-3"
                  >
                    <Download className="w-4 h-4" /> Download ZIP
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {out.files.map((file) => (
                    <div key={file.path} className="p-3 rounded bg-black/20 border border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm text-neon-cyan">{file.path}</div>
                        <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(file.content)} className="btn-glass px-2">Copy</button>
                        </div>
                      </div>
                      <pre className="mt-2 max-h-56 overflow-auto text-xs bg-black/30 p-3 rounded">{file.content}</pre>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm text-foreground/70 mb-2">Preview URL</div>
                  <div className="p-3 rounded bg-black/20 border border-white/5">
                    <div className="break-words text-sm"><a className="text-neon-cyan" href={previewUrl || '#'} target="_blank" rel="noreferrer">{previewUrl}</a></div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </FloatingCard>
        )}

        {/* Templates */}
        <FloatingCard delay={100}>
          <GlassCard variant="dark" className="border-white/10 p-8 mb-12">
            <h3 className="text-xl font-bold mb-6">Website Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {templates.map((template, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-all text-center">
                  <div className="text-3xl mb-2">{template.emoji}</div>
                  <p className="font-semibold text-foreground text-sm">{template.name}</p>
                  <p className="text-xs text-foreground/60 mt-1">{template.features}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </FloatingCard>

        {/* Generated Output */}
        {out && (
          <FloatingCard delay={200}>
            <GlassCard variant="dark" className="border-neon-cyan/50 p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Generated Files</h3>
                  <p className="text-sm text-foreground/60">
                    Copy these files into a new folder and deploy to Vercel, Netlify, or your preferred host.
                  </p>
                </div>

                <div className="space-y-4">
                  {out.files.map((file) => (
                    <div key={file.path} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-sm font-semibold text-neon-cyan">{file.path}</p>
                        <button
                          onClick={() => copyToClipboard(file.content)}
                          className="btn-glass text-xs py-1 px-2 rounded inline-flex items-center gap-1 hover:glow-cyan"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-relaxed">
                        {file.content}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </FloatingCard>
        )}

        {/* Credit Modal */}
        {credits && (
          <CreditConfirmModal
            isOpen={showCreditModal}
            creditsNeeded={CREDIT_COSTS.website_generation ?? 0}
            creditsAvailable={credits.currentCredits}
            actionName="Generate Website"
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

