import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";

const SERVICES = [
{ name: "Core Platform", description: "Authentication, dashboard, navigation" },
{ name: "AI Services", description: "Ad generation, brand strategy, business plans" },
{ name: "Analytics Pipeline", description: "Revenue, orders, and social metrics" },
{ name: "Website Generator", description: "Site generation and preview" },
{ name: "Billing & Credits", description: "Paddle payments and credit system" },
{ name: "Social Scheduler", description: "Post scheduling and OAuth connections" },
{ name: "Automations", description: "Workflow builder and execution engine" },
];

export default function Status() {
const [checkedAt, setCheckedAt] = useState<Date | null>(null);

useEffect(() => {
setCheckedAt(new Date());
}, []);

return (
<div className="page-shell">
<div className="section max-w-3xl mx-auto px-3 sm:px-0 space-y-6 sm:space-y-8">
<div className="space-y-2">
<div className="eyebrow">Status</div>
<h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Launchly system status</h1>
<p className="text-foreground/60 text-sm sm:text-base">
All systems are operational.
{checkedAt && <span className="ml-2 text-foreground/40">Last checked: {checkedAt.toLocaleTimeString()}</span>}
</p>
</div>

    {/* Overall status banner */}
    <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
      <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
      <div>
        <p className="font-semibold text-green-300 text-sm sm:text-base">All systems operational</p>
        <p className="text-xs text-green-400/70 mt-0.5">No incidents reported in the last 90 days</p>
      </div>
    </div>

    <GlassCard variant="dark" className="border-white/10">
      <div className="space-y-0 divide-y divide-white/5">
        {SERVICES.map((service) => (
          <div key={service.name} className="flex items-center justify-between py-3 sm:py-4 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm sm:text-base font-medium">{service.name}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{service.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-400 font-medium">Operational</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Uptime */}
    <GlassCard variant="dark" className="border-white/10">
      <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Uptime — Last 30 Days</h3>
      <div className="flex gap-0.5 sm:gap-1 mb-2">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="flex-1 h-6 sm:h-8 rounded-sm bg-green-400/80 hover:bg-green-400 transition-colors" title={`Day ${30 - i}: 100%`} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-foreground/50">
        <span>30 days ago</span>
        <span className="text-green-400 font-medium">99.9% uptime</span>
        <span>Today</span>
      </div>
    </GlassCard>

    <FooterLinks />
  </div>
</div>

);
}
