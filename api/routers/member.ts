import { z } from "zod";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { members, users, merchants } from "@db/schema";
import { signToken } from "../lib/jwt";
import * as cookie from "cookie";

export const memberRouter = createRouter({
  list: adminQuery.query(async ({ ctx }) => {
    const db = getDb();
    const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
    if (merchant.length === 0) return [];

    return db.select().from(members).where(eq(members.merchantId, merchant[0].id));
  }),

  invite: adminQuery
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "member", "developer"]).default("member"),
        permissions: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

      const inviteToken = crypto.randomBytes(32).toString("hex");

      await db.insert(members).values({
        merchantId: merchant[0].id,
        email: input.email,
        role: input.role,
        permissions: input.permissions,
        invitedBy: ctx.user.id,
        inviteToken,
        status: "invited",
      });

      return { success: true, inviteUrl: `/invite/${inviteToken}` };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["admin", "member", "developer"]).optional(),
        permissions: z.array(z.string()).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const merchant = await db.select().from(merchants).where(eq(merchants.userId, ctx.user.id)).limit(1);
      if (merchant.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant not found" });

      const updateData: Record<string, unknown> = {};
      if (input.role !== undefined) updateData.role = input.role;
      if (input.permissions !== undefined) updateData.permissions = input.permissions;
      if (input.status !== undefined) updateData.status = input.status;

      await db.update(members).set(updateData).where(eq(members.id, input.id));
      return { success: true };
    }),

  deactivate: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(members).set({ status: "inactive" }).where(eq(members.id, input.id));
      return { success: true };
    }),

  acceptInvite: publicQuery
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8),
        fullName: z.string().min(2),
        mobileNumber: z.string().min(10),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const memberResult = await db.select().from(members).where(eq(members.inviteToken, input.token)).limit(1);
      if (memberResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation token" });
      }

      const member = memberResult[0];

      // Create user account
      const passwordHash = await bcrypt.hash(input.password, 12);
      const userResult = await db.insert(users).values({
        email: member.email,
        passwordHash,
        fullName: input.fullName,
        mobileNumber: input.mobileNumber,
        role: member.role,
        status: "active",
        emailVerified: true,
      });

      const userId = Number(userResult[0].insertId);

      // Update member
      await db
        .update(members)
        .set({ userId, status: "active", inviteToken: null, fullName: input.fullName })
        .where(eq(members.id, member.id));

      const token = await signToken(
        { userId, email: member.email, role: member.role, merchantId: member.merchantId },
        "24h",
      );

      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize("auth_token", token, {
          httpOnly: true,
          path: "/",
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          maxAge: 86400,
        }),
      );

      return { success: true, token };
    }),
});
