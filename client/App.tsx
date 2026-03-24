import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Layout from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  RequireAuth,
  RequireOnboardingCompletion,
} from "@/components/RouteGuards";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";
import { logFirebaseStatus } from "@/lib/firebase-health-check";

// Lazy load authenticated pages for better performance
const Survey = lazy(() => import("@/pages/Survey"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const BusinessBuilder = lazy(() => import("@/pages/BusinessBuilder"));
const BusinessPlanChatPage = lazy(() => import("@/pages/BusinessPlanChatPage"));
const BrandStarter = lazy(() => import("@/pages/BrandStarter"));
const SocialMediaScheduler = lazy(() => import("@/pages/SocialMediaScheduler"));
const MonetizeHub = lazy(() => import("@/pages/MonetizeHub"));
const SocialPoster = lazy(() => import("@/pages/SocialPoster"));
const AdGen = lazy(() => import("@/pages/AdGen"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const WebsiteGenerator = lazy(() => import("@/pages/WebsiteGenerator"));
const StoreGenerator = lazy(() => import("@/pages/StoreGenerator"));
const Settings = lazy(() => import("@/pages/Settings"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const Contact = lazy(() => import("@/pages/Contact"));
const Status = lazy(() => import("@/pages/Status"));
const Changelog = lazy(() => import("@/pages/Changelog"));
const WebsiteGenerate = lazy(() => import("@/pages/WebsiteGenerate"));
const WebsiteProjectEditor = lazy(() => import("@/pages/WebsiteProjectEditor"));
const WebsitePreview = lazy(() => import("@/pages/WebsitePreview"));
const Automations = lazy(() => import("@/pages/Automations"));
const AutomationEditor = lazy(() => import("@/pages/AutomationEditor"));
const AutomationLogs = lazy(() => import("@/pages/AutomationLogs"));
const AnalyticsOverview = lazy(() => import("@/pages/AnalyticsOverview"));
const SettingsConnections = lazy(() => import("@/pages/SettingsConnections"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const GrowthPlan = lazy(() => import("@/pages/GrowthPlan"));

const queryClient = new QueryClient();

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border border-neon-cyan border-t-transparent"></div>
        <div className="text-foreground/60">Loading...</div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    logFirebaseStatus();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/onboarding"
                    element={
                      <RequireAuth>
                        <Onboarding />
                      </RequireAuth>
                    }
                  />
                  <Route path="/survey" element={<Survey />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireOnboardingCompletion>
                        <Dashboard />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route
                    path="/growth-plan"
                    element={
                      <RequireOnboardingCompletion>
                        <GrowthPlan />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route path="/business-builder" element={<BusinessBuilder />} />
                  <Route path="/business-plan-chat" element={<BusinessPlanChatPage />} />
                  <Route path="/brand-starter" element={<BrandStarter />} />
                  <Route path="/social-media-scheduler" element={<SocialMediaScheduler />} />
                  <Route path="/monetize-hub" element={<MonetizeHub />} />
                  <Route path="/social-poster" element={<SocialPoster />} />
                  <Route path="/adgen" element={<AdGen />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/generate-website" element={<WebsiteGenerator />} />
                  <Route path="/generate-store" element={<StoreGenerator />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/connections" element={<SettingsConnections />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/status" element={<Status />} />
                  <Route path="/changelog" element={<Changelog />} />
                  <Route
                    path="/dashboard/generate"
                    element={
                      <RequireOnboardingCompletion>
                        <WebsiteGenerate />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route
                    path="/dashboard/projects/:projectId"
                    element={
                      <RequireOnboardingCompletion>
                        <WebsiteProjectEditor />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route path="/preview/:projectId" element={<WebsitePreview />} />
                  <Route
                    path="/dashboard/automations"
                    element={
                      <RequireOnboardingCompletion>
                        <Automations />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route
                    path="/dashboard/automations/:id"
                    element={
                      <RequireOnboardingCompletion>
                        <AutomationEditor />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route
                    path="/dashboard/automations/:id/logs"
                    element={
                      <RequireOnboardingCompletion>
                        <AutomationLogs />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route
                    path="/dashboard/analytics"
                    element={
                      <RequireOnboardingCompletion>
                        <AnalyticsOverview />
                      </RequireOnboardingCompletion>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
