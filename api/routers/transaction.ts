import { z } from "zod";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, disbursements, merchants } from "@db/schema";

export const transactionRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        type: z.enum(["collection", "disbursement", "all"]).default("all"),
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) return { items: [], total: 0 };

      const mId = merchant[0].id;
      const page = input?.page || 1;
      const limit = input?.limit || 20;

      const items: Array<{
        id: number;
        type: string;
        swiftpayId: string | null;
        referenceNo: string;
        amount: string;
        currency: string;
        status: string;
        customerName: string | null;
        recipientName: string | null;
        institutionCode: string | null;
        createdAt: Date;
      }> = [];

      if (input?.type === "all" || input?.type === "collection") {
        const conditions = [eq(transactions.merchantId, mId)];
        if (input?.status) conditions.push(eq(transactions.status, input.status as "PENDING" | "EXECUTED" | "CANCELED" | "REJECTED" | "EXPIRED"));
        if (input?.dateFrom) conditions.push(gte(transactions.createdAt, new Date(input.dateFrom)));
        if (input?.dateTo) conditions.push(lte(transactions.createdAt, new Date(input.dateTo)));

        const where = conditions.length > 1 ? and(...conditions) : conditions[0];
        const result = await db.select().from(transactions).where(where).orderBy(desc(transactions.createdAt));

        for (const t of result) {
          if (input?.search) {
            const search = input.search.toLowerCase();
            const matches = t.referenceNo.toLowerCase().includes(search) ||
                          t.customerName?.toLowerCase().includes(search) ||
                          t.customerEmail?.toLowerCase().includes(search);
            if (!matches) continue;
          }

          items.push({
            id: t.id,
            type: "collection",
            swiftpayId: t.swiftpayPaymentId,
            referenceNo: t.referenceNo,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            customerName: t.customerName,
            recipientName: null,
            institutionCode: t.institutionCode,
            createdAt: t.createdAt,
          });
        }
      }

      if (input?.type === "all" || input?.type === "disbursement") {
        const conditions = [eq(disbursements.merchantId, mId)];
        if (input?.status) conditions.push(eq(disbursements.status, input.status as "PENDING" | "EXECUTED" | "REJECTED" | "FAILED"));
        if (input?.dateFrom) conditions.push(gte(disbursements.createdAt, new Date(input.dateFrom)));
        if (input?.dateTo) conditions.push(lte(disbursements.createdAt, new Date(input.dateTo)));

        const where = conditions.length > 1 ? and(...conditions) : conditions[0];
        const result = await db.select().from(disbursements).where(where).orderBy(desc(disbursements.createdAt));

        for (const d of result) {
          if (input?.search) {
            const search = input.search.toLowerCase();
            const matches = d.merchantReferenceNo.toLowerCase().includes(search) ||
                          d.recipientFirstName.toLowerCase().includes(search) ||
                          d.recipientLastName.toLowerCase().includes(search) ||
                          d.recipientEmail?.toLowerCase().includes(search);
            if (!matches) continue;
          }

          items.push({
            id: d.id,
            type: "disbursement",
            swiftpayId: d.swiftpayDisbursementId,
            referenceNo: d.merchantReferenceNo,
            amount: d.amount,
            currency: d.currency,
            status: d.status,
            customerName: null,
            recipientName: `${d.recipientFirstName} ${d.recipientLastName}`,
            institutionCode: d.institutionCode,
            createdAt: d.createdAt,
          });
        }
      }

      // Sort combined by date
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = items.length;
      const offset = (page - 1) * limit;
      const paginated = items.slice(offset, offset + limit);

      return { items: paginated, total };
    }),

  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) {
      return { totalCollected: 0, totalDisbursed: 0, pendingCount: 0, failedCount: 0, pendingAmount: 0, failedAmount: 0 };
    }

    const mId = merchant[0].id;

    const collected = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(and(eq(transactions.merchantId, mId), eq(transactions.status, "EXECUTED")));

    const disbursed = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(disbursements)
      .where(and(eq(disbursements.merchantId, mId), eq(disbursements.status, "EXECUTED")));

    const pendingCol = await db
      .select({ count: sql<number>`count(*)`, total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(and(eq(transactions.merchantId, mId), eq(transactions.status, "PENDING")));

    const pendingDis = await db
      .select({ count: sql<number>`count(*)`, total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(disbursements)
      .where(and(eq(disbursements.merchantId, mId), eq(disbursements.status, "PENDING")));

    const failedCol = await db
      .select({ count: sql<number>`count(*)`, total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(and(eq(transactions.merchantId, mId), eq(transactions.status, "REJECTED")));

    return {
      totalCollected: parseFloat(collected[0]?.total || "0"),
      totalDisbursed: parseFloat(disbursed[0]?.total || "0"),
      pendingCount: (pendingCol[0]?.count || 0) + (pendingDis[0]?.count || 0),
      failedCount: (failedCol[0]?.count || 0),
      pendingAmount: parseFloat(pendingCol[0]?.total || "0") + parseFloat(pendingDis[0]?.total || "0"),
      failedAmount: parseFloat(failedCol[0]?.total || "0"),
    };
  }),

  getVolumeData: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(90).default(30) }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) return { dates: [], collections: [], disbursements: [] };

      const mId = merchant[0].id;
      const days = input?.days || 30;
      const dates: string[] = [];
      const collections: number[] = [];
      const disbursementsData: number[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);

        const colResult = await db
          .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, mId),
              eq(transactions.status, "EXECUTED"),
              gte(transactions.createdAt, new Date(dateStr)),
              lte(transactions.createdAt, new Date(dateStr + "T23:59:59")),
            ),
          );

        const disResult = await db
          .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
          .from(disbursements)
          .where(
            and(
              eq(disbursements.merchantId, mId),
              eq(disbursements.status, "EXECUTED"),
              gte(disbursements.createdAt, new Date(dateStr)),
              lte(disbursements.createdAt, new Date(dateStr + "T23:59:59")),
            ),
          );

        collections.push(parseFloat(colResult[0]?.total || "0"));
        disbursementsData.push(parseFloat(disResult[0]?.total || "0"));
      }

      return { dates, collections, disbursements: disbursementsData };
    }),

  getDetails: authedQuery
    .input(z.object({ id: z.number(), type: z.enum(["collection", "disbursement"]) }))
    .query(async ({ input }) => {
      const db = getDb();
      if (input.type === "collection") {
        const result = await db.select().from(transactions).where(eq(transactions.id, input.id)).limit(1);
        return result[0] ? { ...result[0], type: "collection" as const } : null;
      } else {
        const result = await db.select().from(disbursements).where(eq(disbursements.id, input.id)).limit(1);
        return result[0] ? { ...result[0], type: "disbursement" as const } : null;
      }
    }),
});
