import { Copy, Download, Share2, RotateCcw, FileJson, FileText, MessageCircle, X, Plus } from "lucide-react";
import GlassCard from "./GlassCard";
import BusinessPlanChat from "./BusinessPlanChat";
import { toast } from "./ui/use-toast";
import { useState } from "react";

interface BusinessPlanDisplayProps {
  plan: string;
  onReset: () => void;
  businessName?: string;
}

export default function BusinessPlanDisplay({ plan, onReset, businessName = "Your Business" }: BusinessPlanDisplayProps) {
  const [showChat, setShowChat] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(plan);
    toast({
      title: "Copied!",
      description: "Business plan copied to clipboard",
    });
  };

  const downloadPlan = (format: "txt" | "md" | "json") => {
    let content = plan;
    let filename = "business-plan";
    let mimeType = "text/plain";

    if (format === "md") {
      filename = "business-plan.md";
      mimeType = "text/markdown";
    } else if (format === "json") {
      content = JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          plan: plan,
        },
        null,
        2
      );
      filename = "business-plan.json";
      mimeType = "application/json";
    } else {
      filename = "business-plan.txt";
    }

    const element = document.createElement("a");
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Downloaded!",
      description: `Business plan downloaded as ${filename}`,
    });
  };

  const sections = plan.split(/\n(?=\d+\.|###|##|#)/).filter((section) => section.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard variant="light" className="border-neon-cyan/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Your Business Plan</h2>
            <p className="text-foreground/70">
              AI-generated comprehensive business plan - ready to customize and implement
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="btn-neon px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm hover:shadow-lg transition-all"
            >
              {showChat ? (
                <>
                  <X className="w-4 h-4" /> Close Chat
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" /> Ask AI
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="btn-glass px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm hover:glow-cyan transition-all"
            >
              <Plus className="w-4 h-4" /> Create New Plan
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={copyToClipboard}
          className="btn-neon px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm"
        >
          <Copy className="w-4 h-4" /> Copy to Clipboard
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => downloadPlan("txt")}
            className="btn-glass px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm hover:glow-cyan group"
          >
            <FileText className="w-4 h-4" />
            <span>Download Text</span>
          </button>
          <button
            onClick={() => downloadPlan("md")}
            className="btn-glass px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm hover:glow-purple group"
          >
            <FileText className="w-4 h-4" />
            <span>Download Markdown</span>
          </button>
          <button
            onClick={() => downloadPlan("json")}
            className="btn-glass px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm hover:glow-cyan group"
          >
            <FileJson className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Chat Section */}
      {showChat && (
        <GlassCard variant="dark" className="border-neon-cyan/50 p-0 overflow-hidden" style={{ height: "600px" }}>
          <BusinessPlanChat plan={plan} businessName={businessName} onClose={() => setShowChat(false)} />
        </GlassCard>
      )}

      {/* Plan Content */}
      <GlassCard variant="dark" className="border-white/10">
        <div className="prose prose-invert max-w-none space-y-6">
          {sections.length > 0 ? (
            sections.map((section, idx) => {
              const lines = section.split("\n").filter((line) => line.trim());
              return (
                <div key={idx} className="space-y-3 pb-6 border-b border-white/10 last:border-0">
                  {lines.map((line, lineIdx) => {
                    const trimmed = line.trim();

                    // Headers
                    if (trimmed.match(/^#{1,3}\s/)) {
                      const level = trimmed.match(/^#+/)?.[0].length || 1;
                      const text = trimmed.replace(/^#+\s/, "");
                      const classes =
                        level === 1
                          ? "text-2xl font-bold text-neon-cyan"
                          : level === 2
                            ? "text-xl font-bold text-neon-purple"
                            : "text-lg font-semibold text-neon-cyan";
                      return (
                        <h3 key={lineIdx} className={classes}>
                          {text}
                        </h3>
                      );
                    }

                    // Numbered lists
                    if (trimmed.match(/^\d+\./)) {
                      return (
                        <div key={lineIdx} className="flex gap-3 text-foreground/90">
                          <span className="text-neon-cyan font-semibold flex-shrink-0">
                            {trimmed.match(/^\d+/)?.[0]}.
                          </span>
                          <p className="flex-grow">{trimmed.replace(/^\d+\.\s*/, "")}</p>
                        </div>
                      );
                    }

                    // Bullet points
                    if (trimmed.match(/^[-•*]\s/)) {
                      return (
                        <div key={lineIdx} className="flex gap-3 text-foreground/90 ml-4">
                          <span className="text-neon-purple flex-shrink-0">•</span>
                          <p className="flex-grow">{trimmed.replace(/^[-•*]\s*/, "")}</p>
                        </div>
                      );
                    }

                    // Empty lines
                    if (!trimmed) {
                      return <div key={lineIdx} className="h-2" />;
                    }

                    // Regular paragraphs
                    return (
                      <p key={lineIdx} className="text-foreground/90 leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="text-foreground/60 whitespace-pre-wrap">{plan}</div>
          )}
        </div>
      </GlassCard>

      {/* Footer Note */}
      <GlassCard variant="dark" className="border-white/10 bg-white/5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-neon-cyan">💡 Next Steps</p>
          <p className="text-sm text-foreground/70">
            This business plan was generated by AI and should be customized with your specific
            details, metrics, and strategy. Review, adjust, and refine each section to match your
            actual business situation before sharing with stakeholders or investors.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

