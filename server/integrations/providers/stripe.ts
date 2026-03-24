import { nangoProxyRequest } from "../nango";
import { getProviderConfigKey } from "../provider-config";
import type { DateRange, ProviderFetchResult } from "../types";

type StripeBalanceTransaction = {
  id: string;
  amount: number;
  currency: string;
  created: number;
  type: string;
  status?: string;
};

type StripeBalanceResponse = {
  data: StripeBalanceTransaction[];
  has_more: boolean;
};

function dateKeyFromUnix(timestamp: number) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

export async function fetchStripeMetrics(
  connectionId: string,
  range: DateRange
): Promise<ProviderFetchResult> {
  const start = Math.floor(range.start.getTime() / 1000);
  const end = Math.floor(range.end.getTime() / 1000);

  const metricsByDate: Record<
    string,
    { revenue: number; payouts: number; currency: string }
  > = {};

  let startingAfter: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const query: Record<string, string | number | boolean | undefined> = {
      limit: 100,
      "created[gte]": start,
      "created[lte]": end,
      starting_after: startingAfter,
    };

    const response = await nangoProxyRequest<StripeBalanceResponse>({
      providerConfigKey: getProviderConfigKey("stripe"),
      connectionId,
      method: "GET",
      endpoint: "/v1/balance_transactions",
      query,
    });

    response.data.forEach((tx) => {
      const key = dateKeyFromUnix(tx.created);
      if (!metricsByDate[key]) {
        metricsByDate[key] = { revenue: 0, payouts: 0, currency: tx.currency };
      }
      if (tx.type === "charge") {
        metricsByDate[key].revenue += Math.abs(tx.amount) / 100;
      }
      if (tx.type === "payout") {
        metricsByDate[key].payouts += Math.abs(tx.amount) / 100;
      }
    });

    hasMore = response.has_more;
    startingAfter = response.data.length
      ? response.data[response.data.length - 1].id
      : undefined;
  }

  const metrics = Object.entries(metricsByDate).map(([date, value]) => ({
    date,
    revenue: { total: value.revenue, currency: value.currency },
    payouts: { total: value.payouts, currency: value.currency },
  }));

  return {
    metrics,
    metadata: {
      currency: metrics[0]?.revenue?.currency,
    },
  };
}
