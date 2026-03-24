import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import FloatingCard from "@/components/FloatingCard";
import { CreditConfirmModal } from "@/components/CreditConfirmModal";
import { useCredits } from "@/hooks/use-credits";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { CREDIT_COSTS } from "@/lib/credits";
import { ShoppingCart, Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type GenResp = {
  success: boolean;
  template: string;
  files: { path: string; content: string }[];
};

export default function StoreGenerator() {
  const navigate = useNavigate();
  const { credits, deductCredits, canAfford } = useCredits();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [processingCredits, setProcessingCredits] = useState(false);
  const [storeName, setStoreName] = useState("Premium Products");
  const [niche, setNiche] = useState("Fashion & Apparel");
  const [shopifyPlan, setShopifyPlan] = useState("basic");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<GenResp | null>(null);

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

  const handleGenerateStore = async () => {
    if (!storeName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your store name",
        variant: "destructive",
      });
      return;
    }

    if (!credits || !canAfford(CREDIT_COSTS.store_generation || 20)) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${CREDIT_COSTS.store_generation || 20} credits. Please upgrade your plan.`,
        variant: "destructive",
      });
      return;
    }

    setShowCreditModal(true);
  };

  const handleConfirmCredits = async () => {
    const creditCost = CREDIT_COSTS.store_generation || 20;
    setProcessingCredits(true);

    try {
      const success = await deductCredits(creditCost);
      if (success) {
        await generateStore();
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

  const generateStore = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/generate-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, niche, shopifyPlan }),
      });
      const data = (await res.json()) as GenResp;
      if (!res.ok || !data.success) throw data;
      setOut(data);
      toast({
        title: "Success!",
        description: "Your store template has been generated",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.error || "Failed to generate store template",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "File content copied to clipboard",
    });
  };

  const niches = [
    "Fashion & Apparel",
    "Electronics",
    "Beauty & Skincare",
    "Home & Garden",
    "Sports & Outdoors",
    "Art & Crafts",
    "Food & Beverage",
    "Digital Products",
  ];

  const shopifyPlans = [
    { id: "basic", name: "Basic", price: "$29/mo" },
    { id: "pro", name: "Shopify", price: "$79/mo" },
    { id: "advanced", name: "Advanced", price: "$299/mo" },
  ];

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-neon-cyan" />
            <h1 className="text-4xl font-bold">Store Generator</h1>
          </div>
          <p className="text-foreground/60">
            Launch a professional Shopify store in minutes. Complete store setup with themes, products, and payments configured.
          </p>
        </div>

        {/* Generator Form */}
        <FloatingCard delay={0}>
          <GlassCard variant="light" className="border-neon-cyan/50 p-8 mb-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Create Your Shopify Store</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Your store name..."
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Niche / Category
                  </label>
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="input-glass w-full"
                  >
                    {niches.map((n) => (
                      <option key={n} value={n.toLowerCase()}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-3">
                  Shopify Plan
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {shopifyPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setShopifyPlan(plan.id)}
                      className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                        shopifyPlan === plan.id
                          ? "bg-neon-cyan/20 border-neon-cyan/50"
                          : "bg-white/5 border-white/10 hover:border-neon-cyan/50"
                      }`}
                    >
                      <span className="text-xs font-medium">{plan.name}</span>
                      <span className="text-xs text-foreground/60">{plan.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateStore}
                disabled={busy || !credits}
                className="btn-neon w-full py-3 rounded-lg inline-flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" /> 
                {busy ? "Generating..." : `Generate Store (${CREDIT_COSTS.store_generation || 20} credits)`}
              </button>
            </div>
          </GlassCard>
        </FloatingCard>

        {/* Features Grid */}
        <FloatingCard delay={100}>
          <GlassCard variant="dark" className="border-white/10 p-8 mb-12">
            <h3 className="text-xl font-bold mb-6">Shopify Store Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Shopify Integration" },
                { label: "Payment Gateway Setup" },
                { label: "Product Importer" },
                { label: "Premium Themes" },
                { label: "Shopify Analytics" },
                { label: "Shipping Rates Setup" },
                { label: "Mobile Optimized" },
                { label: "SEO & Marketing Apps" },
              ].map((feature, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-sm font-medium">{feature.label}</p>
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
                  <h3 className="text-xl font-bold mb-2">Shopify Store Setup</h3>
                  <p className="text-sm text-foreground/60">
                    Your Shopify store configuration is ready. Follow the setup guide to deploy your store and connect your domain.
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
            creditsNeeded={CREDIT_COSTS.store_generation || 20}
            creditsAvailable={credits.currentCredits}
            actionName="Generate Store"
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


