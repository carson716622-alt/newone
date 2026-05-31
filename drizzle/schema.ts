import {
  boolean,
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Officers ─────────────────────────────────────────────────────────────────
export const officers = mysqlTable("officers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  badgeNumber: varchar("badgeNumber", { length: 32 }).notNull().unique(),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  rank: mysqlEnum("rank", [
    "officer",
    "detective",
    "corporal",
    "sergeant",
    "lieutenant",
    "captain",
    "commander",
    "deputy_chief",
    "chief",
  ])
    .default("officer")
    .notNull(),
  unit: varchar("unit", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  hireDate: date("hireDate"),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"])
    .default("active")
    .notNull(),
  maxWeeklyHours: int("maxWeeklyHours").default(40).notNull(),
  passwordHash: varchar("passwordHash", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Officer = typeof officers.$inferSelect;
export type InsertOfficer = typeof officers.$inferInsert;

// ─── Shifts ───────────────────────────────────────────────────────────────────
// Shifts are permanent recurring templates (e.g. "Day Shift", "Night Watch").
// Officers are assigned to these standing shifts; no date is stored on the shift itself.
export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  daysOfWeek: varchar("daysOfWeek", { length: 64 }), // e.g. "Mon,Tue,Wed,Thu,Fri"
  unit: varchar("unit", { length: 128 }),
  location: varchar("location", { length: 256 }),
  minimumOfficers: int("minimumOfficers").default(1).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive"])
    .default("active")
    .notNull(),
  createdBy: int("createdBy").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

// ─── Shift Assignments ────────────────────────────────────────────────────────
export const shiftAssignments = mysqlTable("shift_assignments", {
  id: int("id").autoincrement().primaryKey(),
  shiftId: int("shiftId")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  officerId: int("officerId")
    .notNull()
    .references(() => officers.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 128 }),
  isOvertime: boolean("isOvertime").default(false).notNull(),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type InsertShiftAssignment = typeof shiftAssignments.$inferInsert;

// ─── PTO Requests ─────────────────────────────────────────────────────────────
export const ptoRequests = mysqlTable("pto_requests", {
  id: int("id").autoincrement().primaryKey(),
  officerId: int("officerId")
    .notNull()
    .references(() => officers.id, { onDelete: "cascade" }),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  type: mysqlEnum("type", ["vacation", "sick", "personal", "bereavement", "other"])
    .default("vacation")
    .notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "denied"])
    .default("pending")
    .notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PtoRequest = typeof ptoRequests.$inferSelect;
export type InsertPtoRequest = typeof ptoRequests.$inferInsert;

// ─── Shift Swap Requests ──────────────────────────────────────────────────────
export const shiftSwapRequests = mysqlTable("shift_swap_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestingOfficerId: int("requestingOfficerId")
    .notNull()
    .references(() => officers.id, { onDelete: "cascade" }),
  targetOfficerId: int("targetOfficerId").references(() => officers.id, {
    onDelete: "set null",
  }),
  originalShiftId: int("originalShiftId")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  targetShiftId: int("targetShiftId").references(() => shifts.id, {
    onDelete: "set null",
  }),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "accepted", "denied", "cancelled"])
    .default("pending")
    .notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;
export type InsertShiftSwapRequest = typeof shiftSwapRequests.$inferInsert;

// ─── Overtime Records ─────────────────────────────────────────────────────────
export const overtimeRecords = mysqlTable("overtime_records", {
  id: int("id").autoincrement().primaryKey(),
  officerId: int("officerId")
    .notNull()
    .references(() => officers.id, { onDelete: "cascade" }),
  shiftAssignmentId: int("shiftAssignmentId").references(
    () => shiftAssignments.id,
    { onDelete: "set null" }
  ),
  weekStartDate: date("weekStartDate").notNull(),
  regularHours: decimal("regularHours", { precision: 5, scale: 2 })
    .default("0")
    .notNull(),
  overtimeHours: decimal("overtimeHours", { precision: 5, scale: 2 })
    .default("0")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OvertimeRecord = typeof overtimeRecords.$inferSelect;
export type InsertOvertimeRecord = typeof overtimeRecords.$inferInsert;
