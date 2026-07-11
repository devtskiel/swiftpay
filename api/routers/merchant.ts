import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { merchants, kycDocuments, kycSelfies, businessDocuments } from "@db/schema";

export const merchantRouter = createRouter({
  getProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    return result[0] || null;
  }),

  updateProfile: adminQuery
    .input(
      z.object({
        businessName: z.string().min(1).optional(),
        businessType: z.enum(["sole_proprietorship", "partnership", "corporation", "cooperative"]).optional(),
        registrationNumber: z.string().optional(),
        taxId: z.string().optional(),
        industry: z.string().optional(),
        yearsInOperation: z.number().int().min(0).optional(),
        contactPersonName: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        websiteUrl: z.string().optional(),
        streetAddress: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new Error("Merchant not found");

      const updateData: Record<string, unknown> = {};
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) updateData[key] = value;
      });

      await db.update(merchants).set(updateData).where(eq(merchants.id, merchant[0].id));

      const updated = await db.select().from(merchants).where(eq(merchants.id, merchant[0].id)).limit(1);
      return updated[0];
    }),

  getComplianceStatus: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) return { items: [] };

    const m = merchant[0];

    const kycDoc = await db.select().from(kycDocuments).where(eq(kycDocuments.merchantId, m.id)).limit(1);
    const selfie = await db.select().from(kycSelfies).where(eq(kycSelfies.merchantId, m.id)).limit(1);
    const bizDocs = await db.select().from(businessDocuments).where(eq(businessDocuments.merchantId, m.id));

    return {
      items: [
        { label: "Business Registration", status: m.status === "active" ? "verified" : "pending", detail: m.registrationNumber },
        { label: "Government ID", status: kycDoc.length > 0 ? kycDoc[0].verificationStatus : "pending", detail: kycDoc[0]?.documentType },
        { label: "Selfie Verification", status: selfie.length > 0 ? selfie[0].verificationStatus : "pending", detail: selfie[0]?.faceDetected ? "Face detected" : "" },
        { label: "Business Permits", status: bizDocs.length > 0 ? "verified" : "pending", detail: `${bizDocs.length} documents` },
        { label: "Terms & Conditions", status: "verified", detail: "Accepted" },
        { label: "KYC/AML Check", status: kycDoc.length > 0 && selfie.length > 0 ? "verified" : "pending", detail: "" },
      ],
    };
  }),
});
