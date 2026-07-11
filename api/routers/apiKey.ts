import { z } from "zod";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { apiKeys, merchants } from "@db/schema";

export const apiKeyRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) return [];

    return db.select().from(apiKeys).where(eq(apiKeys.merchantId, merchant[0].id));
  }),

  generate: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        environment: z.enum(["sandbox", "production"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

      const prefix = input.environment === "production" ? "pk_live_" : "pk_test_";
      const secretPrefix = input.environment === "production" ? "sk_live_" : "sk_test_";

      const publicKey = prefix + crypto.randomBytes(16).toString("hex");
      const secretKey = secretPrefix + crypto.randomBytes(32).toString("hex");

      await db.insert(apiKeys).values({
        merchantId: merchant[0].id,
        name: input.name,
        publicKey,
        secretKey,
        environment: input.environment,
        status: "active",
      });

      return { publicKey, secretKey };
    }),

  revoke: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

      await db
        .update(apiKeys)
        .set({ status: "revoked" })
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.merchantId, merchant[0].id)));

      return { success: true };
    }),
});
