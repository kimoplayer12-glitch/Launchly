import GlassCard from "@/components/GlassCard";

export default function Changelog() {
  return (
    <div className="page-shell">
      <div className="section space-y-8">
        <div className="space-y-2">
          <div className="eyebrow">Changelog</div>
          <h1 className="text-3xl sm:text-4xl font-semibold">Launchly updates</h1>
          <p className="text-foreground/60">
            Product updates will be listed here as we ship improvements.
          </p>
        </div>

        <GlassCard variant="dark" className="border-white/10">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Feb 2026</div>
            <p className="text-sm text-foreground/60">
              A new premium visual system across marketing and app shell.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

