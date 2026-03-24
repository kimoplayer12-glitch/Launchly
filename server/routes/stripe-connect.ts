import { RequestHandler } from "express";

/**
 * Returns a Stripe Connect OAuth URL.
 *
 * Demo Mode when STRIPE_CONNECT_CLIENT_ID is not set.
 *
 * Env:
 * - STRIPE_CONNECT_CLIENT_ID
 * - STRIPE_CONNECT_REDIRECT_URI (optional)
 */
export const handleStripeConnectUrl: RequestHandler = async (req, res) => {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  const redirectUri =
    process.env.STRIPE_CONNECT_REDIRECT_URI ||
    "http://localhost:8080/integrations?stripe=connected";

  if (!clientId) {
    res.json({
      demoMode: true,
      url: `${redirectUri}`,
      message:
        "Stripe Connect is not configured (STRIPE_CONNECT_CLIENT_ID missing). Demo mode enabled.",
    });
    return;
  }

  // For MVP we only generate the OAuth URL. Exchanging the code should be done in a callback endpoint later.
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: redirectUri,
  });

  const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  res.json({ demoMode: false, url });
};
