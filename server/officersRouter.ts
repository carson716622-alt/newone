import { and, eq, like, or, desc } from "drizzle-orm";
import { z } from "zod";
import { officers, shiftAssignments, shifts } from "../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const officerInput = z.object({
  badgeNumber: z.string().min(1).max(32),
  firstName: z.string().min(1).max(128),
  lastName: z.string().min(1).max(128),
  rank: z.enum([
    "officer",
    "detective",
    "corporal",
    "sergeant",
    "lieutenant",
    "captain",
    "commander",
    "deputy_chief",
    "chief",
  ]),
  unit: z.string().max(128).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
  hireDate: z.string().date().optional().nullable(),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  maxWeeklyHours: z.number().int().min(1).max(80).default(40),
});

export const officersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "on_leave", "all"]).default("all"),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(officers);
      const conditions = [];

      if (input?.status && input.status !== "all") {
        conditions.push(eq(officers.status, input.status));
      }
      if (input?.search) {
        conditions.push(
          or(
            like(officers.firstName, `%${input.search}%`),
            like(officers.lastName, `%${input.search}%`),
            like(officers.badgeNumber, `%${input.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        return await db.select().from(officers).where(and(...conditions)).orderBy(desc(officers.createdAt));
      }

      return await db.select().from(officers).orderBy(desc(officers.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(officers)
        .where(eq(officers.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: adminProcedure.input(officerInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const result = await db.insert(officers).values({
      ...input,
      hireDate: input.hireDate ? new Date(input.hireDate) : null,
    } as any);
    return { id: (result as any)[0]?.insertId ?? 0 };
  }),

  update: adminProcedure
    .input(z.object({ id: z.number(), data: officerInput.partial() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const updateData: any = { ...input.data };
      if (updateData.hireDate !== undefined) {
        updateData.hireDate = updateData.hireDate ? new Date(updateData.hireDate) : null;
      }
      await db
        .update(officers)
        .set(updateData)
        .where(eq(officers.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(officers).where(eq(officers.id, input.id));
      return { success: true };
    }),

  // Get officer's upcoming shifts
  getSchedule: protectedProcedure
    .input(
      z.object({
        officerId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const result = await db
        .select({
          assignment: shiftAssignments,
          shift: shifts,
        })
        .from(shiftAssignments)
        .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
        .where(eq(shiftAssignments.officerId, input.officerId))
        .orderBy(shifts.date);
      return result;
    }),
});
