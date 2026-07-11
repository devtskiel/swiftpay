import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User, Merchant } from "@db/schema";
import { verifyToken } from "./lib/jwt";
import { getDb } from "./queries/connection";
import { users, merchants } from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User & { merchant?: Merchant };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  try {
    // Extract token from cookie
    const cookieHeader = opts.req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, c) => {
        const [k, v] = c.trim().split("=");
        if (k) acc[k] = v;
        return acc;
      }, {} as Record<string, string>);

      const token = cookies["auth_token"];
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          const db = getDb();
          const userResult = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
          if (userResult.length > 0) {
            const user = userResult[0];
            if (user.status === "active") {
              // Fetch merchant
              const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
              ctx.user = {
                ...user,
                merchant: merchantResult[0] || undefined,
              };
            }
          }
        }
      }
    }
  } catch {
    // Authentication is optional
  }

  return ctx;
}
