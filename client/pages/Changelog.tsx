import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";

const CHANGELOG = [
{
date: "Mar 2026",
version: "v2.1",
items: [
"Real AI ad generation with 3 variations per request",
"Brand Starter now powered by AI — real strategies, not templates",
"Mobile UI overhaul across all pages",
"Survey now saves to backend",
"Dashboard data table replaced with mobile-friendly cards",
],
},
{
date: "Feb 2026",
version: "v2.0",
items: [
"New premium visual system across marketing and app shell",
"Social Media Scheduler with OAuth integrations",
"Automation workflow builder with ReactFlow",
"Analytics overview with live charts",
"Growth Plan generation from onboarding data",
],
},
{
date: "Jan 2026",
version: "v1.0",
items: [
"Initial launch — core platform",
"Business Builder with AI chat advisor",
"Website Generator",
"Store Generator (Shopify)",
"Credits & billing system via Paddle",
],
},
];

export default function Changelog() {
return (
<div className="page-shell">
<div className="section max-w-3xl mx-auto px-3 sm:px-0 space-y-6 sm:space-y-8">
<div className="space-y-2">
<div className="eyebrow">Changelog</div>
<h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Launchly updates</h1>
<p className="text-foreground/60 text-sm sm:text-base">
What's shipped, what's new, what's fixed.
</p>
</div>

    <div className="space-y-4 sm:space-y-6">
      {CHANGELOG.map((entry) => (
        <GlassCard key={entry.version} variant="dark" className="border-white/10">
          <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
            <div>
              <div className="text-xs sm:text-sm font-bold text-neon-cyan">{entry.version}</div>
              <div className="text-xs text-foreground/50 mt-0.5">{entry.date}</div>
            </div>
          </div>
          <ul className="space-y-2">
            {entry.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                <span className="text-neon-cyan mt-0.5 flex-shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </GlassCard>
      ))}
    </div>
    <FooterLinks />
  </div>
</div>

);
}
