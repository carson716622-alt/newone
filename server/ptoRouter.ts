import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { officers, ptoRequests } from "../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const ptoRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          officerId: z.number().optional(),
          status: z
            .enum(["pending", "approved", "denied", "all"])
            .default("all"),
          startDate: z.string().date().optional(),
          endDate: z.string().date().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];
      if (input?.officerId) {
        conditions.push(eq(ptoRequests.officerId, input.officerId));
      }
      if (input?.status && input.status !== "all") {
        conditions.push(eq(ptoRequests.status, input.status));
      }
      if (input?.startDate) {
        conditions.push(gte(ptoRequests.startDate, new Date(input.startDate) as any));
      }
      if (input?.endDate) {
        conditions.push(lte(ptoRequests.endDate, new Date(input.endDate) as any));
      }

      const rows =
        conditions.length > 0
          ? await db
              .select({ pto: ptoRequests, officer: officers })
              .from(ptoRequests)
              .innerJoin(officers, eq(ptoRequests.officerId, officers.id))
              .where(and(...conditions))
              .orderBy(desc(ptoRequests.createdAt))
          : await db
              .select({ pto: ptoRequests, officer: officers })
              .from(ptoRequests)
              .innerJoin(officers, eq(ptoRequests.officerId, officers.id))
              .orderBy(desc(ptoRequests.createdAt));

      return rows;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select({ pto: ptoRequests, officer: officers })
        .from(ptoRequests)
        .innerJoin(officers, eq(ptoRequests.officerId, officers.id))
        .where(eq(ptoRequests.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        officerId: z.number(),
        startDate: z.string().date(),
        endDate: z.string().date(),
        type: z
          .enum(["vacation", "sick", "personal", "bereavement", "other"])
          .default("vacation"),
        reason: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(ptoRequests).values({
        ...input,
        startDate: new Date(input.startDate) as any,
        endDate: new Date(input.endDate) as any,
        status: "pending",
      } as any);
      return { id: (result as any)[0]?.insertId ?? 0 };
    }),

  approve: adminProcedure
    .input(
      z.object({
        id: z.number(),
        reviewNotes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(ptoRequests)
        .set({
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes ?? null,
        })
        .where(eq(ptoRequests.id, input.id));
      return { success: true };
    }),

  deny: adminProcedure
    .input(
      z.object({
        id: z.number(),
        reviewNotes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(ptoRequests)
        .set({
          status: "denied",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes ?? null,
        })
        .where(eq(ptoRequests.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(ptoRequests).where(eq(ptoRequests.id, input.id));
      return { success: true };
    }),
});
