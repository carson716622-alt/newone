import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@pd.gov",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createOfficerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "officer-user",
    email: "officer@pd.gov",
    name: "Officer Smith",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth router", () => {
  it("returns null user for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated context", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("officers router - authorization", () => {
  it("returns empty list when db is unavailable", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.officers.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("throws FORBIDDEN when non-admin tries to create officer", async () => {
    const ctx = createOfficerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.officers.create({
        badgeNumber: "9999",
        firstName: "Test",
        lastName: "Officer",
        rank: "officer",
        status: "active",
        maxWeeklyHours: 40,
      })
    ).rejects.toThrow();
  });

  it("throws FORBIDDEN when non-admin tries to delete officer", async () => {
    const ctx = createOfficerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.officers.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("shifts router - authorization", () => {
  it("returns empty list when db is unavailable", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shifts.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN when non-admin tries to create shift", async () => {
    const ctx = createOfficerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.shifts.create({
        name: "Test Shift",
        date: "2025-01-01",
        startTime: "08:00",
        endTime: "16:00",
        minimumOfficers: 2,
        status: "open",
      })
    ).rejects.toThrow();
  });
});

describe("pto router - authorization", () => {
  it("returns empty list when db is unavailable", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pto.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN when non-admin tries to approve PTO", async () => {
    const ctx = createOfficerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.pto.approve({ id: 1 })).rejects.toThrow();
  });
});

describe("dashboard router", () => {
  it("returns stats object when db is unavailable", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalOfficers");
    expect(stats).toHaveProperty("activeOfficers");
    expect(stats).toHaveProperty("shortageShifts");
    expect(stats).toHaveProperty("pendingPto");
    expect(stats).toHaveProperty("upcomingShifts");
    expect(stats).toHaveProperty("recentShortages");
  });
});
