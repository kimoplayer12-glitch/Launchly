import type { DateRange, ProviderFetchResult, ProviderKey } from "../types";
import { fetchStripeMetrics } from "./stripe";
import { fetchPayPalMetrics } from "./paypal";
import { fetchShopifyMetrics } from "./shopify";
import { fetchInstagramMetrics } from "./instagram";
import { fetchTikTokMetrics } from "./tiktok";

export function isSupportedProvider(value: string): value is ProviderKey {
  return ["stripe", "paypal", "shopify", "instagram", "tiktok"].includes(value);
}

export async function fetchProviderMetrics(
  provider: ProviderKey,
  connectionId: string,
  range: DateRange,
  metadata?: { shopDomain?: string }
): Promise<ProviderFetchResult> {
  switch (provider) {
    case "stripe":
      return fetchStripeMetrics(connectionId, range);
    case "paypal":
      return fetchPayPalMetrics(connectionId, range);
    case "shopify":
      return fetchShopifyMetrics(connectionId, range, metadata?.shopDomain);
    case "instagram":
      return fetchInstagramMetrics(connectionId, range);
    case "tiktok":
      return fetchTikTokMetrics(connectionId, range);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
