import { z } from "zod";
import { eq, desc, like, and, gte, lte, sql } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { disbursements, merchants, settings } from "@db/schema";
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

export const disbursementRouter = createRouter({
  send: authedQuery
    .input(
      z.object({
        merchantReferenceNo: z.string().optional(),
        channel: z.string().default("INSTAPAY"),
        institutionCode: z.string().min(1),
        amount: z.number().positive(),
        remarks: z.string().optional(),
        recipient: z.object({
          accountNumber: z.string().min(1),
          firstName: z.string().min(1),
          middleName: z.string().optional(),
          lastName: z.string().min(1),
          mobileNumber: z.string().optional(),
          email: z.string().email().optional(),
          address: z.object({
            line1: z.string().min(1),
            line2: z.string().optional(),
            city: z.string().min(1),
            postalCode: z.string().min(1),
            province: z.string().min(1),
            countryCode: z.string().default("PH"),
          }),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const m = merchant[0];
      const config = await getSwiftPayConfig(m.id);
      if (!config || !config.accessKey || !config.secretKey) {
        throw new Error("Disbursement credentials not configured");
      }

      const refNo = input.merchantReferenceNo || `DIS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      if (config.environment === "production") {
        // [PRODUCTION] Request wizard wired to main admin
        // In production, we don't send to external API immediately.
        // We record it as PENDING and it appears on the Main Admin dashboard for approval.
        await db.insert(disbursements).values({
          merchantId: m.id,
          merchantReferenceNo: refNo,
          channel: input.channel,
          institutionCode: input.institutionCode,
          amount: input.amount.toFixed(2),
          currency: "PHP",
          status: "PENDING",
          remarks: `PROD_REQ: ${input.remarks || "No remarks"}`,
          recipientAccountNumber: input.recipient.accountNumber,
          recipientFirstName: input.recipient.firstName,
          recipientMiddleName: input.recipient.middleName || "",
          recipientLastName: input.recipient.lastName,
          recipientMobile: input.recipient.mobileNumber || "",
          recipientEmail: input.recipient.email || "",
          recipientAddress: input.recipient.address,
        });

        // Here you would typically trigger an internal notification to the platform admin
        // e.g., await notifyMainAdmin(refNo);

        return { success: true, referenceNo: refNo, message: "Disbursement request submitted for admin approval" };
      } else {
        // [SANDBOX] Swiftpay Disbursement integration
        const payload: Record<string, unknown> = {
          x_access_key: config.accessKey,
          x_reference_no: refNo,
          x_amount: input.amount.toFixed(2),
          x_currency: "PHP",
          x_channel: input.channel,
          x_institution_code: input.institutionCode,
          x_recipient_account_no: input.recipient.accountNumber,
          x_recipient_first_name: input.recipient.firstName,
          x_recipient_last_name: input.recipient.lastName,
        };

        const { generateSwiftPaySignature } = await import("../lib/crypto");
        const signature = generateSwiftPaySignature(payload, config.secretKey);

        // Store disbursement locally
        await db.insert(disbursements).values({
          merchantId: m.id,
          merchantReferenceNo: refNo,
          channel: input.channel,
          institutionCode: input.institutionCode,
          amount: input.amount.toFixed(2),
          currency: "PHP",
          status: "PENDING",
          remarks: input.remarks || "",
          recipientAccountNumber: input.recipient.accountNumber,
          recipientFirstName: input.recipient.firstName,
          recipientMiddleName: input.recipient.middleName || "",
          recipientLastName: input.recipient.lastName,
          recipientMobile: input.recipient.mobileNumber || "",
          recipientEmail: input.recipient.email || "",
          recipientAddress: input.recipient.address,
        });

        // Call SwiftPay Sandbox API
        try {
          const response = await fetch(`${config.baseUrl}/api/v1/disbursements`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Signature": signature,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json() as any;
            await db.update(disbursements)
              .set({
                swiftpayDisbursementId: data.x_disbursement_id,
                status: data.x_status || "PENDING",
              })
              .where(eq(disbursements.merchantReferenceNo, refNo));
          }
        } catch (error) {
          console.error("SwiftPay Sandbox Disbursement Error:", error);
          // Status remains PENDING, handled via webhook later
        }

        return { success: true, referenceNo: refNo };
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
      if (merchant.length === 0) return { disbursements: [], total: 0 };

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      const conditions = [eq(disbursements.merchantId, merchant[0].id)];
      if (input?.status) conditions.push(eq(disbursements.status, input.status as "PENDING" | "EXECUTED" | "REJECTED" | "FAILED"));
      if (input?.search) conditions.push(like(disbursements.merchantReferenceNo, `%${input.search}%`));
      if (input?.dateFrom) conditions.push(gte(disbursements.createdAt, new Date(input.dateFrom)));
      if (input?.dateTo) conditions.push(lte(disbursements.createdAt, new Date(input.dateTo)));

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const result = await db.select().from(disbursements).where(where).orderBy(desc(disbursements.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(disbursements).where(where);

      return { disbursements: result, total: countResult[0]?.count || 0 };
    }),

  getById: authedQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const result = await db.select().from(disbursements).where(eq(disbursements.id, input.id)).limit(1);
    return result[0] || null;
  }),

  handleWebhook: publicQuery
    .input(
      z.object({
        signature: z.string(),
        x_access_key: z.string(),
        x_reference_no: z.string(),
        x_disbursement_status: z.enum(["PENDING", "EXECUTED", "REJECTED"]),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db
        .select()
        .from(disbursements)
        .where(eq(disbursements.merchantReferenceNo, input.x_reference_no))
        .limit(1);

      if (result.length === 0) return { success: false, message: "Disbursement not found" };

      const dis = result[0];
      await db
        .update(disbursements)
        .set({
          status: input.x_disbursement_status,
          webhookReceived: true,
          webhookPayload: input as unknown as Record<string, unknown>,
          executedAt: input.x_disbursement_status === "EXECUTED" ? new Date() : dis.executedAt,
        })
        .where(eq(disbursements.id, dis.id));

      return { success: true };
    }),
});
