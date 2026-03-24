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

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(initialState);

  const stepTitle = useMemo(() => {
    return [
      "Business Basics",
      "Resources",
      "Goals",
      "Execution Style",
    ][step];
  }, [step]);

  const payload = useMemo(
    () => ({
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
    }),
    [form]
  );

  const stepSchemas = [
    onboardingSchema.pick({
      niche: true,
      currentMonthlyRevenue: true,
      businessStage: true,
      primaryRevenueSource: true,
      targetMarketCountry: true,
    }),
    onboardingSchema.pick({
      monthlyBudget: true,
      teamSize: true,
      hoursPerDayAvailable: true,
      skills: true,
    }),
    onboardingSchema.pick({
      threeMonthRevenueGoal: true,
      oneYearRevenueGoal: true,
      biggestObstacle: true,
    }),
    onboardingSchema.pick({
      riskTolerance: true,
      wantsBrutalAccountability: true,
    }),
  ];

  const validateStep = (targetStep: number) => {
    const schema = stepSchemas[targetStep];
    const parsed = schema.safeParse(payload);
    if (parsed.success) {
      return true;
    }

    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    setErrors((current) => ({ ...current, ...fieldErrors }));
    return false;
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const addSkill = () => {
    const skill = form.skillInput.trim();
    if (!skill) return;
    if (form.skills.includes(skill)) {
      setField("skillInput", "");
      return;
    }
    setField("skills", [...form.skills, skill]);
    setField("skillInput", "");
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await authFetch("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(parsed.data as OnboardingInput),
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error || "Failed to complete onboarding");
      }

      toast({
        title: "Onboarding complete",
        description: "Your growth plan has been generated.",
      });
      navigate("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete onboarding";
      toast({
        title: "Onboarding failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page-shell">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="eyebrow justify-center">Mandatory Setup</div>
          <h1 className="text-3xl font-semibold">Complete Your Onboarding</h1>
          <p className="text-foreground/70">
            Step {step + 1} of 4: {stepTitle}
          </p>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        <GlassCard variant="dark" className="border-white/10 space-y-6">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Niche"
                value={form.niche}
                onChange={(value) => setField("niche", value)}
                error={errors.niche}
                placeholder="E.g. B2B SaaS for finance teams"
              />
              <Field
                label="Current Monthly Revenue"
                type="number"
                value={form.currentMonthlyRevenue}
                onChange={(value) => setField("currentMonthlyRevenue", value)}
                error={errors.currentMonthlyRevenue}
                placeholder="0"
              />
              <SelectField
                label="Business Stage"
                value={form.businessStage}
                onChange={(value) =>
                  setField("businessStage", value as FormState["businessStage"])
                }
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
                error={errors.businessStage}
              />
              <Field
                label="Primary Revenue Source"
                value={form.primaryRevenueSource}
                onChange={(value) => setField("primaryRevenueSource", value)}
                error={errors.primaryRevenueSource}
                placeholder="E.g. subscriptions, consulting, ecommerce"
              />
              <Field
                label="Target Market Country"
                value={form.targetMarketCountry}
                onChange={(value) => setField("targetMarketCountry", value)}
                error={errors.targetMarketCountry}
                placeholder="United States"
              />
            </div>
          )}

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Monthly Budget"
                type="number"
                value={form.monthlyBudget}
                onChange={(value) => setField("monthlyBudget", value)}
                error={errors.monthlyBudget}
                placeholder="5000"
              />
              <Field
                label="Team Size"
                type="number"
                value={form.teamSize}
                onChange={(value) => setField("teamSize", value)}
                error={errors.teamSize}
                placeholder="1"
              />
              <Field
                label="Hours Per Day Available"
                type="number"
                value={form.hoursPerDayAvailable}
                onChange={(value) => setField("hoursPerDayAvailable", value)}
                error={errors.hoursPerDayAvailable}
                placeholder="4"
              />
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground/80">Skills</label>
                <div className="flex gap-2">
                  <input
                    value={form.skillInput}
                    onChange={(event) => setField("skillInput", event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                    className="input-glass flex-1"
                    placeholder="Type a skill and press Enter"
                  />
                  <button onClick={addSkill} className="btn-neon px-4 rounded-lg">
                    Add
                  </button>
                </div>
                {errors.skills && (
                  <p className="text-xs text-destructive">{errors.skills}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() =>
                        setField(
                          "skills",
                          form.skills.filter((item) => item !== skill)
                        )
                      }
                      className="px-3 py-1 rounded-full bg-white/10 text-xs hover:bg-white/20"
                    >
                      {skill} ×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="3-Month Revenue Goal"
                type="number"
                value={form.threeMonthRevenueGoal}
                onChange={(value) => setField("threeMonthRevenueGoal", value)}
                error={errors.threeMonthRevenueGoal}
                placeholder="15000"
              />
              <Field
                label="1-Year Revenue Goal"
                type="number"
                value={form.oneYearRevenueGoal}
                onChange={(value) => setField("oneYearRevenueGoal", value)}
                error={errors.oneYearRevenueGoal}
                placeholder="100000"
              />
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground/80">Biggest Obstacle</label>
                <textarea
                  value={form.biggestObstacle}
                  onChange={(event) => setField("biggestObstacle", event.target.value)}
                  className="input-glass min-h-[120px] w-full resize-none"
                  placeholder="What keeps your growth stuck right now?"
                />
                {errors.biggestObstacle && (
                  <p className="text-xs text-destructive">{errors.biggestObstacle}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SelectField
                label="Risk Tolerance"
                value={form.riskTolerance}
                onChange={(value) =>
                  setField("riskTolerance", value as FormState["riskTolerance"])
                }
                options={[
                  { value: "conservative", label: "Conservative" },
                  { value: "aggressive", label: "Aggressive" },
                ]}
                error={errors.riskTolerance}
              />
              <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
                <input
                  type="checkbox"
                  checked={form.wantsBrutalAccountability}
                  onChange={(event) =>
                    setField("wantsBrutalAccountability", event.target.checked)
                  }
                />
                <span className="text-sm text-foreground/80">
                  I want brutal accountability and direct feedback.
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={handleBack}
              disabled={step === 0 || submitting}
              className="btn-glass px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="btn-neon px-4 py-2 rounded-lg"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-neon px-5 py-2 rounded-lg"
              >
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

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">{props.label}</label>
      <input
        type={props.type || "text"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className="input-glass w-full"
      />
      {props.error && <p className="text-xs text-destructive">{props.error}</p>}
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">{props.label}</label>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="input-glass w-full"
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {props.error && <p className="text-xs text-destructive">{props.error}</p>}
    </div>
  );
}
