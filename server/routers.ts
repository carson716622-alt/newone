import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { officersRouter } from "./officersRouter";
import { shiftsRouter } from "./shiftsRouter";
import { ptoRouter } from "./ptoRouter";
import { swapsRouter } from "./swapsRouter";
import { dashboardRouter } from "./dashboardRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  officers: officersRouter,
  shifts: shiftsRouter,
  pto: ptoRouter,
  swaps: swapsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
