import { and, eq, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import { officers, shiftAssignments, shifts } from "../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const shiftInput = z.object({
  name: z.string().min(1).max(128),
  date: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  unit: z.string().max(128).optional().nullable(),
  location: z.string().max(256).optional().nullable(),
  minimumOfficers: z.number().int().min(1).default(1),
  notes: z.string().optional().nullable(),
  status: z
    .enum(["open", "filled", "shortage", "cancelled"])
    .default("open"),
});

export const shiftsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().date().optional(),
        endDate: z.string().date().optional(),
        unit: z.string().optional(),
        status: z
          .enum(["open", "filled", "shortage", "cancelled", "all"])
          .default("all"),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];
      if (input?.startDate) {
        conditions.push(gte(shifts.date, new Date(input.startDate) as any));
      }
      if (input?.endDate) {
        conditions.push(lte(shifts.date, new Date(input.endDate) as any));
      }
      if (input?.status && input.status !== "all") {
        conditions.push(eq(shifts.status, input.status));
      }
      if (input?.unit) {
        conditions.push(eq(shifts.unit, input.unit));
      }

      const shiftList =
        conditions.length > 0
          ? await db
              .select()
              .from(shifts)
              .where(and(...conditions))
              .orderBy(shifts.date)
          : await db.select().from(shifts).orderBy(shifts.date);

      // Attach assignment counts
      const enriched = await Promise.all(
        shiftList.map(async (shift) => {
          const assignments = await db
            .select({ officer: officers })
            .from(shiftAssignments)
            .innerJoin(officers, eq(shiftAssignments.officerId, officers.id))
            .where(eq(shiftAssignments.shiftId, shift.id));
          return {
            ...shift,
            assignedCount: assignments.length,
            assignedOfficers: assignments.map((a) => a.officer),
          };
        })
      );
      return enriched;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, input.id))
        .limit(1);
      if (!result[0]) return null;
      const shift = result[0];
      const assignments = await db
        .select({ assignment: shiftAssignments, officer: officers })
        .from(shiftAssignments)
        .innerJoin(officers, eq(shiftAssignments.officerId, officers.id))
        .where(eq(shiftAssignments.shiftId, shift.id));
      return { ...shift, assignments };
    }),

  create: adminProcedure
    .input(shiftInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(shifts).values({
        ...input,
        date: new Date(input.date) as any,
        createdBy: ctx.user.id,
      } as any);
      return { id: (result as any)[0]?.insertId ?? 0 };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), data: shiftInput.partial() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const updateData: any = { ...input.data };
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }
      await db.update(shifts).set(updateData).where(eq(shifts.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(shifts).where(eq(shifts.id, input.id));
      return { success: true };
    }),

  // Assign officer to shift
  assign: adminProcedure
    .input(
      z.object({
        shiftId: z.number(),
        officerId: z.number(),
        role: z.string().optional(),
        isOvertime: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check for duplicate assignment
      const existing = await db
        .select()
        .from(shiftAssignments)
        .where(
          and(
            eq(shiftAssignments.shiftId, input.shiftId),
            eq(shiftAssignments.officerId, input.officerId)
          )
        )
        .limit(1);
      if (existing.length > 0) {
        throw new Error("Officer is already assigned to this shift");
      }

      const result = await db.insert(shiftAssignments).values({
        shiftId: input.shiftId,
        officerId: input.officerId,
        role: input.role ?? null,
        isOvertime: input.isOvertime,
      });

      // Update shift status based on assignment count
      const allAssignments = await db
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.shiftId, input.shiftId));
      const shiftData = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, input.shiftId))
        .limit(1);
      if (shiftData[0]) {
        const newStatus =
          allAssignments.length >= shiftData[0].minimumOfficers
            ? "filled"
            : "shortage";
        await db
          .update(shifts)
          .set({ status: newStatus })
          .where(eq(shifts.id, input.shiftId));
      }

      return { id: (result as any)[0]?.insertId ?? 0 };
    }),

  // Unassign officer from shift
  unassign: adminProcedure
    .input(z.object({ shiftId: z.number(), officerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(shiftAssignments)
        .where(
          and(
            eq(shiftAssignments.shiftId, input.shiftId),
            eq(shiftAssignments.officerId, input.officerId)
          )
        );

      // Recalculate shift status
      const remaining = await db
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.shiftId, input.shiftId));
      const shiftData = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, input.shiftId))
        .limit(1);
      if (shiftData[0]) {
        let newStatus: "open" | "filled" | "shortage" | "cancelled" = "open";
        if (remaining.length === 0) {
          newStatus = "open";
        } else if (remaining.length >= shiftData[0].minimumOfficers) {
          newStatus = "filled";
        } else {
          newStatus = "shortage";
        }
        await db
          .update(shifts)
          .set({ status: newStatus })
          .where(eq(shifts.id, input.shiftId));
      }
      return { success: true };
    }),

  // Get shortage shifts (shifts with fewer officers than minimum)
  getShortages: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.status, "shortage"))
      .orderBy(shifts.date);
  }),
});
