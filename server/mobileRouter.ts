/**
 * Mobile API Router
 * Provides officer-facing endpoints for the React Native mobile app.
 * Auth uses JWT tokens (not cookies) since mobile apps don't use browser sessions.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import {
  officers,
  overtimeRecords,
  ptoRequests,
  shiftAssignments,
  shifts,
} from "../drizzle/schema";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const SALT_ROUNDS = 10;

function signToken(officerId: number) {
  return jwt.sign({ officerId, type: "mobile" }, JWT_SECRET, { expiresIn: "30d" });
}

function verifyToken(token: string): { officerId: number } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== "mobile") throw new Error("Invalid token type");
    return { officerId: payload.officerId };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}

// Middleware to extract officer from Bearer token
async function getOfficerFromToken(token: string | undefined) {
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "No token provided" });
  const bearer = token.startsWith("Bearer ") ? token.slice(7) : token;
  const { officerId } = verifyToken(bearer);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const [officer] = await db.select().from(officers).where(eq(officers.id, officerId)).limit(1);
  if (!officer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Officer not found" });
  return officer;
}

export const mobileRouter = router({
  // ─── Auth ────────────────────────────────────────────────────────────────────
  auth: router({
    register: publicProcedure
      .input(
        z.object({
          badgeNumber: z.string().min(1).max(32),
          firstName: z.string().min(1).max(128),
          lastName: z.string().min(1).max(128),
          password: z.string().min(6).max(128),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if badge number exists
        const [existing] = await db
          .select()
          .from(officers)
          .where(eq(officers.badgeNumber, input.badgeNumber))
          .limit(1);

        if (existing) {
          // Badge already exists — update password if not set yet, else reject
          if (existing.passwordHash) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account with this badge number already exists. Please sign in.",
            });
          }
          // Set password for existing officer record
          const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
          await db
            .update(officers)
            .set({ passwordHash, firstName: input.firstName, lastName: input.lastName })
            .where(eq(officers.id, existing.id));
          const token = signToken(existing.id);
          return { token, officer: { ...existing, passwordHash: undefined } };
        }

        // Create new officer record
        const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
        const result = await db.insert(officers).values({
          badgeNumber: input.badgeNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          status: "active",
        });
        const insertId = (result as any)[0]?.insertId;
        const [newOfficer] = await db.select().from(officers).where(eq(officers.id, insertId)).limit(1);
        const token = signToken(insertId);
        return { token, officer: { ...newOfficer, passwordHash: undefined } };
      }),

    login: publicProcedure
      .input(
        z.object({
          badgeNumber: z.string().min(1),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [officer] = await db
          .select()
          .from(officers)
          .where(eq(officers.badgeNumber, input.badgeNumber))
          .limit(1);

        if (!officer || !officer.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid badge number or password",
          });
        }

        const valid = await bcrypt.compare(input.password, officer.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid badge number or password",
          });
        }

        const token = signToken(officer.id);
        const { passwordHash: _, ...safeOfficer } = officer;
        return { token, officer: safeOfficer };
      }),

    me: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const officer = await getOfficerFromToken(input.token);
        const { passwordHash: _, ...safe } = officer;
        return safe;
      }),
  }),

  // ─── Calendar ────────────────────────────────────────────────────────────────
  calendar: router({
    /**
     * Returns all working days for the requesting officer in a given month,
     * plus all PTO requests for that officer in the month.
     */
    myMonth: publicProcedure
      .input(
        z.object({
          token: z.string(),
          year: z.number().int(),
          month: z.number().int().min(1).max(12),
        })
      )
      .query(async ({ input }) => {
        const officer = await getOfficerFromToken(input.token);
        const db = await getDb();
        if (!db) return { workingShifts: [], ptoRequests: [] };

        // Get all shifts assigned to this officer
        const assignments = await db
          .select({ shift: shifts })
          .from(shiftAssignments)
          .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
          .where(
            and(
              eq(shiftAssignments.officerId, officer.id),
              eq(shifts.status, "active")
            )
          );

        // Get PTO requests for this officer in this month
        const monthStart = new Date(input.year, input.month - 1, 1);
        const monthEnd = new Date(input.year, input.month, 0);

        const pto = await db
          .select()
          .from(ptoRequests)
          .where(
            and(
              eq(ptoRequests.officerId, officer.id),
              lte(ptoRequests.startDate, monthEnd as any),
              gte(ptoRequests.endDate, monthStart as any)
            )
          );

        return {
          workingShifts: assignments.map((a) => a.shift),
          ptoRequests: pto,
        };
      }),

    /**
     * Returns all officers working on a given date, plus PTO for that date.
     */
    dayDetail: publicProcedure
      .input(
        z.object({
          token: z.string(),
          date: z.string().date(), // YYYY-MM-DD
        })
      )
      .query(async ({ input }) => {
        await getOfficerFromToken(input.token);
        const db = await getDb();
        if (!db) return { workingOfficers: [], onPto: [] };

        const day = new Date(input.date);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = dayNames[day.getDay()];

        // Get all active shifts
        const allShifts = await db
          .select()
          .from(shifts)
          .where(eq(shifts.status, "active"));

        // Filter shifts that run on this day of week
        const shiftsOnDay = allShifts.filter((s) => {
          if (!s.daysOfWeek) return true; // if no days set, assume always
          return s.daysOfWeek.split(",").includes(dayName);
        });

        // Get officers assigned to those shifts
        const workingOfficers: any[] = [];
        for (const shift of shiftsOnDay) {
          const assignments = await db
            .select({ officer: officers })
            .from(shiftAssignments)
            .innerJoin(officers, eq(shiftAssignments.officerId, officers.id))
            .where(eq(shiftAssignments.shiftId, shift.id));

          for (const a of assignments) {
            if (!workingOfficers.find((o) => o.id === a.officer.id)) {
              workingOfficers.push({
                ...a.officer,
                passwordHash: undefined,
                shiftName: shift.name,
                shiftTime: `${shift.startTime}–${shift.endTime}`,
              });
            }
          }
        }

        // Get officers on approved PTO on this date
        const onPto = await db
          .select({ officer: officers, pto: ptoRequests })
          .from(ptoRequests)
          .innerJoin(officers, eq(ptoRequests.officerId, officers.id))
          .where(
            and(
              eq(ptoRequests.status, "approved"),
              lte(ptoRequests.startDate, day as any),
              gte(ptoRequests.endDate, day as any)
            )
          );

        return {
          workingOfficers,
          onPto: onPto.map((r) => ({
            ...r.officer,
            passwordHash: undefined,
            ptoType: r.pto.type,
          })),
        };
      }),
  }),

  // ─── PTO Requests ────────────────────────────────────────────────────────────
  pto: router({
    submit: publicProcedure
      .input(
        z.object({
          token: z.string(),
          startDate: z.string().date(),
          endDate: z.string().date(),
          type: z.enum(["vacation", "sick", "personal", "bereavement", "other"]),
          reason: z.string().max(512).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const officer = await getOfficerFromToken(input.token);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(ptoRequests).values({
          officerId: officer.id,
          startDate: new Date(input.startDate) as any,
          endDate: new Date(input.endDate) as any,
          type: input.type,
          reason: input.reason ?? null,
          status: "pending",
        });
        return { success: true };
      }),

    myRequests: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const officer = await getOfficerFromToken(input.token);
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(ptoRequests)
          .where(eq(ptoRequests.officerId, officer.id))
          .orderBy(ptoRequests.createdAt);
      }),
  }),

  // ─── Overtime Requests ───────────────────────────────────────────────────────
  overtime: router({
    submit: publicProcedure
      .input(
        z.object({
          token: z.string(),
          weekStartDate: z.string().date(),
          regularHours: z.number().min(0).max(168),
          overtimeHours: z.number().min(0).max(168),
          notes: z.string().max(512).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const officer = await getOfficerFromToken(input.token);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(overtimeRecords).values({
          officerId: officer.id,
          weekStartDate: new Date(input.weekStartDate) as any,
          regularHours: String(input.regularHours),
          overtimeHours: String(input.overtimeHours),
          notes: input.notes ?? null,
        } as any);
        return { success: true };
      }),

    myRecords: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const officer = await getOfficerFromToken(input.token);
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(overtimeRecords)
          .where(eq(overtimeRecords.officerId, officer.id))
          .orderBy(overtimeRecords.weekStartDate);
      }),
  }),
});
