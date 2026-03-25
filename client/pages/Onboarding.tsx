import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { OnboardingInput } from "@shared/onboarding";
import { onboardingSchema } from "@shared/onboarding";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import { authFetch, readJson } from "@/lib/api-client";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { toast } from "@/components/ui/use-toast";

type FormState = {
niche: string;
currentMonthlyRevenue: string;
businessStage: "beginner" | "intermediate" | "advanced";
primaryRevenueSource: string;
targetMarketCountry: string;
monthlyBudget: string;
teamSize: string;
hoursPerDayAvailable: string;
skills: string[];
skillInput: string;
threeMonthRevenueGoal: string;
oneYearRevenueGoal: string;
biggestObstacle: string;
riskTolerance: "conservative" | "aggressive";
wantsBrutalAccountability: boolean;
};

const initialState: FormState = {
niche: "",
currentMonthlyRevenue: "",
businessStage: "beginner",
primaryRevenueSource: "",
targetMarketCountry: "",
monthlyBudget: "",
teamSize: "",
hoursPerDayAvailable: "",
skills: [],
skillInput: "",
threeMonthRevenueGoal: "",
oneYearRevenueGoal: "",
biggestObstacle: "",
riskTolerance: "conservative",
wantsBrutalAccountability: false,
};

const STEP_TITLES = ["Business Basics", "Resources", "Goals", "Execution Style"];

export default function Onboarding() {
const navigate = useNavigate();
const { user } = useFirebaseAuth();
const [step, setStep] = useState(0);
const [submitting, setSubmitting] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [form, setForm] = useState<FormState>(initialState);

const payload = useMemo(() => ({
niche: form.niche,
currentMonthlyRevenue: form.currentMonthlyRevenue,
businessStage: form.businessStage,
primaryRevenueSource: form.primaryRevenueSource,
targetMarketCountry: form.targetMarketCountry,
monthlyBudget: form.monthlyBudget,
teamSize: form.teamSize,
hoursPerDayAvailable: form.hoursPerDayAvailable,
skills: form.skills,
threeMonthRevenueGoal: form.threeMonthRevenueGoal,
oneYearRevenueGoal: form.oneYearRevenueGoal,
biggestObstacle: form.biggestObstacle,
riskTolerance: form.riskTolerance,
wantsBrutalAccountability: form.wantsBrutalAccountability,
}), [form]);

const stepSchemas = [
onboardingSchema.pick({ niche: true, currentMonthlyRevenue: true, businessStage: true, primaryRevenueSource: true, targetMarketCountry: true }),
onboardingSchema.pick({ monthlyBudget: true, teamSize: true, hoursPerDayAvailable: true, skills: true }),
onboardingSchema.pick({ threeMonthRevenueGoal: true, oneYearRevenueGoal: true, biggestObstacle: true }),
onboardingSchema.pick({ riskTolerance: true, wantsBrutalAccountability: true }),
];

const validateStep = (targetStep: number) => {
const schema = stepSchemas[targetStep];
const parsed = schema.safeParse(payload);
if (parsed.success) return true;
const fieldErrors: Record<string, string> = {};
for (const issue of parsed.error.issues) {
const key = issue.path[0];
if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
}
setErrors((current) => ({ ...current, ...fieldErrors }));
return false;
};

const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
setForm((current) => ({ ...current, [key]: value }));
setErrors((current) => { if (!current[key as string]) return current; const next = { ...current }; delete next[key as string]; return next; });
};

const addSkill = () => {
const skill = form.skillInput.trim();
if (!skill) return;
if (!form.skills.includes(skill)) setField("skills", [...form.skills, skill]);
setField("skillInput", "");
};

const handleNext = () => {
if (!validateStep(step)) return;
setStep((current) => Math.min(current + 1, 3));
};

const handleBack = () => setStep((current) => Math.max(current - 1, 0));

const handleSubmit = async () => {
const parsed = onboardingSchema.safeParse(payload);
if (!parsed.success) {
const fieldErrors: Record<string, string> = {};
for (const issue of parsed.error.issues) {
const key = issue.path[0];
if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
}
setErrors(fieldErrors);
return;
}
setSubmitting(true);
try {
const response = await authFetch("/api/onboarding", { method: "POST", body: JSON.stringify(parsed.data as OnboardingInput) });
const body = await readJson(response);
if (!response.ok) throw new Error(body?.error || "Failed to complete onboarding");
toast({ title: "Onboarding complete", description: "Your growth plan has been generated." });
navigate("/dashboard");
} catch (error) {
toast({ title: "Onboarding failed", description: error instanceof Error ? error.message : "Failed to complete onboarding", variant: "destructive" });
} finally {
setSubmitting(false);
}
};

if (user?.onboardingCompleted) return <Navigate to="/dashboard" replace />;

