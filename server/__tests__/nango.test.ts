import { describe, it, expect, vi, beforeEach } from "vitest";
import { createConnectSession } from "../integrations/nango";

describe("Nango connect session", () => {
  beforeEach(() => {
    process.env.NANGO_SECRET_KEY = "test_secret";
    process.env.NANGO_BASE_URL = "https://api.nango.dev";
    vi.restoreAllMocks();
  });

  it("returns session token and connect link", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "sess_123", connect_link: "https://connect" }),
    });
    // @ts-ignore
    global.fetch = fetchMock;

    const result = await createConnectSession({
      endUserId: "user_1",
      allowedIntegrations: ["stripe"],
    });

    expect(result.sessionToken).toBe("sess_123");
    expect(result.connectUrl).toBe("https://connect");
  });
});
