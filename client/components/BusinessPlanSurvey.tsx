import { useState } from "react";
import GlassCard from "./GlassCard";
import { ArrowRight, Sparkles, Loader } from "lucide-react";
import { toast } from "./ui/use-toast";

interface SurveyData {
  businessName: string;
  industry: string;
  mission: string;
  targetMarket: string;
  mainProducts: string;
  fundingNeeds: string;
  teamSize: string;
  timeline: string;
}

interface BusinessPlanSurveyProps {
  onPlanGenerated: (plan: string, businessName: string) => void;
}

export default function BusinessPlanSurvey({ onPlanGenerated }: BusinessPlanSurveyProps) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    businessName: "",
    industry: "",
    mission: "",
    targetMarket: "",
    mainProducts: "",
    fundingNeeds: "",
    teamSize: "",
    timeline: "",
  });

  const industries = [
    "SaaS",
    "E-commerce",
    "Agency",
    "Healthcare",
    "Education",
    "Finance",
    "Retail",
    "Manufacturing",
    "Entertainment",
    "Other",
  ];

  const fundingOptions = [
    "No funding needed",
    "Under $50K",
    "$50K - $250K",
    "$250K - $1M",
    "$1M - $5M",
    "$5M+",
  ];

  const teamSizeOptions = ["Solo (1 person)", "Small (2-5)", "Medium (6-20)", "Large (20+)"];

  const timelineOptions = [
    "Already launched",
    "0-3 months",
    "3-6 months",
    "6-12 months",
    "12+ months",
  ];

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    setSurveyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 0:
        return surveyData.businessName.trim().length > 0;
      case 1:
        return surveyData.industry.length > 0;
      case 2:
        return surveyData.mission.trim().length > 0;
      case 3:
        return surveyData.targetMarket.trim().length > 0;
      case 4:
        return surveyData.mainProducts.trim().length > 0;
      case 5:
        return surveyData.fundingNeeds.length > 0;
      case 6:
        return surveyData.teamSize.length > 0;
      case 7:
        return surveyData.timeline.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    const prompt = `Create a comprehensive business plan based on the following information:

Business Name: ${surveyData.businessName}
Industry: ${surveyData.industry}
Mission: ${surveyData.mission}
Target Market: ${surveyData.targetMarket}
Main Products/Services: ${surveyData.mainProducts}
Funding Needs: ${surveyData.fundingNeeds}
Team Size: ${surveyData.teamSize}
Launch Timeline: ${surveyData.timeline}

Please provide a detailed, professional business plan that includes:
1. Executive Summary
2. Company Description
3. Market Analysis
4. Organization & Management
5. Service/Product Line
6. Marketing & Sales Strategy
7. Funding Requirements
8. Financial Projections
9. Risk Analysis
10. Success Milestones

Format it in a clear, structured way that can be easily read and implemented.`;

    try {
      const response = await fetch("/api/generate-business-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.businessPlan) {
        toast({
          title: "Success!",
          description: "Your business plan has been generated",
        });
        onPlanGenerated(data.businessPlan, surveyData.businessName);
      } else if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        onPlanGenerated(`Error: ${data.error}`, surveyData.businessName);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate business plan. Please try again.",
          variant: "destructive",
        });
        onPlanGenerated("Error generating business plan. Please try again.", surveyData.businessName);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `${errorMsg}. Please make sure your OpenAI API key is configured.`,
        variant: "destructive",
      });
      console.error("Error generating business plan:", error);
      onPlanGenerated(
        `Error: ${errorMsg}. Please make sure your OpenAI API key is configured.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard variant="dark" className="border-white/20 space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create Your Business Plan</h2>
          <span className="text-sm text-foreground/60">Step {step + 1} of 8</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
            style={{ width: `${((step + 1) / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6 min-h-48">
        {/* Step 0: Business Name */}
        {step === 0 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-2 block">What's your business name?</span>
              <input
                type="text"
                value={surveyData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                placeholder="e.g., TechFlow Solutions"
                className="input-glass w-full text-base"
                autoFocus
              />
            </label>
          </div>
        )}

        {/* Step 1: Industry */}
        {step === 1 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-3 block">What industry are you in?</span>
              <select
                value={surveyData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                className="input-glass w-full text-base"
              >
                <option value="">Select an industry...</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Step 2: Mission */}
        {step === 2 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-2 block">What's your business mission?</span>
              <p className="text-sm text-foreground/60 mb-3">
                Describe the core purpose and vision of your business
              </p>
              <textarea
                value={surveyData.mission}
                onChange={(e) => handleInputChange("mission", e.target.value)}
                placeholder="e.g., To empower businesses with affordable, scalable software solutions..."
                className="input-glass w-full text-base min-h-32 resize-none"
              />
            </label>
          </div>
        )}

        {/* Step 3: Target Market */}
        {step === 3 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-2 block">Who is your target market?</span>
              <textarea
                value={surveyData.targetMarket}
                onChange={(e) => handleInputChange("targetMarket", e.target.value)}
                placeholder="e.g., Small to medium-sized businesses (50-500 employees) in the tech industry..."
                className="input-glass w-full text-base min-h-32 resize-none"
              />
            </label>
          </div>
        )}

        {/* Step 4: Products/Services */}
        {step === 4 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-2 block">
                What are your main products or services?
              </span>
              <textarea
                value={surveyData.mainProducts}
                onChange={(e) => handleInputChange("mainProducts", e.target.value)}
                placeholder="e.g., Cloud-based project management software with AI-powered task automation..."
                className="input-glass w-full text-base min-h-32 resize-none"
              />
            </label>
          </div>
        )}

        {/* Step 5: Funding */}
        {step === 5 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-3 block">How much funding do you need?</span>
              <div className="space-y-2">
                {fundingOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleInputChange("fundingNeeds", option)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      surveyData.fundingNeeds === option
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-white/10 bg-white/5 hover:border-neon-cyan/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </label>
          </div>
        )}

        {/* Step 6: Team Size */}
        {step === 6 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-3 block">What's your current team size?</span>
              <div className="space-y-2">
                {teamSizeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleInputChange("teamSize", option)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      surveyData.teamSize === option
                        ? "border-neon-purple bg-neon-purple/10"
                        : "border-white/10 bg-white/5 hover:border-neon-purple/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </label>
          </div>
        )}

        {/* Step 7: Timeline */}
        {step === 7 && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold mb-3 block">When do you plan to launch?</span>
              <div className="space-y-2">
                {timelineOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleInputChange("timeline", option)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      surveyData.timeline === option
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-white/10 bg-white/5 hover:border-neon-cyan/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/10">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-6 py-3 rounded-lg btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isStepValid() || isLoading}
          className="px-6 py-3 rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : step === 7 ? (
            <>
              <Sparkles className="w-4 h-4" /> Generate Plan
            </>
          ) : (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </GlassCard>
  );
}

