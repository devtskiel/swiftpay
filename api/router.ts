import { authRouter } from "./routers/auth";
import { merchantRouter } from "./routers/merchant";
import { memberRouter } from "./routers/member";
import { collectionRouter } from "./routers/collection";
import { disbursementRouter } from "./routers/disbursement";
import { transactionRouter } from "./routers/transaction";
import { settingsRouter } from "./routers/settings";
import { balanceRouter } from "./routers/balance";
import { kycRouter } from "./routers/kyc";
import { webhookRouter } from "./routers/webhook";
import { apiKeyRouter } from "./routers/apiKey";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  merchant: merchantRouter,
  member: memberRouter,
  collection: collectionRouter,
  disbursement: disbursementRouter,
  transaction: transactionRouter,
  settings: settingsRouter,
  balance: balanceRouter,
  kyc: kycRouter,
  webhook: webhookRouter,
  apiKey: apiKeyRouter,
});

export type AppRouter = typeof appRouter;
