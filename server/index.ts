import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeFirebase } from "./firebase-init";
import { handleDemo } from "./routes/demo";
import { handleGenerateBusinessPlan } from "./routes/generate-business-plan";
import { handleCreateCheckoutSession } from "./routes/stripe-checkout";
import { handleStripeConnectUrl } from "./routes/stripe-connect";
import { handleShopifyInstallUrl } from "./routes/shopify-install";
import { handleGenerateWebsite } from "./routes/generate-website";
import { handleGenerateStore } from "./routes/generate-store";
import { handlePaddleWebhook } from "./routes/paddle-webhook";
import {
  handleSchedulePost,
  handleGetScheduledPosts,
  handleConnectSocialAccount,
  handleGetOAuthUrl,
  handleOAuthCallback,
} from "./routes/social-media-scheduler";
import { handleContact } from "./routes/contact";
import {
  getMonetizeData,
  updateRevenueStream,
  connectPlatform,
  disconnectPlatform,
} from "./routes/monetize";
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  getIntegrationData,
} from "./routes/integrations";
import { getYouTubeChannelData } from "./routes/youtube-api";
import { handleAdminAddCredits } from "./routes/admin-add-credits";
import { requireAuth } from "./middleware/auth";
import {
  handleGoogleAuth,
  handleLogin,
  handleGetMe,
  handleSignup,
} from "./routes/auth";
import {
  handleGetGrowthPlan,
  handleSubmitOnboarding,
} from "./routes/onboarding";
import { handleTriggerDailyMotivation } from "./routes/admin-daily-motivation";
import {
  handleListWorkflows,
  handleCreateWorkflow,
  handleGetWorkflow,
  handleUpdateWorkflow,
  handlePublishWorkflow,
  handleRunWorkflow,
  handleListVersions,
  handleListExecutions,
  handleGetExecution,
  handleReplayExecution,
  handleWebhookTrigger,
  handleCreateCredential,
  handleListCredentials,
} from "./routes/automations";
import { handleAiExtract, handleAiGenerate } from "./routes/ai";
import { handleChatWithPlan } from "./routes/chat-with-plan";
import {
  handleAiAsk,
  handleAiBrief,
  handleAnalyticsOverview,
  handleConnectProvider,
  handleDisconnectProvider,
  handleListConnections,
  handleNangoWebhook,
  handleProviderCallback,
  handleSyncRun,
} from "./routes/analytics";
import { initializeDailyMotivationQueue } from "./queues/daily-motivation";

export function createServer() {
  const app = express();

  // Initialize Firebase Admin SDK
  initializeFirebase();

  // Middleware
  app.use(cors());
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  initializeDailyMotivationQueue().catch((error) => {
    console.error("[daily-motivation] queue initialization failed:", error);
  });

  // Auth + onboarding
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/google", handleGoogleAuth);
  app.get("/api/user/me", requireAuth, handleGetMe);
  app.post("/api/onboarding", requireAuth, handleSubmitOnboarding);
  app.get("/api/growth-plan", requireAuth, handleGetGrowthPlan);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/generate-business-plan", handleGenerateBusinessPlan);
  app.post("/api/chat-with-plan", handleChatWithPlan);

  // Payments & integrations
  app.post("/api/billing/checkout-session", handleCreateCheckoutSession);
  app.get("/api/integrations/stripe/connect-url", handleStripeConnectUrl);
  app.get("/api/integrations/shopify/install-url", handleShopifyInstallUrl);

  // Paddle payments
  app.post("/api/paddle-webhook", handlePaddleWebhook);

  // Generators (website/store)
  app.post("/api/generate/website", handleGenerateWebsite);
  app.post("/api/generate/store", handleGenerateStore);

  // Social media scheduler
  app.post("/api/social/schedule-post", handleSchedulePost);
  app.get("/api/social/scheduled-posts", handleGetScheduledPosts);
  app.post("/api/social/connect-account", handleConnectSocialAccount);
  app.get("/api/social/oauth-url", handleGetOAuthUrl);
  app.get("/api/social/oauth/callback", handleOAuthCallback);

  // Contact form
  app.post("/api/contact", handleContact);

  // Monetize Hub
  app.get("/api/monetize/data", getMonetizeData);
  app.post("/api/monetize/revenue-stream", updateRevenueStream);
  app.post("/api/monetize/connect-platform", connectPlatform);
  app.post("/api/monetize/disconnect-platform", disconnectPlatform);

  // Integrations
  app.get("/api/integrations", getIntegrations);
  app.post("/api/integrations/connect", connectIntegration);
  app.post("/api/integrations/disconnect", disconnectIntegration);
  app.get("/api/integrations/:integrationId/data", getIntegrationData);

  // Connected analytics (Nango + metrics)
  app.post("/api/integrations/:provider/connect", requireAuth, handleConnectProvider);
  app.post(
    "/api/integrations/:provider/disconnect",
    requireAuth,
    handleDisconnectProvider
  );
  app.get("/api/integrations/:provider/callback", handleProviderCallback);
  app.get("/api/integrations/connections", requireAuth, handleListConnections);
  app.post("/api/integrations/nango/webhook", handleNangoWebhook);
  app.post("/api/sync/run", requireAuth, handleSyncRun);
  app.get("/api/analytics/overview", requireAuth, handleAnalyticsOverview);
  app.post("/api/ai/brief", requireAuth, handleAiBrief);
  app.post("/api/ai/ask", requireAuth, handleAiAsk);

  // YouTube API
  app.post("/api/youtube/channel-data", getYouTubeChannelData);

  // Admin operations
  app.post("/api/admin/add-credits", handleAdminAddCredits);
  app.post(
    "/api/admin/trigger-daily-motivation",
    requireAuth,
    handleTriggerDailyMotivation
  );

  // Workflow automations
  app.get("/api/automations", requireAuth, handleListWorkflows);
  app.post("/api/automations", requireAuth, handleCreateWorkflow);
  app.get("/api/automations/:workflowId", requireAuth, handleGetWorkflow);
  app.patch("/api/automations/:workflowId", requireAuth, handleUpdateWorkflow);
  app.post(
    "/api/automations/:workflowId/publish",
    requireAuth,
    handlePublishWorkflow
  );
  app.post("/api/automations/:workflowId/run", requireAuth, handleRunWorkflow);
  app.get(
    "/api/automations/:workflowId/versions",
    requireAuth,
    handleListVersions
  );
  app.get(
    "/api/automations/:workflowId/executions",
    requireAuth,
    handleListExecutions
  );
  app.get("/api/executions/:executionId", requireAuth, handleGetExecution);
  app.post(
    "/api/executions/:executionId/replay",
    requireAuth,
    handleReplayExecution
  );

  app.post(
    "/api/automations/:workflowId/webhook/:secret",
    handleWebhookTrigger
  );

  // Credentials
  app.get("/api/credentials", requireAuth, handleListCredentials);
  app.post("/api/credentials", requireAuth, handleCreateCredential);

  // AI endpoints (used by node inspector)
  app.post("/api/ai/extract", requireAuth, handleAiExtract);
  app.post("/api/ai/generate", requireAuth, handleAiGenerate);

  return app;
}
