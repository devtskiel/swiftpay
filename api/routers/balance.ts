import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { balanceTransactions, merchants } from "@db/schema";

export const balanceRouter = createRouter({
  getBalance: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) return { currentBalance: 0, totalTopUps: 0, totalWithdrawals: 0 };

    const mId = merchant[0].id;

    const topUps = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(balanceTransactions)
      .where(and(eq(balanceTransactions.merchantId, mId), eq(balanceTransactions.type, "top_up"), eq(balanceTransactions.status, "completed")));

    const withdrawals = await db
      .select({ total: sql<string>`COALESCE(SUM(ABS(amount)), 0)` })
      .from(balanceTransactions)
      .where(and(eq(balanceTransactions.merchantId, mId), eq(balanceTransactions.type, "withdrawal"), eq(balanceTransactions.status, "completed")));

    const latest = await db
      .select()
      .from(balanceTransactions)
      .where(eq(balanceTransactions.merchantId, mId))
      .orderBy(desc(balanceTransactions.id))
      .limit(1);

    const currentBalance = latest.length > 0 ? parseFloat(latest[0].balance) : 0;

    return {
      currentBalance,
      totalTopUps: parseFloat(topUps[0]?.total || "0"),
      totalWithdrawals: parseFloat(withdrawals[0]?.total || "0"),
    };
  }),

  getHistory: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        type: z.enum(["top_up", "withdrawal", "all"]).default("all"),
      }).optional(),
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) return { transactions: [], total: 0 };

      const mId = merchant[0].id;
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      let where = eq(balanceTransactions.merchantId, mId);
      if (input?.type && input.type !== "all") {
        where = and(where, eq(balanceTransactions.type, input.type)) as typeof where;
      }

      const result = await db.select().from(balanceTransactions).where(where).orderBy(desc(balanceTransactions.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(balanceTransactions).where(where);

      return { transactions: result, total: countResult[0]?.count || 0 };
    }),

  getChartData: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(90).default(30) }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) return { dates: [], balances: [] };

      const mId = merchant[0].id;
      const days = input?.days || 30;

      const dates: string[] = [];
      const balances: number[] = [];

      // Get running balance at end of each day
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);

        const result = await db.select({ balance: sql<string>`COALESCE((SELECT balance FROM balance_transactions WHERE merchant_id = ${mId} AND DATE(created_at) <= ${dateStr} ORDER BY id DESC LIMIT 1), 0)` }).from(balanceTransactions);

        balances.push(parseFloat(result[0]?.balance || "0"));
      }

      return { dates, balances };
    }),

  topUp: adminQuery
    .input(
      z.object({
        amount: z.number().positive(),
        description: z.string().optional(),
        referenceNo: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const mId = merchant[0].id;

      // Get current balance
      const latest = await db.select().from(balanceTransactions).where(eq(balanceTransactions.merchantId, mId)).orderBy(desc(balanceTransactions.id)).limit(1);
      const currentBalance = latest.length > 0 ? parseFloat(latest[0].balance) : 0;
      const newBalance = currentBalance + input.amount;

      await db.insert(balanceTransactions).values({
        merchantId: mId,
        type: "top_up",
        amount: input.amount.toFixed(2),
        balance: newBalance.toFixed(2),
        description: input.description || "Top-up",
        referenceNo: input.referenceNo || `TOP-${Date.now()}`,
        status: "completed",
      });

      return { success: true, newBalance };
    }),

  withdraw: adminQuery
    .input(
      z.object({
        amount: z.number().positive(),
        description: z.string().optional(),
        referenceNo: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const mId = merchant[0].id;

      const latest = await db.select().from(balanceTransactions).where(eq(balanceTransactions.merchantId, mId)).orderBy(desc(balanceTransactions.id)).limit(1);
      const currentBalance = latest.length > 0 ? parseFloat(latest[0].balance) : 0;

      if (currentBalance < input.amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = currentBalance - input.amount;

      await db.insert(balanceTransactions).values({
        merchantId: mId,
        type: "withdrawal",
        amount: (-input.amount).toFixed(2),
        balance: newBalance.toFixed(2),
        description: input.description || "Withdrawal",
        referenceNo: input.referenceNo || `WDR-${Date.now()}`,
        status: "completed",
      });

      return { success: true, newBalance };
    }),
});
