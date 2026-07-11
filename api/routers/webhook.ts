import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, disbursements, settings } from "@db/schema";
import { verifySwiftPaySignature } from "../lib/crypto";

export const webhookRouter = createRouter({
  collectionCallback: publicQuery
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

      // Find transaction to get merchantId
      const txnResult = await db
        .select()
        .from(transactions)
        .where(eq(transactions.referenceNo, input.x_reference_no))
        .limit(1);

      if (txnResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }

      const txn = txnResult[0];

      // Get merchant's secret key
      const settingResult = await db
        .select()
        .from(settings)
        .where(eq(settings.merchantId, txn.merchantId))
        .limit(1);

      if (settingResult.length === 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Merchant settings not found" });
      }

      const s = settingResult[0];
      const secretKey = s.environment === "sandbox" ? s.sandboxSecretKey : s.productionSecretKey;

      if (!secretKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Secret key not configured" });
      }

      // Verify signature
      const isValid = verifySwiftPaySignature(input as unknown as Record<string, unknown>, input.signature, secretKey);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid signature" });
      }

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

  disbursementWebhook: publicQuery
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

      // Find merchant by access key
      const settingResult = await db
        .select()
        .from(settings)
        .where(
          input.x_access_key.startsWith("pk_live")
            ? eq(settings.productionAccessKey, input.x_access_key)
            : eq(settings.sandboxAccessKey, input.x_access_key)
        )
        .limit(1);

      if (settingResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Merchant settings not found for this access key" });
      }

      const s = settingResult[0];
      const secretKey = s.environment === "sandbox" ? s.sandboxSecretKey : s.productionSecretKey;

      if (!secretKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Secret key not configured" });
      }

      // Verify signature
      const isValid = verifySwiftPaySignature(input as unknown as Record<string, unknown>, input.signature, secretKey);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid signature" });
      }

      const result = await db
        .select()
        .from(disbursements)
        .where(eq(disbursements.merchantReferenceNo, input.x_reference_no))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Disbursement not found" });
      }

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
