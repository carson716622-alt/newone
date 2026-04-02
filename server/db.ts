import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, appUsers, couples, hearts, messages, type InsertAppUser, type InsertCouple, type InsertHeart, type InsertMessage } from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ─── Manus OAuth User (framework) ──────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field]; if (value === undefined) return;
      const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── App Users (Custom Auth) ───────────────────────────────────────────────

export async function createAppUser(data: InsertAppUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appUsers).values(data);
  return result[0].insertId;
}

export async function getAppUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserByInviteCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.inviteCode, code.toUpperCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAppUserCouple(userId: number, coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set({ coupleId }).where(eq(appUsers.id, userId));
}

// ─── Couples ───────────────────────────────────────────────────────────────

export async function createCouple(data: InsertCouple) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(couples).values(data);
  return result[0].insertId;
}

export async function getCoupleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(couples).where(eq(couples.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Hearts ────────────────────────────────────────────────────────────────

export async function sendHeart(data: InsertHeart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hearts).values(data);
  return result[0].insertId;
}

export async function getHeartsByCoupleId(coupleId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearts).where(eq(hearts.coupleId, coupleId)).orderBy(desc(hearts.createdAt)).limit(limit);
}

export async function getHeartCountForUser(userId: number) {
  const db = await getDb();
  if (!db) return { sent: 0, received: 0 };
  const [sentResult] = await db.select({ count: sql<number>`count(*)` }).from(hearts).where(eq(hearts.senderId, userId));
  const [receivedResult] = await db.select({ count: sql<number>`count(*)` }).from(hearts).where(eq(hearts.receiverId, userId));
  return { sent: sentResult?.count ?? 0, received: receivedResult?.count ?? 0 };
}

export async function getTodayHeartCount(senderId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(hearts)
    .where(and(eq(hearts.senderId, senderId), sql`DATE(${hearts.createdAt}) = CURDATE()`));
  return result?.count ?? 0;
}

// ─── Messages ──────────────────────────────────────────────────────────────

export async function sendMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getMessagesByCoupleId(coupleId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.coupleId, coupleId)).orderBy(desc(messages.createdAt)).limit(limit);
}

export async function setWidgetMessage(messageId: number, coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ isWidgetMessage: false }).where(and(eq(messages.coupleId, coupleId), eq(messages.isWidgetMessage, true)));
  await db.update(messages).set({ isWidgetMessage: true }).where(eq(messages.id, messageId));
}

export async function getWidgetMessage(coupleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(messages)
    .where(and(eq(messages.coupleId, coupleId), eq(messages.isWidgetMessage, true)))
    .orderBy(desc(messages.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestMessageForUser(receiverId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(messages)
    .where(and(eq(messages.receiverId, receiverId), eq(messages.isWidgetMessage, true)))
    .orderBy(desc(messages.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
