import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BusinessPlanChat from "@/components/BusinessPlanChat";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import FooterLinks from "@/components/FooterLinks";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationState {
  plan?: string;
  businessName?: string;
}

export default function BusinessPlanChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [plan, setPlan] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Your Business");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.plan) {
      setPlan(state.plan);
      setBusinessName(state.businessName || "Your Business");
    }
  }, [location]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/business-builder")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Business Plan Chat
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Get personalized insights about your {businessName} business plan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component - Full Height */}
      <div className="flex-1 container mx-auto px-4 pb-6">
        <div className="h-full bg-card rounded-lg border border-border shadow-lg overflow-hidden">
          <BusinessPlanChat
            plan={plan}
            businessName={businessName}
          />
        </div>
      </div>
      <FooterLinks />
    </div>
  );
}

