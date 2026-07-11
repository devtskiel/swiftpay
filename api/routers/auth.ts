import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, merchants, settings, kycDocuments, kycSelfies, businessDocuments } from "@db/schema";
import { signToken } from "../lib/jwt";
import * as cookie from "cookie";

function setAuthCookie(resHeaders: Headers, token: string, maxAge: number = 86400) {
  resHeaders.append(
    "set-cookie",
    cookie.serialize("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge,
    }),
  );
}

export const authRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(2),
        mobileNumber: z.string().min(10),
        businessName: z.string().min(2),
        businessType: z.enum(["sole_proprietorship", "partnership", "corporation", "cooperative"]),
        registrationNumber: z.string().min(1),
        taxId: z.string().min(1),
        industry: z.string().min(1),
        yearsInOperation: z.number().int().min(0).optional(),
        streetAddress: z.string().min(1),
        city: z.string().min(1),
        province: z.string().min(1),
        postalCode: z.string().min(1),
        // KYC
        idType: z.enum(["passport", "drivers_license", "national_id", "umid", "prc_id"]).optional(),
        idNumber: z.string().optional(),
        idFile: z.string().optional(),
        selfieUrl: z.string().optional(),
        // Business Documents
        permitNumber: z.string().optional(),
        permitFile: z.string().optional(),
        secFile: z.string().optional(),
        birFile: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if email already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      // Create user
      const userResult = await db.insert(users).values({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        mobileNumber: input.mobileNumber,
        role: "super_admin",
        status: "active",
        emailVerified: false,
        lastLoginAt: new Date(),
      });

      const userId = Number(userResult[0].insertId);

      // Create merchant
      const merchantResult = await db.insert(merchants).values({
        userId,
        businessName: input.businessName,
        businessType: input.businessType,
        registrationNumber: input.registrationNumber,
        taxId: input.taxId,
        industry: input.industry,
        yearsInOperation: input.yearsInOperation || 0,
        streetAddress: input.streetAddress,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        country: "Philippines",
        status: "active",
      });

      const merchantId = Number(merchantResult[0].insertId);

      // Save KYC ID
      if (input.idType && input.idNumber && input.idFile) {
        await db.insert(kycDocuments).values({
          userId,
          merchantId,
          documentType: input.idType,
          documentNumber: input.idNumber,
          documentFileUrl: input.idFile,
          verificationStatus: "pending",
        });
      }

      // Save Selfie
      if (input.selfieUrl) {
        await db.insert(kycSelfies).values({
          userId,
          merchantId,
          selfieUrl: input.selfieUrl,
          faceDetected: true,
          confidenceScore: "0.99",
          verificationStatus: "pending",
        });
      }

      // Save Business Permit
      if (input.permitFile) {
        await db.insert(businessDocuments).values({
          merchantId,
          documentType: "business_permit",
          documentNumber: input.permitNumber,
          fileUrl: input.permitFile,
          verificationStatus: "pending",
        });
      }

      // Save SEC
      if (input.secFile) {
        await db.insert(businessDocuments).values({
          merchantId,
          documentType: "sec_registration",
          fileUrl: input.secFile,
          verificationStatus: "pending",
        });
      }

      // Save BIR
      if (input.birFile) {
        await db.insert(businessDocuments).values({
          merchantId,
          documentType: "bir_cor",
          fileUrl: input.birFile,
          verificationStatus: "pending",
        });
      }

      // Create default settings
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      await db.insert(settings).values({
        merchantId,
        environment: "sandbox",
        callbackUrl: `${appUrl}/api/webhook/collection`,
        webhookUrl: `${appUrl}/api/webhook/disbursement`,
        redirectUrl: `${appUrl}/payment/callback`,
      });

      const token = await signToken(
        { userId, email: input.email, role: "super_admin", merchantId },
        "24h",
      );
      setAuthCookie(ctx.resHeaders, token, 86400);

      return {
        success: true,
        token,
        user: {
          id: userId,
          email: input.email,
          fullName: input.fullName,
          role: "super_admin" as const,
          merchantId,
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (userResult.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const user = userResult[0];
      const validPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      if (user.status === "inactive") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account is deactivated" });
      }

      // Get merchant
      const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
      const merchantId = merchantResult[0]?.id;

      // Update last login
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

      const expiresIn = input.rememberMe ? "30d" : "24h";
      const maxAge = input.rememberMe ? 2592000 : 86400;
      const token = await signToken(
        { userId: user.id, email: user.email, role: user.role, merchantId },
        expiresIn,
      );
      setAuthCookie(ctx.resHeaders, token, maxAge);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          merchantId,
        },
      };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize("auth_token", "", {
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  me: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = ctx.user;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      merchant: merchantResult[0] || null,
    };
  }),

  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (userResult.length === 0) {
        // Return success even if email not found (security)
        return { success: true };
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await db
        .update(users)
        .set({ resetToken, resetTokenExpiry })
        .where(eq(users.id, userResult[0].id));

      return { success: true };
    }),

  resetPassword: publicQuery
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, input.token))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
      }

      const user = userResult[0];
      if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reset token has expired" });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db
        .update(users)
        .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
        .where(eq(users.id, user.id));

      return { success: true };
    }),

  changePassword: authedQuery
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const validPassword = await bcrypt.compare(input.currentPassword, ctx.user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
