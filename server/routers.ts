import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
    activeCalls: protectedProcedure.query(async () => {
      return db.getActiveCalls();
    }),
    recentReports: protectedProcedure.query(async () => {
      return db.getReports("all");
    }),
  }),

  // ============ UNITS ============
  units: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUnits();
    }),
    updateStatus: protectedProcedure
      .input(z.object({ status: z.enum(["available", "busy", "en_route", "on_scene", "off_duty"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUnitStatus(ctx.user.id, input.status);
        return { success: true };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        department: z.enum(["leo", "fire_ems", "dispatch", "admin"]).optional(),
        badgeNumber: z.string().optional(),
        callsign: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.department) {
          await db.updateUserDepartment(ctx.user.id, input.department, input.badgeNumber, input.callsign);
        }
        return { success: true };
      }),
    adminUpdate: adminProcedure
      .input(z.object({
        userId: z.number(),
        department: z.enum(["leo", "fire_ems", "dispatch", "admin"]),
        badgeNumber: z.string().optional(),
        callsign: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserDepartment(input.userId, input.department, input.badgeNumber, input.callsign);
        return { success: true };
      }),
  }),

  // ============ CALLS FOR SERVICE ============
  calls: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getCalls(input?.status);
      }),
    active: protectedProcedure.query(async () => {
      return db.getActiveCalls();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCallById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nature: z.string().min(1),
        priority: z.enum(["code_1", "code_2", "code_3", "code_4"]),
        location: z.string().min(1),
        description: z.string().optional(),
        callerName: z.string().optional(),
        callerPhone: z.string().optional(),
        department: z.enum(["leo", "fire_ems", "both"]).default("leo"),
      }))
      .mutation(async ({ ctx, input }) => {
        const caseNumber = db.generateCaseNumber("CFS");
        const callId = await db.createCall({
          ...input,
          caseNumber,
          status: "pending",
          createdById: ctx.user.id,
        });

        // Create notifications for relevant department users
        const allUnits = await db.getAllUnits();
        const relevantUnits = allUnits.filter(u => {
          if (input.department === "both") return u.department === "leo" || u.department === "fire_ems" || u.department === "dispatch";
          if (input.department === "leo") return u.department === "leo" || u.department === "dispatch";
          return u.department === "fire_ems" || u.department === "dispatch";
        });

        for (const unit of relevantUnits) {
          if (unit.id !== ctx.user.id) {
            await db.createNotification({
              userId: unit.id,
              title: `New Call: ${input.nature}`,
              message: `Priority: ${input.priority.replace("_", " ").toUpperCase()} | Location: ${input.location}`,
              type: "call",
              referenceId: callId,
            });
          }
        }

        return { success: true, caseNumber, id: callId };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "dispatched", "en_route", "on_scene", "closed"]).optional(),
        disposition: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        if (input.status) updateData.status = input.status;
        if (input.disposition) updateData.disposition = input.disposition;
        if (input.status === "closed") updateData.closedAt = new Date();
        await db.updateCall(input.id, updateData);
        return { success: true };
      }),
    addNote: protectedProcedure
      .input(z.object({ callId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await db.addCallNote({ callId: input.callId, content: input.content, authorId: ctx.user.id });
        return { success: true };
      }),
    getNotes: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .query(async ({ input }) => {
        return db.getCallNotes(input.callId);
      }),
    assignUnit: protectedProcedure
      .input(z.object({ callId: z.number(), unitId: z.number() }))
      .mutation(async ({ input }) => {
        await db.assignUnitToCall({ callId: input.callId, unitId: input.unitId });
        await db.updateUnitStatus(input.unitId, "en_route");
        return { success: true };
      }),
    clearUnit: protectedProcedure
      .input(z.object({ callId: z.number(), unitId: z.number() }))
      .mutation(async ({ input }) => {
        await db.clearUnitFromCall(input.callId, input.unitId);
        await db.updateUnitStatus(input.unitId, "available");
        return { success: true };
      }),
    getUnits: protectedProcedure
      .input(z.object({ callId: z.number() }))
      .query(async ({ input }) => {
        return db.getCallUnits(input.callId);
      }),
  }),

  // ============ CIVILIANS ============
  civilians: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getCivilians(input?.search);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCivilianById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string().min(1),
        gender: z.enum(["male", "female", "other"]),
        race: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        licenseNumber: z.string().optional(),
        licenseStatus: z.enum(["valid", "suspended", "revoked", "expired"]).optional(),
        flags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCivilian({ ...input, createdById: ctx.user.id });
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        licenseStatus: z.enum(["valid", "suspended", "revoked", "expired"]).optional(),
        flags: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCivilian(id, data);
        return { success: true };
      }),
  }),

  // ============ VEHICLES ============
  vehicles: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getVehicles(input?.search);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVehicleById(input.id);
      }),
    getByOwner: protectedProcedure
      .input(z.object({ ownerId: z.number() }))
      .query(async ({ input }) => {
        return db.getVehiclesByOwnerId(input.ownerId);
      }),
    create: protectedProcedure
      .input(z.object({
        plate: z.string().min(1),
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().optional(),
        color: z.string().min(1),
        vin: z.string().optional(),
        registrationStatus: z.enum(["valid", "expired", "stolen", "suspended"]).optional(),
        insuranceStatus: z.enum(["valid", "expired", "none"]).optional(),
        ownerId: z.number().optional(),
        flags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createVehicle({ ...input, createdById: ctx.user.id });
        return { success: true, id };
      }),
  }),

  // ============ WARRANTS ============
  warrants: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getWarrants(input?.status);
      }),
    create: protectedProcedure
      .input(z.object({
        suspectName: z.string().min(1),
        charges: z.string().min(1),
        description: z.string().optional(),
        civilianId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createWarrant({ ...input, issuedById: ctx.user.id });

        // Notify LEO and dispatch
        const allUnits = await db.getAllUnits();
        const relevantUnits = allUnits.filter(u => u.department === "leo" || u.department === "dispatch");
        for (const unit of relevantUnits) {
          if (unit.id !== ctx.user.id) {
            await db.createNotification({
              userId: unit.id,
              title: `New Warrant: ${input.suspectName}`,
              message: `Charges: ${input.charges}`,
              type: "warrant",
              referenceId: id,
            });
          }
        }

        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "served", "recalled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = { status: input.status };
        if (input.status === "served") {
          updateData.servedById = ctx.user.id;
          updateData.servedAt = new Date();
        }
        await db.updateWarrant(input.id, updateData);
        return { success: true };
      }),
  }),

  // ============ BOLOs ============
  bolos: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getBolos(input?.status);
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        suspectName: z.string().optional(),
        suspectDescription: z.string().optional(),
        vehicleDescription: z.string().optional(),
        lastSeenLocation: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createBolo({ ...input, issuedById: ctx.user.id });

        // Notify all units
        const allUnits = await db.getAllUnits();
        for (const unit of allUnits) {
          if (unit.id !== ctx.user.id) {
            await db.createNotification({
              userId: unit.id,
              title: `BOLO: ${input.title}`,
              message: input.description.substring(0, 200),
              type: "bolo",
              referenceId: id,
            });
          }
        }

        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "cleared"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = { status: input.status };
        if (input.status === "cleared") {
          updateData.clearedById = ctx.user.id;
          updateData.clearedAt = new Date();
        }
        await db.updateBolo(input.id, updateData);
        return { success: true };
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getReports(input?.type);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getReportById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["arrest", "citation", "patient_care", "fire_incident"]),
        title: z.string().min(1),
        narrative: z.string().min(1),
        civilianId: z.number().optional(),
        callId: z.number().optional(),
        charges: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const prefix = input.type === "arrest" ? "ARR" : input.type === "citation" ? "CIT" : input.type === "patient_care" ? "PCR" : "FIR";
        const caseNumber = db.generateCaseNumber(prefix);
        const id = await db.createReport({
          ...input,
          caseNumber,
          officerId: ctx.user.id,
          status: "submitted",
        });
        return { success: true, id, caseNumber };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "submitted", "approved"]).optional(),
        narrative: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateReport(id, data);
        return { success: true };
      }),
  }),

  // ============ NOTIFICATIONS ============
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNotifications(ctx.user.id);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
