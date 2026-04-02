import { z } from "zod";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getAppUserFromCtx(ctx: any) {
  const authHeader = ctx.req.headers.authorization || ctx.req.headers.Authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  const session = await sdk.verifySession(token);
  if (!session || !session.openId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session" });
  }
  const userId = parseInt(session.openId, 10);
  if (isNaN(userId)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session data" });
  }
  const user = await db.getAppUserById(userId);
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }
  return user;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  appAuth: router({
    register: publicProcedure
      .input(z.object({
        email: z.string().email().max(320),
        password: z.string().min(6).max(100),
        displayName: z.string().min(1).max(100),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getAppUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        let inviteCode = generateInviteCode();
        let attempts = 0;
        while (await db.getAppUserByInviteCode(inviteCode)) {
          inviteCode = generateInviteCode();
          attempts++;
          if (attempts > 10) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate unique invite code" });
        }
        const userId = await db.createAppUser({
          email: input.email.toLowerCase(),
          passwordHash,
          displayName: input.displayName,
          inviteCode,
        });
        const sessionToken = await sdk.createSessionToken(String(userId), {
          name: input.displayName,
          expiresInMs: 365 * 24 * 60 * 60 * 1000,
        });
        const user = await db.getAppUserById(userId);
        return {
          token: sessionToken,
          user: user ? {
            id: user.id, email: user.email, displayName: user.displayName,
            inviteCode: user.inviteCode, coupleId: user.coupleId,
          } : null,
        };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getAppUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        const sessionToken = await sdk.createSessionToken(String(user.id), {
          name: user.displayName,
          expiresInMs: 365 * 24 * 60 * 60 * 1000,
        });
        return {
          token: sessionToken,
          user: {
            id: user.id, email: user.email, displayName: user.displayName,
            inviteCode: user.inviteCode, coupleId: user.coupleId,
          },
        };
      }),

    me: publicProcedure.query(async ({ ctx }) => {
      try {
        const user = await getAppUserFromCtx(ctx);
        let partnerName: string | null = null;
        if (user.coupleId) {
          const couple = await db.getCoupleById(user.coupleId);
          if (couple) {
            const partnerId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
            const partner = await db.getAppUserById(partnerId);
            partnerName = partner?.displayName ?? null;
          }
        }
        return {
          id: user.id, email: user.email, displayName: user.displayName,
          inviteCode: user.inviteCode, coupleId: user.coupleId, partnerName,
        };
      } catch { return null; }
    }),
  }),

  couple: router({
    joinByCode: publicProcedure
      .input(z.object({ inviteCode: z.string().min(1).max(8) }))
      .mutation(async ({ ctx, input }) => {
        const currentUser = await getAppUserFromCtx(ctx);
        if (currentUser.coupleId) throw new TRPCError({ code: "BAD_REQUEST", message: "You are already paired" });
        const partner = await db.getAppUserByInviteCode(input.inviteCode);
        if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite code" });
        if (partner.id === currentUser.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot pair with yourself" });
        if (partner.coupleId) throw new TRPCError({ code: "BAD_REQUEST", message: "This person is already paired" });
        const coupleId = await db.createCouple({ user1Id: currentUser.id, user2Id: partner.id });
        await db.updateAppUserCouple(currentUser.id, coupleId);
        await db.updateAppUserCouple(partner.id, coupleId);
        return { coupleId, partnerName: partner.displayName };
      }),

    getPartner: publicProcedure.query(async ({ ctx }) => {
      const user = await getAppUserFromCtx(ctx);
      if (!user.coupleId) return null;
      const couple = await db.getCoupleById(user.coupleId);
      if (!couple) return null;
      const partnerId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
      const partner = await db.getAppUserById(partnerId);
      return partner ? { id: partner.id, displayName: partner.displayName } : null;
    }),
  }),

  hearts: router({
    send: publicProcedure.mutation(async ({ ctx }) => {
      const user = await getAppUserFromCtx(ctx);
      if (!user.coupleId) throw new TRPCError({ code: "BAD_REQUEST", message: "Pair with someone first" });
      const couple = await db.getCoupleById(user.coupleId);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND", message: "Couple not found" });
      const receiverId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
      await db.sendHeart({ senderId: user.id, receiverId, coupleId: user.coupleId });
      const todayCount = await db.getTodayHeartCount(user.id);
      const totalCounts = await db.getHeartCountForUser(user.id);
      return { todayCount, totalSent: totalCounts.sent, totalReceived: totalCounts.received };
    }),

    getStats: publicProcedure.query(async ({ ctx }) => {
      const user = await getAppUserFromCtx(ctx);
      if (!user.coupleId) return { todaySent: 0, totalSent: 0, totalReceived: 0, recentHearts: [] };
      const todaySent = await db.getTodayHeartCount(user.id);
      const counts = await db.getHeartCountForUser(user.id);
      const recentHearts = await db.getHeartsByCoupleId(user.coupleId, 20);
      return {
        todaySent, totalSent: counts.sent, totalReceived: counts.received,
        recentHearts: recentHearts.map(h => ({ id: h.id, senderId: h.senderId, createdAt: h.createdAt.toISOString() })),
      };
    }),
  }),

  messages: router({
    send: publicProcedure
      .input(z.object({ content: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getAppUserFromCtx(ctx);
        if (!user.coupleId) throw new TRPCError({ code: "BAD_REQUEST", message: "Pair with someone first" });
        const couple = await db.getCoupleById(user.coupleId);
        if (!couple) throw new TRPCError({ code: "NOT_FOUND", message: "Couple not found" });
        const receiverId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
        const messageId = await db.sendMessage({ senderId: user.id, receiverId, coupleId: user.coupleId, content: input.content });
        return { messageId };
      }),

    list: publicProcedure.query(async ({ ctx }) => {
      const user = await getAppUserFromCtx(ctx);
      if (!user.coupleId) return [];
      const msgs = await db.getMessagesByCoupleId(user.coupleId, 50);
      return msgs.map(m => ({
        id: m.id, senderId: m.senderId, content: m.content,
        isWidgetMessage: m.isWidgetMessage, createdAt: m.createdAt.toISOString(),
      }));
    }),

    setWidget: publicProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getAppUserFromCtx(ctx);
        if (!user.coupleId) throw new TRPCError({ code: "BAD_REQUEST", message: "Not paired" });
        await db.setWidgetMessage(input.messageId, user.coupleId);
        return { success: true };
      }),

    getWidgetMessage: publicProcedure.query(async ({ ctx }) => {
      const user = await getAppUserFromCtx(ctx);
      if (!user.coupleId) return null;
      const msg = await db.getWidgetMessage(user.coupleId);
      if (!msg) return null;
      const sender = await db.getAppUserById(msg.senderId);
      return { id: msg.id, content: msg.content, senderName: sender?.displayName ?? "Your Love", createdAt: msg.createdAt.toISOString() };
    }),
  }),

  widget: router({
    getData: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getAppUserById(input.userId);
        if (!user || !user.coupleId) return null;
        const msg = await db.getLatestMessageForUser(input.userId);
        const couple = await db.getCoupleById(user.coupleId);
        if (!couple) return null;
        const partnerId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
        const partner = await db.getAppUserById(partnerId);
        return {
          message: msg?.content ?? "No messages yet",
          partnerName: partner?.displayName ?? "Your Love",
          timestamp: msg?.createdAt.toISOString() ?? new Date().toISOString(),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
