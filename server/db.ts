import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, civilians, vehicles, calls, callNotes, callUnits, warrants, bolos, reports, notifications } from "../drizzle/schema";
import type { InsertCivilian, InsertVehicle, InsertCall, InsertCallNote, InsertCallUnit, InsertWarrant, InsertBolo, InsertReport, InsertNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ USER / UNIT MANAGEMENT ============

export async function getAllUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.department, users.callsign);
}

export async function updateUserDepartment(userId: number, department: string, badgeNumber?: string, callsign?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ department: department as any, badgeNumber, callsign }).where(eq(users.id, userId));
}

export async function updateUnitStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ unitStatus: status as any }).where(eq(users.id, userId));
}

// ============ CIVILIANS ============

export async function getCivilians(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(civilians).where(
      or(
        like(civilians.firstName, `%${search}%`),
        like(civilians.lastName, `%${search}%`),
        like(civilians.licenseNumber, `%${search}%`)
      )
    ).orderBy(desc(civilians.createdAt)).limit(50);
  }
  return db.select().from(civilians).orderBy(desc(civilians.createdAt)).limit(50);
}

export async function getCivilianById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(civilians).where(eq(civilians.id, id)).limit(1);
  return result[0];
}

export async function createCivilian(data: InsertCivilian) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(civilians).values(data);
  return result[0].insertId;
}

export async function updateCivilian(id: number, data: Partial<InsertCivilian>) {
  const db = await getDb();
  if (!db) return;
  await db.update(civilians).set(data).where(eq(civilians.id, id));
}

// ============ VEHICLES ============

export async function getVehicles(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(vehicles).where(
      or(
        like(vehicles.plate, `%${search}%`),
        like(vehicles.make, `%${search}%`),
        like(vehicles.model, `%${search}%`),
        like(vehicles.vin, `%${search}%`)
      )
    ).orderBy(desc(vehicles.createdAt)).limit(50);
  }
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt)).limit(50);
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result[0];
}

export async function getVehiclesByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.ownerId, ownerId));
}

export async function createVehicle(data: InsertVehicle) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(vehicles).values(data);
  return result[0].insertId;
}

// ============ CALLS FOR SERVICE ============

export async function getCalls(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status && status !== "all") {
    return db.select().from(calls).where(eq(calls.status, status as any)).orderBy(desc(calls.createdAt)).limit(100);
  }
  return db.select().from(calls).orderBy(desc(calls.createdAt)).limit(100);
}

export async function getActiveCalls() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calls).where(
    or(
      eq(calls.status, "pending"),
      eq(calls.status, "dispatched"),
      eq(calls.status, "en_route"),
      eq(calls.status, "on_scene")
    )
  ).orderBy(desc(calls.createdAt));
}

export async function getCallById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(calls).where(eq(calls.id, id)).limit(1);
  return result[0];
}

export async function createCall(data: InsertCall) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(calls).values(data);
  return result[0].insertId;
}

export async function updateCall(id: number, data: Partial<InsertCall>) {
  const db = await getDb();
  if (!db) return;
  await db.update(calls).set(data).where(eq(calls.id, id));
}

export async function getCallNotes(callId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callNotes).where(eq(callNotes.callId, callId)).orderBy(desc(callNotes.createdAt));
}

export async function addCallNote(data: InsertCallNote) {
  const db = await getDb();
  if (!db) return;
  await db.insert(callNotes).values(data);
}

export async function getCallUnits(callId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callUnits).where(eq(callUnits.callId, callId));
}

export async function assignUnitToCall(data: InsertCallUnit) {
  const db = await getDb();
  if (!db) return;
  await db.insert(callUnits).values(data);
}

export async function clearUnitFromCall(callId: number, unitId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(callUnits).set({ clearedAt: new Date() }).where(
    and(eq(callUnits.callId, callId), eq(callUnits.unitId, unitId))
  );
}

// ============ WARRANTS ============

export async function getWarrants(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status && status !== "all") {
    return db.select().from(warrants).where(eq(warrants.status, status as any)).orderBy(desc(warrants.createdAt)).limit(50);
  }
  return db.select().from(warrants).orderBy(desc(warrants.createdAt)).limit(50);
}

export async function createWarrant(data: InsertWarrant) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(warrants).values(data);
  return result[0].insertId;
}

export async function updateWarrant(id: number, data: Partial<InsertWarrant>) {
  const db = await getDb();
  if (!db) return;
  await db.update(warrants).set(data).where(eq(warrants.id, id));
}

// ============ BOLOs ============

export async function getBolos(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status && status !== "all") {
    return db.select().from(bolos).where(eq(bolos.status, status as any)).orderBy(desc(bolos.createdAt)).limit(50);
  }
  return db.select().from(bolos).orderBy(desc(bolos.createdAt)).limit(50);
}

export async function createBolo(data: InsertBolo) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(bolos).values(data);
  return result[0].insertId;
}

export async function updateBolo(id: number, data: Partial<InsertBolo>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bolos).set(data).where(eq(bolos.id, id));
}

// ============ REPORTS ============

export async function getReports(type?: string) {
  const db = await getDb();
  if (!db) return [];
  if (type && type !== "all") {
    return db.select().from(reports).where(eq(reports.type, type as any)).orderBy(desc(reports.createdAt)).limit(50);
  }
  return db.select().from(reports).orderBy(desc(reports.createdAt)).limit(50);
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(reports).values(data);
  return result[0].insertId;
}

export async function updateReport(id: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reports).set(data).where(eq(reports.id, id));
}

// ============ NOTIFICATIONS ============

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(
    and(eq(notifications.userId, userId), eq(notifications.isRead, false))
  );
  return result[0]?.count ?? 0;
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(
    and(eq(notifications.id, id), eq(notifications.userId, userId))
  );
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ============ STATS ============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { activeCalls: 0, availableUnits: 0, activeWarrants: 0, activeBolos: 0 };

  const [activeCallsResult, availableUnitsResult, activeWarrantsResult, activeBolosResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(calls).where(
      or(eq(calls.status, "pending"), eq(calls.status, "dispatched"), eq(calls.status, "en_route"), eq(calls.status, "on_scene"))
    ),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.unitStatus, "available")),
    db.select({ count: sql<number>`count(*)` }).from(warrants).where(eq(warrants.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(bolos).where(eq(bolos.status, "active")),
  ]);

  return {
    activeCalls: activeCallsResult[0]?.count ?? 0,
    availableUnits: availableUnitsResult[0]?.count ?? 0,
    activeWarrants: activeWarrantsResult[0]?.count ?? 0,
    activeBolos: activeBolosResult[0]?.count ?? 0,
  };
}

// ============ CASE NUMBER GENERATION ============

export function generateCaseNumber(prefix: string = "CAD"): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `${prefix}-${year}${month}${day}-${random}`;
}
