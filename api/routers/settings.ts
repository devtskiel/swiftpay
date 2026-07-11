import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, superAdminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { settings, merchants } from "@db/schema";

export const settingsRouter = createRouter({
  get: adminQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) return null;

    const result = await db.select().from(settings).where(eq(settings.merchantId, merchant[0].id)).limit(1);
    if (result.length === 0) return null;

    const s = result[0];
    // Mask secret keys
    return {
      ...s,
      sandboxSecretKey: s.sandboxSecretKey ? "*".repeat(20) : null,
      productionSecretKey: s.productionSecretKey ? "*".repeat(20) : null,
    };
  }),

  updateSwiftPay: superAdminQuery
    .input(
      z.object({
        environment: z.enum(["sandbox", "production"]),
        sandboxAccessKey: z.string().optional(),
        sandboxSecretKey: z.string().optional(),
        productionAccessKey: z.string().optional(),
        productionSecretKey: z.string().optional(),
        redirectUrl: z.string().url().optional(),
        callbackUrl: z.string().url().optional(),
        webhookUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

      const updateData: Record<string, unknown> = { environment: input.environment };
      if (input.sandboxAccessKey) updateData.sandboxAccessKey = input.sandboxAccessKey;
      if (input.sandboxSecretKey && !input.sandboxSecretKey.includes("*")) updateData.sandboxSecretKey = input.sandboxSecretKey;
      if (input.productionAccessKey) updateData.productionAccessKey = input.productionAccessKey;
      if (input.productionSecretKey && !input.productionSecretKey.includes("*")) updateData.productionSecretKey = input.productionSecretKey;
      if (input.redirectUrl) updateData.redirectUrl = input.redirectUrl;
      if (input.callbackUrl) updateData.callbackUrl = input.callbackUrl;
      if (input.webhookUrl) updateData.webhookUrl = input.webhookUrl;

      await db.update(settings).set(updateData).where(eq(settings.merchantId, merchant[0].id));
      return { success: true };
    }),

  updateGeneral: adminQuery
    .input(
      z.object({
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        currencyDisplay: z.string().optional(),
        itemsPerPage: z.number().int().min(5).max(100).optional(),
        emailNotifications: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

      const updateData: Record<string, unknown> = {};
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) updateData[key] = value;
      });

      await db.update(settings).set(updateData).where(eq(settings.merchantId, merchant[0].id));
      return { success: true };
    }),

  testConnection: adminQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

    const result = await db.select().from(settings).where(eq(settings.merchantId, merchant[0].id)).limit(1);
    if (result.length === 0) return { success: false, message: "Settings not configured" };

    const s = result[0];
    const isSandbox = s.environment === "sandbox";
    const accessKey = isSandbox ? s.sandboxAccessKey : s.productionAccessKey;

    if (!accessKey) return { success: false, message: "Access key not configured" };

    try {
      const baseUrl = isSandbox ? "https://api.pay.sandbox.live.swiftpay.ph" : "https://api.pay.live.swiftpay.ph";
      const res = await fetch(`${baseUrl}/api/institutions`, { method: "GET" });
      if (res.ok) {
        return { success: true, message: "Connection successful" };
      }
      return { success: false, message: `Connection failed: HTTP ${res.status}` };
    } catch {
      return { success: false, message: "Network error: Unable to reach SwiftPay API" };
    }
  }),
});
