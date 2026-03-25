import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import FooterLinks from "@/components/FooterLinks";
import { authFetch } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

interface SurveyAnswers {
businessType: string;
stage: string;
goals: string[];
targetAudience: string;
monthlyBudget: string;
}

export default function Survey() {
const navigate = useNavigate();
const { isAuthenticated, loading, user } = useFirebaseAuth();
const [step, setStep] = useState(0);
const [submitting, setSubmitting] = useState(false);
const [answers, setAnswers] = useState<SurveyAnswers>({
businessType: "",
stage: "",
goals: [],
targetAudience: "",
monthlyBudget: "",
});

useEffect(() => {
if (loading) return;
if (!isAuthenticated) navigate("/signup");
}, [loading, isAuthenticated, navigate]);

if (loading) {
return (
<div className="min-h-screen bg-background flex items-center justify-center">
<div className="flex flex-col items-center gap-4">
<div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
<div className="text-foreground">Loading...</div>
</div>
</div>
);
}

const businessTypes = [
{ id: "saas", label: "SaaS Product", desc: "Software as a Service" },
{ id: "agency", label: "Agency", desc: "Services & Consulting" },
{ id: "ecommerce", label: "E-commerce", desc: "Online Store" },
{ id: "creator", label: "Creator/Personal", desc: "Content & Brand" },
{ id: "other", label: "Other", desc: "Something else" },
];

const stages = [
{ id: "idea", label: "Just an idea", desc: "Haven't started yet" },
{ id: "building", label: "Building", desc: "In development" },
{ id: "launched", label: "Launched", desc: "Already live" },
{ id: "scaling", label: "Scaling", desc: "Growing fast" },
];

const goalsList = [
{ id: "launch", label: "Launch ASAP" },
{ id: "revenue", label: "Generate Revenue" },
{ id: "audience", label: "Grow Audience" },
{ id: "team", label: "Build a Team" },
{ id: "funding", label: "Raise Funding" },
{ id: "automate", label: "Automate Operations" },
];

const audienceOptions = [
{ id: "b2b", label: "B2B (Business to Business)" },
{ id: "b2c", label: "B2C (Business to Consumer)" },
{ id: "b2b2c", label: "B2B2C (Hybrid)" },
];

const budgetOptions = [
{ id: "0-500", label: "Under $500" },
{ id: "500-2k", label: "$500 - $2K" },
{ id: "2k-10k", label: "$2K - $10K" },
{ id: "10k+", label: "$10K+" },
];

const handleGoalToggle = (goalId: string) => {
setAnswers((prev) => ({
...prev,
goals: prev.goals.includes(goalId)
? prev.goals.filter((g) => g !== goalId)
: [...prev.goals, goalId],
}));
};

const handleNext = async () => {
if (step < 4) {
setStep(step + 1);
return;
}

// Final step — save to backend
setSubmitting(true);
try {
  const response = await authFetch("/api/survey", {
    method: "POST",
    body: JSON.stringify(answers),
  });

  if (!response.ok) {
    // Non-critical — still proceed to dashboard
    console.warn("Survey save failed, proceeding anyway");
  }

  toast({ title: "Survey complete!", description: "Taking you to your dashboard." });
  navigate("/dashboard");
} catch (error) {
  // Survey save failure is non-critical
  console.warn("Survey save error:", error);
  navigate("/dashboard");
} finally {
  setSubmitting(false);
}

};

const handleBack = () => { if (step > 0) setStep(step - 1); };

const isStepComplete = () => {
switch (step) {
case 0: return answers.businessType !== "";
case 1: return answers.stage !== "";
case 2: return answers.goals.length > 0;
case 3: return answers.targetAudience !== "";
case 4: return answers.monthlyBudget !== "";
default: return false;
}
};

const OptionButton = ({ id, label, desc, selected, onClick }: { id: string; label: string; desc?: string; selected: boolean; onClick: () => void }) => (
<button
onClick={onClick}
className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left group ${ selected ? "border-neon-cyan bg-neon-cyan/10" : "border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10" }`}
>
<div className="flex items-center justify-between">
<div>
<div className={`font-semibold text-sm sm:text-base ${selected ? "text-neon-cyan" : "text-foreground"}`}>{label}</div>
{desc && <div className="text-xs sm:text-sm text-foreground/60 mt-0.5">{desc}</div>}
</div>
{selected && <CheckCircle2 className="w-5 h-5 text-neon-cyan flex-shrink-0 ml-2" />}
</div>
</button>
);

return (
<div className="page-shell">
<div className="absolute inset-0 -z-10 overflow-hidden">
<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
</div>

  <div className="max-w-2xl mx-auto px-3 sm:px-0">
    <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 glass-light rounded-full">
        <Sparkles className="w-4 h-4 text-neon-cyan" />
        <span className="text-sm text-foreground/80">Step {step + 1} of 5</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold">Let's Get to Know Your Vision</h1>
      <p className="text-foreground/60 text-sm sm:text-base">Answer a few quick questions to personalize your experience</p>
    </div>

    <div className="mb-8 h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300" style={{ width: `${((step + 1) / 5) * 100}%` }} />
    </div>

    <GlassCard variant="dark" className="border-white/20 space-y-5 sm:space-y-8">
      {step === 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">What type of business are you building?</h2>
            <p className="text-foreground/60 text-sm">Choose the option that best fits your vision</p>
          </div>
          <div className="grid gap-2 sm:gap-3">
            {businessTypes.map((t) => <OptionButton key={t.id} id={t.id} label={t.label} desc={t.desc} selected={answers.businessType === t.id} onClick={() => setAnswers({ ...answers, businessType: t.id })} />)}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">What stage is your business at?</h2>
            <p className="text-foreground/60 text-sm">Where are you in your journey?</p>
          </div>
          <div className="grid gap-2 sm:gap-3">
            {stages.map((s) => <OptionButton key={s.id} id={s.id} label={s.label} desc={s.desc} selected={answers.stage === s.id} onClick={() => setAnswers({ ...answers, stage: s.id })} />)}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">What are your main goals?</h2>
            <p className="text-foreground/60 text-sm">Select all that apply</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {goalsList.map((g) => <OptionButton key={g.id} id={g.id} label={g.label} selected={answers.goals.includes(g.id)} onClick={() => handleGoalToggle(g.id)} />)}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">Who is your target audience?</h2>
            <p className="text-foreground/60 text-sm">This helps us personalize your dashboard</p>
          </div>
          <div className="grid gap-2 sm:gap-3">
            {audienceOptions.map((a) => <OptionButton key={a.id} id={a.id} label={a.label} selected={answers.targetAudience === a.id} onClick={() => setAnswers({ ...answers, targetAudience: a.id })} />)}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">What's your monthly marketing budget?</h2>
            <p className="text-foreground/60 text-sm">Helps us suggest the right plan for you</p>
          </div>
          <div className="grid gap-2 sm:gap-3">
            {budgetOptions.map((b) => <OptionButton key={b.id} id={b.id} label={b.label} selected={answers.monthlyBudget === b.id} onClick={() => setAnswers({ ...answers, monthlyBudget: b.id })} />)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/10">
        <button onClick={handleBack} disabled={step === 0} className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg btn-glass disabled:opacity-50 text-sm">
          Back
        </button>
        <div className="text-xs text-foreground/50">{step + 1} / 5</div>
        <button onClick={handleNext} disabled={!isStepComplete() || submitting} className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg btn-neon disabled:opacity-50 inline-flex items-center gap-2 text-sm">
          {submitting ? "Saving..." : step === 4 ? "Complete Survey" : "Next"}
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </GlassCard>
    <FooterLinks />
  </div>
</div>

);
}
