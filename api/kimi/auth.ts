import type { Context } from "hono";

// Stub - Kimi OAuth not used. We use custom email/password auth.
export async function authenticateRequest(_headers: Headers) {
  return undefined;
}

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    return c.redirect("/login", 302);
  };
}
