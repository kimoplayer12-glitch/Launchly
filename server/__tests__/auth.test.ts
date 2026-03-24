import { describe, it, expect, vi, beforeEach } from "vitest";

const { verifyAccessToken } = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock("../utils/jwt", () => ({
  verifyAccessToken,
}));

import { requireAuth } from "../middleware/auth";

describe("requireAuth middleware", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
  });

  it("rejects missing token", async () => {
    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts valid token", async () => {
    verifyAccessToken.mockReturnValue({
      sub: "user-1",
      email: "user@example.com",
    });
    const req: any = { headers: { authorization: "Bearer test" } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(req.user?.uid).toBe("user-1");
    expect(req.user?.email).toBe("user@example.com");
    expect(next).toHaveBeenCalled();
  });
});
