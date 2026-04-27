import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  department: mysqlEnum("department", ["leo", "fire_ems", "dispatch", "admin"]).default("leo").notNull(),
  badgeNumber: varchar("badgeNumber", { length: 20 }),
  callsign: varchar("callsign", { length: 20 }),
  unitStatus: mysqlEnum("unitStatus", ["available", "busy", "en_route", "on_scene", "off_duty"]).default("off_duty").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Civilians database
 */
export const civilians = mysqlTable("civilians", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female", "other"]).notNull(),
  race: varchar("race", { length: 50 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  licenseNumber: varchar("licenseNumber", { length: 30 }),
  licenseStatus: mysqlEnum("licenseStatus", ["valid", "suspended", "revoked", "expired"]).default("valid"),
  flags: text("flags"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Civilian = typeof civilians.$inferSelect;
export type InsertCivilian = typeof civilians.$inferInsert;

/**
 * Vehicles database
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plate: varchar("plate", { length: 20 }).notNull(),
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 50 }).notNull(),
  year: int("year"),
  color: varchar("color", { length: 30 }).notNull(),
  vin: varchar("vin", { length: 30 }),
  registrationStatus: mysqlEnum("registrationStatus", ["valid", "expired", "stolen", "suspended"]).default("valid"),
  insuranceStatus: mysqlEnum("insuranceStatus", ["valid", "expired", "none"]).default("valid"),
  ownerId: int("ownerId"),
  flags: text("flags"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Calls for service
 */
export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 30 }).notNull().unique(),
  nature: varchar("nature", { length: 200 }).notNull(),
  priority: mysqlEnum("priority", ["code_1", "code_2", "code_3", "code_4"]).notNull(),
  status: mysqlEnum("status", ["pending", "dispatched", "en_route", "on_scene", "closed"]).default("pending").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  callerName: varchar("callerName", { length: 100 }),
  callerPhone: varchar("callerPhone", { length: 20 }),
  disposition: text("disposition"),
  department: mysqlEnum("department", ["leo", "fire_ems", "both"]).default("leo").notNull(),
  createdById: int("createdById").notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

/**
 * Call notes
 */
export const callNotes = mysqlTable("call_notes", {
  id: int("id").autoincrement().primaryKey(),
  callId: int("callId").notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CallNote = typeof callNotes.$inferSelect;
export type InsertCallNote = typeof callNotes.$inferInsert;

/**
 * Unit assignments to calls
 */
export const callUnits = mysqlTable("call_units", {
  id: int("id").autoincrement().primaryKey(),
  callId: int("callId").notNull(),
  unitId: int("unitId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  clearedAt: timestamp("clearedAt"),
});

export type CallUnit = typeof callUnits.$inferSelect;
export type InsertCallUnit = typeof callUnits.$inferInsert;

/**
 * Warrants
 */
export const warrants = mysqlTable("warrants", {
  id: int("id").autoincrement().primaryKey(),
  civilianId: int("civilianId"),
  suspectName: varchar("suspectName", { length: 200 }).notNull(),
  charges: text("charges").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "served", "recalled"]).default("active").notNull(),
  issuedById: int("issuedById").notNull(),
  servedById: int("servedById"),
  servedAt: timestamp("servedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Warrant = typeof warrants.$inferSelect;
export type InsertWarrant = typeof warrants.$inferInsert;

/**
 * BOLOs (Be On the Lookout)
 */
export const bolos = mysqlTable("bolos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  suspectName: varchar("suspectName", { length: 200 }),
  suspectDescription: text("suspectDescription"),
  vehicleDescription: text("vehicleDescription"),
  lastSeenLocation: text("lastSeenLocation"),
  status: mysqlEnum("status", ["active", "cleared"]).default("active").notNull(),
  issuedById: int("issuedById").notNull(),
  clearedById: int("clearedById"),
  clearedAt: timestamp("clearedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bolo = typeof bolos.$inferSelect;
export type InsertBolo = typeof bolos.$inferInsert;

/**
 * Incident reports (LEO arrests, citations, Fire/EMS patient care)
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 30 }).notNull().unique(),
  type: mysqlEnum("type", ["arrest", "citation", "patient_care", "fire_incident"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  narrative: text("narrative").notNull(),
  civilianId: int("civilianId"),
  callId: int("callId"),
  charges: text("charges"),
  location: text("location"),
  officerId: int("officerId").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "approved"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * In-app notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["call", "bolo", "warrant", "system"]).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
