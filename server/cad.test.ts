import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "officer@test.com",
    name: "Test Officer",
    loginMethod: "manus",
    role: "admin",
    department: "leo",
    badgeNumber: "1234",
    callsign: "L-12",
    unitStatus: "available",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("CAD System - Auth", () => {
  it("auth.me returns user when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test Officer");
    expect(result?.role).toBe("admin");
  });

  it("auth.me returns null when unauthenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.logout clears cookie and returns success", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      ...createMockContext(),
      res: {
        clearCookie: (name: string, options: any) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0].name).toBe(COOKIE_NAME);
  });
});

describe("CAD System - Protected Routes", () => {
  it("dashboard.stats throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats()).rejects.toThrow();
  });

  it("calls.create throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calls.create({
        nature: "Traffic Stop",
        priority: "code_2",
        location: "123 Main St",
        department: "leo",
      })
    ).rejects.toThrow();
  });

  it("civilians.create throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.civilians.create({
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "01/01/1990",
        gender: "male",
      })
    ).rejects.toThrow();
  });

  it("warrants.create throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.warrants.create({
        suspectName: "Jane Doe",
        charges: "Grand Theft Auto",
      })
    ).rejects.toThrow();
  });

  it("bolos.create throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.bolos.create({
        title: "Stolen Vehicle",
        description: "Blue sedan heading east",
      })
    ).rejects.toThrow();
  });

  it("reports.create throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reports.create({
        type: "arrest",
        title: "DUI Arrest",
        narrative: "Subject arrested for DUI",
      })
    ).rejects.toThrow();
  });

  it("notifications.list throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});

describe("CAD System - Admin Routes", () => {
  it("units.adminUpdate throws FORBIDDEN for non-admin users", async () => {
    const ctx = createMockContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.units.adminUpdate({
        userId: 2,
        department: "fire_ems",
      })
    ).rejects.toThrow();
  });
});

describe("CAD System - Input Validation", () => {
  it("calls.create rejects invalid priority", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calls.create({
        nature: "Test",
        priority: "invalid_priority" as any,
        location: "123 Main St",
        department: "leo",
      })
    ).rejects.toThrow();
  });

  it("calls.create rejects empty nature", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calls.create({
        nature: "",
        priority: "code_1",
        location: "123 Main St",
        department: "leo",
      })
    ).rejects.toThrow();
  });

  it("calls.create rejects empty location", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calls.create({
        nature: "Traffic Stop",
        priority: "code_1",
        location: "",
        department: "leo",
      })
    ).rejects.toThrow();
  });

  it("civilians.create rejects invalid gender", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.civilians.create({
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "01/01/1990",
        gender: "invalid" as any,
      })
    ).rejects.toThrow();
  });

  it("warrants.create rejects empty suspect name", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.warrants.create({
        suspectName: "",
        charges: "Theft",
      })
    ).rejects.toThrow();
  });

  it("reports.create rejects invalid report type", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reports.create({
        type: "invalid_type" as any,
        title: "Test",
        narrative: "Test narrative",
      })
    ).rejects.toThrow();
  });

  it("units.updateStatus rejects invalid status", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.units.updateStatus({ status: "invalid" as any })
    ).rejects.toThrow();
  });

  it("units.updateStatus accepts valid status values", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    // This should not throw (validation passes), even if DB is unavailable
    const validStatuses = ["available", "busy", "en_route", "on_scene", "off_duty"] as const;
    for (const status of validStatuses) {
      // Just verify it doesn't throw a validation error
      try {
        await caller.units.updateStatus({ status });
      } catch (e: any) {
        // DB errors are fine, validation errors are not
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });
});

describe("CAD System - Shared Types", () => {
  it("UNIT_STATUS_LABELS has all required statuses", async () => {
    const { UNIT_STATUS_LABELS } = await import("../shared/types");
    expect(UNIT_STATUS_LABELS.available).toBe("Available");
    expect(UNIT_STATUS_LABELS.busy).toBe("Busy");
    expect(UNIT_STATUS_LABELS.en_route).toBe("En Route");
    expect(UNIT_STATUS_LABELS.on_scene).toBe("On Scene");
    expect(UNIT_STATUS_LABELS.off_duty).toBe("Off Duty");
  });

  it("CALL_PRIORITY_LABELS has all required priorities", async () => {
    const { CALL_PRIORITY_LABELS } = await import("../shared/types");
    expect(CALL_PRIORITY_LABELS.code_1).toBe("Code 1");
    expect(CALL_PRIORITY_LABELS.code_2).toBe("Code 2");
    expect(CALL_PRIORITY_LABELS.code_3).toBe("Code 3");
    expect(CALL_PRIORITY_LABELS.code_4).toBe("Code 4");
  });

  it("CALL_STATUS_LABELS has all required statuses", async () => {
    const { CALL_STATUS_LABELS } = await import("../shared/types");
    expect(CALL_STATUS_LABELS.pending).toBe("Pending");
    expect(CALL_STATUS_LABELS.dispatched).toBe("Dispatched");
    expect(CALL_STATUS_LABELS.en_route).toBe("En Route");
    expect(CALL_STATUS_LABELS.on_scene).toBe("On Scene");
    expect(CALL_STATUS_LABELS.closed).toBe("Closed");
  });

  it("DEPARTMENT_LABELS has all required departments", async () => {
    const { DEPARTMENT_LABELS } = await import("../shared/types");
    expect(DEPARTMENT_LABELS.leo).toBe("Law Enforcement");
    expect(DEPARTMENT_LABELS.fire_ems).toBe("Fire/EMS");
    expect(DEPARTMENT_LABELS.dispatch).toBe("Dispatch");
    expect(DEPARTMENT_LABELS.admin).toBe("Admin");
  });
});

describe("CAD System - Case Number Generation", () => {
  it("generateCaseNumber creates proper format", async () => {
    const { generateCaseNumber } = await import("./db");
    const caseNum = generateCaseNumber("CFS");
    expect(caseNum).toMatch(/^CFS-\d{6}-\d{4}$/);
  });

  it("generateCaseNumber uses correct prefix", async () => {
    const { generateCaseNumber } = await import("./db");
    expect(generateCaseNumber("ARR")).toMatch(/^ARR-/);
    expect(generateCaseNumber("CIT")).toMatch(/^CIT-/);
    expect(generateCaseNumber("PCR")).toMatch(/^PCR-/);
    expect(generateCaseNumber("FIR")).toMatch(/^FIR-/);
  });

  it("generateCaseNumber produces unique values", async () => {
    const { generateCaseNumber } = await import("./db");
    const numbers = new Set<string>();
    for (let i = 0; i < 100; i++) {
      numbers.add(generateCaseNumber("CFS"));
    }
    // With 4 random digits, collisions in 100 tries should be very rare
    expect(numbers.size).toBeGreaterThan(90);
  });
});
