import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import FooterLinks from "@/components/FooterLinks";

interface SurveyAnswers {
  businessType: string;
  stage: string;
  goals: string[];
  targetAudience: string;
  monthlyBudget: string;
}

export default function Survey() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [step, setStep] = useState(0);

  // IMPORTANT: hooks must be called unconditionally and in the same order.
  // Keep all useState/useEffect hooks above any early returns.
  const [answers, setAnswers] = useState<SurveyAnswers>({
    businessType: "",
    stage: "",
    goals: [],
    targetAudience: "",
    monthlyBudget: "",
  });

  // Route guards (avoid calling navigate during render)
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    if (localStorage.getItem("surveyCompleted") === "true") {
      navigate("/dashboard");
    }
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

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save survey and redirect to dashboard
      localStorage.setItem("surveyCompleted", "true");
      localStorage.setItem("surveyAnswers", JSON.stringify(answers));
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const isStepComplete = () => {
    switch (step) {
      case 0:
        return answers.businessType !== "";
      case 1:
        return answers.stage !== "";
      case 2:
        return answers.goals.length > 0;
      case 3:
        return answers.targetAudience !== "";
      case 4:
        return answers.monthlyBudget !== "";
      default:
        return false;
    }
  };

  return (
    <div className="page-shell">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-light rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm text-foreground/80">Step {step + 1} of 5</span>
          </div>
          <h1 className="text-3xl font-bold">Let's Get to Know Your Vision</h1>
          <p className="text-foreground/60 max-w-xl mx-auto">
            Answer a few quick questions to personalize your Launchly experience
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-12 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          ></div>
        </div>

        <GlassCard variant="dark" className="border-white/20 space-y-8">
          {/* Step 0: Business Type */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What type of business are you building?</h2>
                <p className="text-foreground/60">Choose the option that best fits your vision</p>
              </div>
              <div className="grid gap-3">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAnswers({ ...answers, businessType: type.id })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                      answers.businessType === type.id
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-neon-cyan transition-colors">
                          {type.label}
                        </div>
                        <div className="text-sm text-foreground/60 mt-1">{type.desc}</div>
                      </div>
                      {answers.businessType === type.id && (
                        <CheckCircle2 className="w-6 h-6 text-neon-cyan flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Stage */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What stage is your business at?</h2>
                <p className="text-foreground/60">Where are you in your journey?</p>
              </div>
              <div className="grid gap-3">
                {stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setAnswers({ ...answers, stage: stage.id })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                      answers.stage === stage.id
                        ? "border-neon-purple bg-neon-purple/10"
                        : "border-white/10 bg-white/5 hover:border-neon-purple/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-neon-purple transition-colors">
                          {stage.label}
                        </div>
                        <div className="text-sm text-foreground/60 mt-1">{stage.desc}</div>
                      </div>
                      {answers.stage === stage.id && (
                        <CheckCircle2 className="w-6 h-6 text-neon-purple flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What are your main goals?</h2>
                <p className="text-foreground/60">Select all that apply</p>
              </div>
              <div className="grid gap-3">
                {goalsList.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                      answers.goals.includes(goal.id)
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground group-hover:text-neon-cyan transition-colors">
                        {goal.label}
                      </span>
                      {answers.goals.includes(goal.id) && (
                        <CheckCircle2 className="w-6 h-6 text-neon-cyan flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Target Audience */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Who is your target audience?</h2>
                <p className="text-foreground/60">This helps us personalize your dashboard</p>
              </div>
              <div className="grid gap-3">
                {audienceOptions.map((audience) => (
                  <button
                    key={audience.id}
                    onClick={() => setAnswers({ ...answers, targetAudience: audience.id })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                      answers.targetAudience === audience.id
                        ? "border-neon-blue bg-neon-blue/10"
                        : "border-white/10 bg-white/5 hover:border-neon-blue/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground group-hover:text-neon-blue transition-colors">
                        {audience.label}
                      </span>
                      {answers.targetAudience === audience.id && (
                        <CheckCircle2 className="w-6 h-6 text-neon-blue flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Monthly Budget */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What's your monthly marketing budget?</h2>
                <p className="text-foreground/60">This helps us suggest the right plan for you</p>
              </div>
              <div className="grid gap-3">
                {budgetOptions.map((budget) => (
                  <button
                    key={budget.id}
                    onClick={() => setAnswers({ ...answers, monthlyBudget: budget.id })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                      answers.monthlyBudget === budget.id
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground group-hover:text-neon-cyan transition-colors">
                        {budget.label}
                      </span>
                      {answers.monthlyBudget === budget.id && (
                        <CheckCircle2 className="w-6 h-6 text-neon-cyan flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/10">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="px-6 py-3 rounded-lg btn-glass disabled:opacity-50 disabled:cursor-not-allowed text-foreground/80 hover:text-foreground transition-colors"
            >
              Back
            </button>

            <div className="text-sm text-foreground/60">
              Question {step + 1} of 5
            </div>

            <button
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="px-6 py-3 rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {step === 4 ? "Complete Survey" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
        <FooterLinks />
      </div>
    </div>
  );
}


