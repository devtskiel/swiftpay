import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { kycDocuments, kycSelfies, businessDocuments, merchants } from "@db/schema";

export const kycRouter = createRouter({
  uploadDocument: authedQuery
    .input(
      z.object({
        documentType: z.enum(["passport", "drivers_license", "national_id", "umid", "prc_id"]),
        documentNumber: z.string().min(1),
        fileUrl: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const m = merchant[0];
      await db.insert(kycDocuments).values({
        userId: ctx.user.id,
        merchantId: m.id,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        documentFileUrl: input.fileUrl,
        verificationStatus: "pending",
      });

      return { success: true };
    }),

  uploadSelfie: authedQuery
    .input(
      z.object({
        selfieUrl: z.string().min(1),
        faceDetected: z.boolean(),
        confidenceScore: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const m = merchant[0];
      await db.insert(kycSelfies).values({
        userId: ctx.user.id,
        merchantId: m.id,
        selfieUrl: input.selfieUrl,
        faceDetected: input.faceDetected,
        confidenceScore: input.confidenceScore ? input.confidenceScore.toFixed(4) : null,
        verificationStatus: input.faceDetected ? "verified" : "pending",
      });

      return { success: true, faceDetected: input.faceDetected };
    }),

  uploadBusinessDoc: authedQuery
    .input(
      z.object({
        documentType: z.enum(["business_permit", "sec_registration", "bir_cor", "other"]),
        documentNumber: z.string().optional(),
        fileUrl: z.string().min(1),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const m = merchant[0];
      await db.insert(businessDocuments).values({
        merchantId: m.id,
        documentType: input.documentType,
        documentNumber: input.documentNumber || null,
        fileUrl: input.fileUrl,
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        verificationStatus: "pending",
      });

      return { success: true };
    }),

  getStatus: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) return { documents: [], selfie: null, businessDocs: [], overallStatus: "pending" };

    const m = merchant[0];
    const documents = await db.select().from(kycDocuments).where(eq(kycDocuments.merchantId, m.id));
    const selfie = await db.select().from(kycSelfies).where(eq(kycSelfies.merchantId, m.id)).limit(1);
    const bizDocs = await db.select().from(businessDocuments).where(eq(businessDocuments.merchantId, m.id));

    const overallStatus = documents.length > 0 && selfie.length > 0 && selfie[0].faceDetected && bizDocs.length > 0 ? "verified" : "pending";

    return { documents, selfie: selfie[0] || null, businessDocs: bizDocs, overallStatus };
  }),
});
