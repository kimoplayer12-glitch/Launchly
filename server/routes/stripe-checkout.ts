import { RequestHandler } from "express";

/**
 * Create a Stripe Checkout Session for Launchly subscription.
 *
 * Works in Demo Mode when STRIPE_SECRET_KEY is not set so the app runs 100% locally.
 */
export const handleCreateCheckoutSession: RequestHandler = async (req, res) => {
  const { priceId, successUrl, cancelUrl } = req.body || {};

  // Demo mode: no Stripe configured
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.json({
      demoMode: true,
      checkoutUrl: (successUrl as string) || "http://localhost:8080/dashboard?billing=demo",
      message:
        "Stripe is not configured (STRIPE_SECRET_KEY missing). Running in demo mode.",
    });
    return;
  }

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  try {
    // Dynamic import to avoid bundling issues if Stripe isn't installed.
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        (successUrl as string) ||
        "http://localhost:8080/dashboard?billing=success",
      cancel_url:
        (cancelUrl as string) || "http://localhost:8080/pricing?billing=cancel",
      allow_promotion_codes: true,
    });

    res.json({ checkoutUrl: session.url, demoMode: false });
  } catch (err) {
    console.error("stripe checkout error", err);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
