import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  officers,
  overtimeRecords,
  ptoRequests,
  shiftAssignments,
  shifts,
} from "../drizzle/schema";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        totalOfficers: 0,
        activeOfficers: 0,
        totalShifts: 0,
        shortageShifts: 0,
        pendingPto: 0,
        upcomingShifts: [],
        recentShortages: [],
      };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [totalOfficers, activeOfficers, totalShifts, shortageShifts, pendingPto] =
      await Promise.all([
        db.select({ c: count() }).from(officers),
        db
          .select({ c: count() })
          .from(officers)
          .where(eq(officers.status, "active")),
        db.select({ c: count() }).from(shifts),
        db
          .select({ c: count() })
          .from(shifts)
          .where(eq(shifts.status, "shortage")),
        db
          .select({ c: count() })
          .from(ptoRequests)
          .where(eq(ptoRequests.status, "pending")),
      ]);

    const upcomingShifts = await db
      .select()
      .from(shifts)
      .where(
        and(
          gte(shifts.date, today as any),
          lte(shifts.date, nextWeek as any)
        )
      )
      .orderBy(shifts.date)
      .limit(10);

    const recentShortages = await db
      .select()
      .from(shifts)
      .where(eq(shifts.status, "shortage"))
      .orderBy(shifts.date)
      .limit(5);

    return {
      totalOfficers: totalOfficers[0]?.c ?? 0,
      activeOfficers: activeOfficers[0]?.c ?? 0,
      totalShifts: totalShifts[0]?.c ?? 0,
      shortageShifts: shortageShifts[0]?.c ?? 0,
      pendingPto: pendingPto[0]?.c ?? 0,
      upcomingShifts,
      recentShortages,
    };
  }),

  // Overtime records
  overtime: router({
    list: protectedProcedure
      .input(
        z
          .object({
            officerId: z.number().optional(),
            weekStartDate: z.string().date().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions: any[] = [];
        if (input?.officerId) {
          conditions.push(eq(overtimeRecords.officerId, input.officerId));
        }
        if (input?.weekStartDate) {
          conditions.push(
            eq(overtimeRecords.weekStartDate, new Date(input.weekStartDate) as any)
          );
        }
        const rows =
          conditions.length > 0
            ? await db
                .select({ record: overtimeRecords, officer: officers })
                .from(overtimeRecords)
                .innerJoin(
                  officers,
                  eq(overtimeRecords.officerId, officers.id)
                )
                .where(and(...conditions))
                .orderBy(desc(overtimeRecords.weekStartDate))
            : await db
                .select({ record: overtimeRecords, officer: officers })
                .from(overtimeRecords)
                .innerJoin(
                  officers,
                  eq(overtimeRecords.officerId, officers.id)
                )
                .orderBy(desc(overtimeRecords.weekStartDate));
        return rows;
      }),

    create: adminProcedure
      .input(
        z.object({
          officerId: z.number(),
          shiftAssignmentId: z.number().optional().nullable(),
          weekStartDate: z.string().date(),
          regularHours: z.number().min(0).max(168),
          overtimeHours: z.number().min(0).max(168),
          notes: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const result = await db.insert(overtimeRecords).values({
          ...input,
          weekStartDate: new Date(input.weekStartDate) as any,
          regularHours: String(input.regularHours),
          overtimeHours: String(input.overtimeHours),
        } as any);
        return { id: (result as any)[0]?.insertId ?? 0 };
      }),

    // Summary per officer
    summary: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({
          officer: officers,
          totalRegular: sql<number>`SUM(${overtimeRecords.regularHours})`,
          totalOvertime: sql<number>`SUM(${overtimeRecords.overtimeHours})`,
        })
        .from(overtimeRecords)
        .innerJoin(officers, eq(overtimeRecords.officerId, officers.id))
        .groupBy(officers.id);
      return rows;
    }),
  }),
});
