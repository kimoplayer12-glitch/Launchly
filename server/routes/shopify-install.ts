import { RequestHandler } from "express";

/**
 * Returns a Shopify App install URL (OAuth start).
 *
 * Demo Mode when SHOPIFY_API_KEY is not set.
 *
 * Env:
 * - SHOPIFY_API_KEY
 * - SHOPIFY_SCOPES (default: read_products,write_products,read_orders)
 * - SHOPIFY_REDIRECT_URI (optional)
 */
export const handleShopifyInstallUrl: RequestHandler = async (req, res) => {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes =
    process.env.SHOPIFY_SCOPES ||
    "read_products,write_products,read_orders,read_customers";
  const redirectUri =
    process.env.SHOPIFY_REDIRECT_URI ||
    "http://localhost:8080/integrations?shopify=connected";

  const shop = (req.query.shop as string | undefined)?.trim();

  if (!apiKey) {
    res.json({
      demoMode: true,
      url: redirectUri,
      message:
        "Shopify is not configured (SHOPIFY_API_KEY missing). Demo mode enabled.",
    });
    return;
  }

  if (!shop) {
    res.status(400).json({ error: "Missing ?shop=your-store.myshopify.com" });
    return;
  }

  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  const url = `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  res.json({ demoMode: false, url });
};
