import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

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

  simCards: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserSimCards(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        return db.getSimCardById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        country: z.string().min(1).max(10),
        countryName: z.string().min(1).max(100),
        carrier: z.string().min(1).max(100),
        phoneNumber: z.string().min(1).max(50),
        rechargeCycleDays: z.number().min(1).max(365),
        lastRechargeDate: z.string(),
        remindDays: z.array(z.number()),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        return db.createSimCard({
          userId: ctx.user.id,
          country: input.country,
          countryName: input.countryName,
          carrier: input.carrier,
          phoneNumber: input.phoneNumber,
          rechargeCycleDays: input.rechargeCycleDays,
          lastRechargeDate: new Date(input.lastRechargeDate),
          remindDays: input.remindDays,
          isConfirmed: false,
          note: input.note || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        country: z.string().min(1).max(10).optional(),
        countryName: z.string().min(1).max(100).optional(),
        carrier: z.string().min(1).max(100).optional(),
        phoneNumber: z.string().min(1).max(50).optional(),
        rechargeCycleDays: z.number().min(1).max(365).optional(),
        lastRechargeDate: z.string().optional(),
        remindDays: z.array(z.number()).optional(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};
        if (data.country) updateData.country = data.country;
        if (data.countryName) updateData.countryName = data.countryName;
        if (data.carrier) updateData.carrier = data.carrier;
        if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
        if (data.rechargeCycleDays) updateData.rechargeCycleDays = data.rechargeCycleDays;
        if (data.lastRechargeDate) updateData.lastRechargeDate = new Date(data.lastRechargeDate);
        if (data.remindDays) updateData.remindDays = data.remindDays;
        if (data.note !== undefined) updateData.note = data.note || null;
        return db.updateSimCard(id, ctx.user.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.deleteSimCard(input.id, ctx.user.id);
      }),

    confirmRecharge: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.confirmRecharge(input.id, ctx.user.id);
      }),

    rechargeHistory: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .query(({ ctx, input }) => {
        return db.getRechargeHistory(input.cardId, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
