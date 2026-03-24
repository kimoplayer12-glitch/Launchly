import { nangoProxyRequest } from "../nango";
import { getProviderConfigKey } from "../provider-config";
import type { DateRange, ProviderFetchResult } from "../types";

type PayPalTransaction = {
  transaction_info: {
    transaction_id: string;
    transaction_initiation_date: string;
    transaction_amount?: { value: string; currency_code: string };
    transaction_status?: string;
  };
};

type PayPalResponse = {
  transaction_details?: PayPalTransaction[];
};

function dateKeyFromIso(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function fetchPayPalMetrics(
  connectionId: string,
  range: DateRange
): Promise<ProviderFetchResult> {
  const metricsByDate: Record<string, { revenue: number; currency: string }> = {};

  const response = await nangoProxyRequest<PayPalResponse>({
    providerConfigKey: getProviderConfigKey("paypal"),
    connectionId,
    method: "GET",
    endpoint: "/v1/reporting/transactions",
    query: {
      start_date: range.start.toISOString(),
      end_date: range.end.toISOString(),
      fields: "all",
      page_size: 100,
    },
  });

  (response.transaction_details || []).forEach((item) => {
    const info = item.transaction_info;
    if (!info?.transaction_amount?.value) return;
    const dateKey = dateKeyFromIso(info.transaction_initiation_date);
    const amount = Number(info.transaction_amount.value);
    if (!metricsByDate[dateKey]) {
      metricsByDate[dateKey] = {
        revenue: 0,
        currency: info.transaction_amount.currency_code,
      };
    }
    metricsByDate[dateKey].revenue += amount;
  });

  const metrics = Object.entries(metricsByDate).map(([date, value]) => ({
    date,
    revenue: { total: value.revenue, currency: value.currency },
  }));

  return {
    metrics,
    metadata: {
      currency: metrics[0]?.revenue?.currency,
    },
  };
}
