import { nangoProxyRequest } from "../nango";
import { getProviderConfigKey } from "../provider-config";
import type { DateRange, ProviderFetchResult } from "../types";

type ShopifyOrder = {
  id: number;
  created_at: string;
  total_price: string;
  currency?: string;
};

type ShopifyOrdersResponse = {
  orders: ShopifyOrder[];
};

export async function fetchShopifyMetrics(
  connectionId: string,
  range: DateRange,
  shopDomain?: string
): Promise<ProviderFetchResult> {
  if (!shopDomain) {
    throw new Error("Shopify shop domain is missing.");
  }

  const metricsByDate: Record<
    string,
    { orders: number; gross: number; currency: string }
  > = {};

  const response = await nangoProxyRequest<ShopifyOrdersResponse>({
    providerConfigKey: getProviderConfigKey("shopify"),
    connectionId,
    method: "GET",
    endpoint: "/admin/api/2024-01/orders.json",
    query: {
      status: "any",
      limit: 250,
      created_at_min: range.start.toISOString(),
      created_at_max: range.end.toISOString(),
    },
    baseUrlOverride: `https://${shopDomain}`,
  });

  response.orders.forEach((order) => {
    const dateKey = new Date(order.created_at).toISOString().slice(0, 10);
    if (!metricsByDate[dateKey]) {
      metricsByDate[dateKey] = {
        orders: 0,
        gross: 0,
        currency: order.currency || "USD",
      };
    }
    metricsByDate[dateKey].orders += 1;
    metricsByDate[dateKey].gross += Number(order.total_price || 0);
  });

  const metrics = Object.entries(metricsByDate).map(([date, value]) => ({
    date,
    sales: {
      orders: value.orders,
      gross: value.gross,
      currency: value.currency,
    },
  }));

  return {
    metrics,
    metadata: {
      shopDomain,
      currency: metrics[0]?.sales?.currency,
    },
  };
}
