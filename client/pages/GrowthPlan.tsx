import { useEffect, useState } from "react";
import type { GrowthPlanContent } from "@shared/onboarding";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { authFetch, readJson } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

type GrowthPlanResponse = {
  growthPlan: GrowthPlanContent;
  generatedAt: string;
};

export default function GrowthPlan() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GrowthPlanResponse | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const response = await authFetch("/api/growth-plan");
        const body = await readJson(response);
        if (!response.ok) {
          throw new Error(body?.error || "Failed to load growth plan");
        }
        setData(body as GrowthPlanResponse);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load growth plan";
        setError(message);
        toast({
          title: "Unable to load growth plan",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-neon-cyan border-t-transparent"></div>
          <div className="text-foreground/70">Loading growth plan...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-shell">
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard variant="dark" className="border-white/10">
            <h1 className="text-2xl font-semibold mb-2">Growth Plan Unavailable</h1>
            <p className="text-foreground/70">
              Complete onboarding to generate your personalized growth strategy.
            </p>
          </GlassCard>
          <FooterLinks />
        </div>
      </div>
    );
  }

  const plan = data.growthPlan;
  const roadmap = plan["90DayRoadmap"];

  const sections = [
    { key: "positioningStrategy", title: "Positioning Strategy", value: plan.positioningStrategy },
    { key: "monetizationPlan", title: "Monetization Plan", value: plan.monetizationPlan },
    { key: "offerStructure", title: "Offer Structure", value: plan.offerStructure },
    { key: "trafficStrategy", title: "Traffic Strategy", value: plan.trafficStrategy },
    { key: "salesFunnel", title: "Sales Funnel", value: plan.salesFunnel },
    { key: "biggestRisk", title: "Biggest Risk", value: plan.biggestRisk },
    { key: "scalingStrategy", title: "Scaling Strategy", value: plan.scalingStrategy },
  ];

  return (
    <div className="page-shell">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="eyebrow">AI Strategy</div>
          <h1 className="text-3xl font-semibold">Your Personalized Growth Plan</h1>
          <p className="text-foreground/60">
            Generated on {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>

        <GlassCard variant="dark" className="border-white/10">
          <h2 className="text-lg font-semibold mb-4">90-Day Roadmap</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Month 1", tasks: roadmap.month1 },
              { label: "Month 2", tasks: roadmap.month2 },
              { label: "Month 3", tasks: roadmap.month3 },
            ].map((month) => (
              <div key={month.label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-neon-cyan mb-3">{month.label}</div>
                <ul className="space-y-2">
                  {month.tasks.map((task, index) => (
                    <li key={`${month.label}-${index}`} className="text-sm text-foreground/80 flex gap-2">
                      <span className="text-neon-purple">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="border-white/10">
          <h2 className="text-lg font-semibold mb-2">Plan Breakdown</h2>
          <Accordion type="multiple">
            {sections.map((section) => (
              <AccordionItem key={section.key} value={section.key} className="border-white/10">
                <AccordionTrigger className="text-left hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed">
                  {section.value}
                </AccordionContent>
              </AccordionItem>
            ))}
            <AccordionItem value="dailyExecutionFramework" className="border-white/10">
              <AccordionTrigger className="text-left hover:no-underline">
                Daily Execution Framework
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {plan.dailyExecutionFramework.map((item, index) => (
                    <li key={`daily-${index}`} className="text-foreground/80 flex gap-2">
                      <span className="text-neon-cyan">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="keyKPIs" className="border-white/10">
              <AccordionTrigger className="text-left hover:no-underline">
                Key KPIs
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {plan.keyKPIs.map((item, index) => (
                    <li key={`kpi-${index}`} className="text-foreground/80 flex gap-2">
                      <span className="text-neon-purple">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </GlassCard>

        <FooterLinks />
      </div>
    </div>
  );
}
