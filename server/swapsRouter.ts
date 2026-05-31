import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { officers, shiftAssignments, shiftSwapRequests, shifts } from "../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const swapsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["pending", "accepted", "denied", "cancelled", "all"])
            .default("all"),
          officerId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];
      if (input?.status && input.status !== "all") {
        conditions.push(eq(shiftSwapRequests.status, input.status));
      }
      if (input?.officerId) {
        conditions.push(eq(shiftSwapRequests.requestingOfficerId, input.officerId));
      }

      const rows =
        conditions.length > 0
          ? await db
              .select()
              .from(shiftSwapRequests)
              .where(and(...conditions))
              .orderBy(desc(shiftSwapRequests.createdAt))
          : await db
              .select()
              .from(shiftSwapRequests)
              .orderBy(desc(shiftSwapRequests.createdAt));

      // Enrich with officer and shift data
      const enriched = await Promise.all(
        rows.map(async (swap) => {
          const [reqOfficer, tgtOfficer, origShift, tgtShift] =
            await Promise.all([
              db
                .select()
                .from(officers)
                .where(eq(officers.id, swap.requestingOfficerId))
                .limit(1),
              swap.targetOfficerId
                ? db
                    .select()
                    .from(officers)
                    .where(eq(officers.id, swap.targetOfficerId))
                    .limit(1)
                : Promise.resolve([]),
              db
                .select()
                .from(shifts)
                .where(eq(shifts.id, swap.originalShiftId))
                .limit(1),
              swap.targetShiftId
                ? db
                    .select()
                    .from(shifts)
                    .where(eq(shifts.id, swap.targetShiftId))
                    .limit(1)
                : Promise.resolve([]),
            ]);
          return {
            ...swap,
            requestingOfficer: reqOfficer[0] ?? null,
            targetOfficer: tgtOfficer[0] ?? null,
            originalShift: origShift[0] ?? null,
            targetShift: tgtShift[0] ?? null,
          };
        })
      );
      return enriched;
    }),

  create: protectedProcedure
    .input(
      z.object({
        requestingOfficerId: z.number(),
        originalShiftId: z.number(),
        targetOfficerId: z.number().optional().nullable(),
        targetShiftId: z.number().optional().nullable(),
        reason: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(shiftSwapRequests).values({
        ...input,
        status: "pending",
      });
      return { id: (result as any)[0]?.insertId ?? 0 };
    }),

  review: adminProcedure
    .input(
      z.object({
        id: z.number(),
        action: z.enum(["accepted", "denied"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(shiftSwapRequests)
        .set({
          status: input.action,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(shiftSwapRequests.id, input.id));

      // If accepted, perform the actual swap in assignments
      if (input.action === "accepted") {
        const swap = await db
          .select()
          .from(shiftSwapRequests)
          .where(eq(shiftSwapRequests.id, input.id))
          .limit(1);
        const s = swap[0];
        if (s && s.targetOfficerId && s.targetShiftId) {
          // Swap: remove requesting officer from original, add to target; remove target from target, add to original
          await db
            .delete(shiftAssignments)
            .where(
              and(
                eq(shiftAssignments.shiftId, s.originalShiftId),
                eq(shiftAssignments.officerId, s.requestingOfficerId)
              )
            );
          await db
            .delete(shiftAssignments)
            .where(
              and(
                eq(shiftAssignments.shiftId, s.targetShiftId),
                eq(shiftAssignments.officerId, s.targetOfficerId)
              )
            );
          await db.insert(shiftAssignments).values({
            shiftId: s.targetShiftId,
            officerId: s.requestingOfficerId,
          });
          await db.insert(shiftAssignments).values({
            shiftId: s.originalShiftId,
            officerId: s.targetOfficerId,
          });
        }
      }
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(shiftSwapRequests)
        .set({ status: "cancelled" })
        .where(eq(shiftSwapRequests.id, input.id));
      return { success: true };
    }),
});
