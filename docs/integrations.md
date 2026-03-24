# Connected Analytics Integrations

This feature uses **Nango** for OAuth, token refresh, and secure proxying. Tokens are never stored in Firestore.

## 1) Run Nango locally

The repo includes a Nango service in `docker-compose.yml`.

1. Create a `.env` file and add:
   - `NANGO_ENCRYPTION_KEY`
   - `NANGO_JWT_SECRET`
2. Start services:
   ```bash
   docker compose up -d
   ```
3. Nango API: `http://localhost:3003`
4. Nango Connect UI: `http://localhost:3009`

## 2) Configure Nango integrations

In the Nango dashboard, create integrations for:
`stripe`, `paypal`, `shopify`, `instagram`, `tiktok`

For each integration, set:
- **OAuth redirect URL**: `http://localhost:3003/oauth/callback`
- **Webhook URL**: `https://YOUR_APP_DOMAIN/api/integrations/nango/webhook`

If your integration keys are not exactly the provider names, set them via:
```
NANGO_INTEGRATION_STRIPE=
NANGO_INTEGRATION_PAYPAL=
NANGO_INTEGRATION_SHOPIFY=
NANGO_INTEGRATION_INSTAGRAM=
NANGO_INTEGRATION_TIKTOK=
```

## 3) Required environment variables (app)

```
NANGO_BASE_URL=http://localhost:3003
NANGO_SECRET_KEY=...
NANGO_CONNECT_URL=http://localhost:3009

OPENAI_API_KEY=...   # Required for AI briefs + Ask AI
```

## 4) Provider setup notes (MVP)

### Stripe (Connect OAuth)
- Use Stripe Connect OAuth in Nango.
- Required scopes: read-only for balance transactions and payouts.

### PayPal
- Use PayPal OAuth in Nango.
- Required scopes: reporting and transactions.

### Shopify
- Use Shopify OAuth in Nango.
- Required scopes: `read_orders` (and `read_products` if needed).
- Shopify API calls require `shopDomain` stored in connection metadata.

### Instagram (Professional accounts only)
- Accounts must be **Business** or **Creator** to access insights.
- Use Instagram Graph API permissions such as `instagram_basic`, `instagram_manage_insights`, `pages_show_list`.

### TikTok
- Use TikTok OAuth in Nango.
- Ensure scopes allow user info and video list access.

## 5) Testing

1. Connect a provider from **Settings → Connections**.
2. Wait for sync (or trigger manually via `POST /api/sync/run`).
3. Visit **Dashboard → Analytics Overview** for cards + charts.

## 6) Webhook signature

The webhook signature is verified in the API using `NANGO_SECRET_KEY`. Ensure the same secret is configured in Nango.