return (
<div className="page-shell">
<div className="max-w-3xl mx-auto space-y-6 px-3 sm:px-0">
<div className="text-center space-y-2 sm:space-y-3">
<div className="eyebrow justify-center">Setup</div>
<h1 className="text-2xl sm:text-3xl font-semibold">Complete Your Onboarding</h1>
<p className="text-foreground/70 text-sm sm:text-base">
Step {step + 1} of 4: <span className="text-neon-cyan font-medium">{STEP_TITLES[step]}</span>
</p>
</div>

    {/* Progress bar */}
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
        style={{ width: `${((step + 1) / 4) * 100}%` }}
      />
    </div>

    {/* Step indicators */}
    <div className="flex justify-between px-1">
      {STEP_TITLES.map((title, i) => (
        <div key={i} className={`text-[10px] sm:text-xs font-medium transition-colors ${i === step ? "text-neon-cyan" : i < step ? "text-foreground/60" : "text-foreground/30"}`}>
          {i < step ? "✓ " : ""}{title}
        </div>
      ))}
    </div>

    <GlassCard variant="dark" className="border-white/10 space-y-5">
      {step === 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Your Niche / Business Type" value={form.niche} onChange={(v) => setField("niche", v)} error={errors.niche} placeholder="E.g. B2B SaaS for finance teams" />
          <Field label="Current Monthly Revenue ($)" type="number" value={form.currentMonthlyRevenue} onChange={(v) => setField("currentMonthlyRevenue", v)} error={errors.currentMonthlyRevenue} placeholder="0" />
          <SelectField label="Business Stage" value={form.businessStage} onChange={(v) => setField("businessStage", v as FormState["businessStage"])} options={[{ value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }]} error={errors.businessStage} />
          <Field label="Primary Revenue Source" value={form.primaryRevenueSource} onChange={(v) => setField("primaryRevenueSource", v)} error={errors.primaryRevenueSource} placeholder="E.g. subscriptions, consulting" />
          <Field label="Target Market Country" value={form.targetMarketCountry} onChange={(v) => setField("targetMarketCountry", v)} error={errors.targetMarketCountry} placeholder="United States" />
        </div>
      )}

      {step === 1 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Monthly Budget ($)" type="number" value={form.monthlyBudget} onChange={(v) => setField("monthlyBudget", v)} error={errors.monthlyBudget} placeholder="5000" />
          <Field label="Team Size" type="number" value={form.teamSize} onChange={(v) => setField("teamSize", v)} error={errors.teamSize} placeholder="1" />
          <Field label="Hours Per Day Available" type="number" value={form.hoursPerDayAvailable} onChange={(v) => setField("hoursPerDayAvailable", v)} error={errors.hoursPerDayAvailable} placeholder="4" />
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-medium text-foreground/80">Skills</label>
            <div className="flex gap-2">
              <input
                value={form.skillInput}
                onChange={(e) => setField("skillInput", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                className="input-glass flex-1"
                placeholder="Type a skill and press Enter"
              />
              <button onClick={addSkill} className="btn-neon px-4 rounded-lg text-sm">Add</button>
            </div>
            {errors.skills && <p className="text-xs text-destructive">{errors.skills}</p>}
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <button key={skill} onClick={() => setField("skills", form.skills.filter((s) => s !== skill))} className="px-3 py-1 rounded-full bg-white/10 text-xs hover:bg-white/20 transition-colors">
                  {skill} ×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="3-Month Revenue Goal ($)" type="number" value={form.threeMonthRevenueGoal} onChange={(v) => setField("threeMonthRevenueGoal", v)} error={errors.threeMonthRevenueGoal} placeholder="15000" />
          <Field label="1-Year Revenue Goal ($)" type="number" value={form.oneYearRevenueGoal} onChange={(v) => setField("oneYearRevenueGoal", v)} error={errors.oneYearRevenueGoal} placeholder="100000" />
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-medium text-foreground/80">Biggest Obstacle to Growth</label>
            <textarea
              value={form.biggestObstacle}
              onChange={(e) => setField("biggestObstacle", e.target.value)}
              className="input-glass min-h-[120px] w-full resize-none"
              placeholder="What keeps your growth stuck right now?"
            />
            {errors.biggestObstacle && <p className="text-xs text-destructive">{errors.biggestObstacle}</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <SelectField
            label="Risk Tolerance"
            value={form.riskTolerance}
            onChange={(v) => setField("riskTolerance", v as FormState["riskTolerance"])}
            options={[{ value: "conservative", label: "Conservative — steady, calculated moves" }, { value: "aggressive", label: "Aggressive — bold, fast-paced bets" }]}
            error={errors.riskTolerance}
          />
          <label className="flex items-start gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={form.wantsBrutalAccountability}
              onChange={(e) => setField("wantsBrutalAccountability", e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-foreground/80">
              <span className="font-semibold block mb-1">Brutal Accountability Mode</span>
              I want direct, unfiltered feedback and push-back when I'm off track.
            </span>
          </label>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
        <button onClick={handleBack} disabled={step === 0 || submitting} className="btn-glass px-4 sm:px-6 py-2.5 rounded-lg disabled:opacity-50 text-sm">
          Back
        </button>
        <span className="text-xs text-foreground/40">{step + 1} / 4</span>
        {step < 3 ? (
          <button onClick={handleNext} disabled={submitting} className="btn-neon px-4 sm:px-6 py-2.5 rounded-lg text-sm">
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-neon px-4 sm:px-6 py-2.5 rounded-lg text-sm">
            {submitting ? "Generating plan..." : "Finish Onboarding"}
          </button>
        )}
      </div>
    </GlassCard>

    <FooterLinks />
  </div>
</div>

);
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: "text" | "number"; error?: string }) {
return (
<div className="space-y-2">
<label className="text-sm font-medium text-foreground/80">{props.label}</label>
<input type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="input-glass w-full" />
{props.error && <p className="text-xs text-destructive">{props.error}</p>}
</div>
);
}

function SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; error?: string }) {
return (
<div className="space-y-2">
<label className="text-sm font-medium text-foreground/80">{props.label}</label>
<select value={props.value} onChange={(e) => props.onChange(e.target.value)} className="input-glass w-full">
{props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>
{props.error && <p className="text-xs text-destructive">{props.error}</p>}
</div>
);
}
