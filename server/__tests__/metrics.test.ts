import { describe, it, expect } from "vitest";
import { mergeProviderMetrics } from "../integrations/metrics";

describe("mergeProviderMetrics", () => {
  it("merges provider metrics and recalculates totals", () => {
    const existing: any = {
      date: "2026-02-10",
      revenue: { total: 100, byProvider: { stripe: 100 } },
      payouts: { total: 40, byProvider: { stripe: 40 } },
      sales: { orders: 2, gross: 100, byProvider: { shopify: { orders: 2, gross: 100 } } },
      socials: { byProvider: {} },
    };

    const incoming = {
      date: "2026-02-10",
      revenue: { total: 50, currency: "USD" },
      sales: { orders: 1, gross: 50, currency: "USD" },
    };

    const merged = mergeProviderMetrics(existing, "paypal", incoming);
    expect(merged.revenue?.total).toBe(150);
    expect(merged.sales?.orders).toBe(3);
  });
});
