import { z } from "zod";
import { eq, desc, like, and, gte, lte, sql } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, merchants, settings } from "@db/schema";
import { generateSwiftPaySignature } from "../lib/crypto";

async function getSwiftPayConfig(merchantId: number) {
  const db = getDb();
  const setting = await db.select().from(settings).where(eq(settings.merchantId, merchantId)).limit(1);
  if (setting.length === 0) return null;
  const s = setting[0];
  const isSandbox = s.environment === "sandbox";
  return {
    environment: s.environment,
    accessKey: isSandbox ? s.sandboxAccessKey : s.productionAccessKey,
    secretKey: isSandbox ? s.sandboxSecretKey : s.productionSecretKey,
    baseUrl: isSandbox ? "https://api.pay.sandbox.live.swiftpay.ph" : "https://api.pay.live.swiftpay.ph",
  };
}

export const collectionRouter = createRouter({
  initializeOrder: authedQuery
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(1),
        customerAddress: z.string().optional(),
        amount: z.number().positive(),
        referenceNo: z.string().optional(),
        institutionCode: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const m = merchant[0];
      const config = await getSwiftPayConfig(m.id);
      if (!config || !config.accessKey || !config.secretKey) {
        throw new Error("Payment gateway credentials not configured");
      }

      const refNo = input.referenceNo || `COL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const amountStr = input.amount.toFixed(2);

      if (config.environment === "production") {
        // [PRODUCTION] Magpie Collection Integration
        try {
          const response = await fetch("https://api.magpie.im/v1/checkout/sessions", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${Buffer.from(config.secretKey + ":").toString("base64")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: Math.round(input.amount * 100), // Magpie uses cents/centavos
              currency: "php",
              description: input.description || `Order ${refNo}`,
              client_reference_id: refNo,
              success_url: `${process.env.APP_URL || "http://localhost:3000"}/payment/success?ref=${refNo}`,
              cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/payment/cancel?ref=${refNo}`,
              customer: {
                name: input.customerName,
                email: input.customerEmail,
                phone: input.customerPhone,
              },
            }),
          });

          if (!response.ok) {
            const err = await response.json() as any;
            throw new Error(`Magpie error: ${err.error?.message || response.statusText}`);
          }

          const session = await response.json() as any;

          // Store transaction locally
          await db.insert(transactions).values({
            merchantId: m.id,
            referenceNo: refNo,
            amount: input.amount.toFixed(2),
            currency: "PHP",
            status: "PENDING",
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            customerAddress: input.customerAddress ? { address: input.customerAddress } : null,
            institutionCode: "MAGPIE",
          });

          return { customerRedirectUrl: session.url, referenceNo: refNo };
        } catch (error: any) {
          throw new Error(`Failed to initialize Magpie payment: ${error.message}`);
        }
      } else {
        // [SANDBOX] SwiftPay Collection integration
        const payload: Record<string, unknown> = {
          x_access_key: config.accessKey,
          x_reference_no: refNo,
          x_amount: amountStr,
          x_currency: "PHP",
        };

        const signature = generateSwiftPaySignature(payload, config.secretKey);

        // Store transaction locally
        await db.insert(transactions).values({
          merchantId: m.id,
          referenceNo: refNo,
          amount: input.amount.toFixed(2),
          currency: "PHP",
          status: "PENDING",
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress ? { address: input.customerAddress } : null,
          institutionCode: input.institutionCode || null,
          signature,
        });

        // Build redirect URL
        const params = new URLSearchParams({
          x_access_key: config.accessKey as string,
          x_reference_no: refNo,
          x_amount: amountStr,
          x_currency: "PHP",
          signature,
        });
        if (input.institutionCode) params.append("institution_code", input.institutionCode);

        const customerRedirectUrl = `${config.baseUrl}/api/bootstrap?${params.toString()}`;

        return { customerRedirectUrl, referenceNo: refNo };
      }
    }),

  list: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) return { transactions: [], total: 0 };

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      const conditions = [eq(transactions.merchantId, merchant[0].id)];
      if (input?.status) conditions.push(eq(transactions.status, input.status as "PENDING" | "EXECUTED" | "CANCELED" | "REJECTED" | "EXPIRED"));
      if (input?.search) conditions.push(like(transactions.referenceNo, `%${input.search}%`));
      if (input?.dateFrom) conditions.push(gte(transactions.createdAt, new Date(input.dateFrom)));
      if (input?.dateTo) conditions.push(lte(transactions.createdAt, new Date(input.dateTo)));

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const result = await db.select().from(transactions).where(where).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(transactions).where(where);

      return { transactions: result, total: countResult[0]?.count || 0 };
    }),

  getById: authedQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const result = await db.select().from(transactions).where(eq(transactions.id, input.id)).limit(1);
    return result[0] || null;
  }),

  handleCallback: publicQuery
    .input(
      z.object({
        signature: z.string(),
        x_payment_status: z.enum(["PENDING", "EXECUTED", "CANCELED", "REJECTED", "EXPIRED"]),
        x_payment_id: z.string(),
        x_reference_no: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.referenceNo, input.x_reference_no))
        .limit(1);

      if (result.length === 0) return { success: false, message: "Transaction not found" };

      const txn = result[0];
      await db
        .update(transactions)
        .set({
          swiftpayPaymentId: input.x_payment_id,
          status: input.x_payment_status,
          callbackReceived: true,
          callbackPayload: input as unknown as Record<string, unknown>,
          executedAt: input.x_payment_status === "EXECUTED" ? new Date() : txn.executedAt,
        })
        .where(eq(transactions.id, txn.id));

      return { success: true };
    }),
});
