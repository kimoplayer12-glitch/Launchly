import GlassCard from "@/components/GlassCard";

export default function Status() {
  return (
    <div className="page-shell">
      <div className="section space-y-8">
        <div className="space-y-2">
          <div className="eyebrow">Status</div>
          <h1 className="text-3xl sm:text-4xl font-semibold">Launchly system status</h1>
          <p className="text-foreground/60">
            Service updates will appear here. All systems are operational.
          </p>
        </div>

        <GlassCard variant="dark" className="border-white/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Core platform</div>
              <div className="text-xs text-neon-cyan">Operational</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Billing</div>
              <div className="text-xs text-neon-cyan">Operational</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">AI services</div>
              <div className="text-xs text-neon-cyan">Operational</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

