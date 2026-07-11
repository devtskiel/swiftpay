import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  boolean,
  json,
  date,
  datetime,
  int,
} from "drizzle-orm/mysql-core";

// ─── Users ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),
  role: mysqlEnum("role", ["super_admin", "admin", "member"]).default("member").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("pending").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: datetime("reset_token_expiry"),
  lastLoginAt: datetime("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Merchants ─────────────────────────────────────────
export const merchants = mysqlTable("merchants", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessType: mysqlEnum("business_type", ["sole_proprietorship", "partnership", "corporation", "cooperative"]).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }).notNull(),
  taxId: varchar("tax_id", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 100 }).notNull(),
  yearsInOperation: int("years_in_operation").default(0),
  contactPersonName: varchar("contact_person_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  websiteUrl: varchar("website_url", { length: 255 }),
  streetAddress: varchar("street_address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 50 }).default("Philippines").notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  status: mysqlEnum("merchant_status", ["pending", "active", "suspended"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Merchant = typeof merchants.$inferSelect;

// ─── Members ───────────────────────────────────────────
export const members = mysqlTable("members", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  role: mysqlEnum("member_role", ["admin", "member", "developer"]).default("member").notNull(),
  permissions: json("permissions").$type<string[]>().default([]).notNull(),
  status: mysqlEnum("member_status", ["active", "inactive", "invited"]).default("invited").notNull(),
  invitedBy: bigint("invited_by", { mode: "number", unsigned: true }).notNull(),
  inviteToken: varchar("invite_token", { length: 255 }),
  lastActiveAt: datetime("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Member = typeof members.$inferSelect;

// ─── KYC Documents ─────────────────────────────────────
export const kycDocuments = mysqlTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  documentType: mysqlEnum("document_type", ["passport", "drivers_license", "national_id", "umid", "prc_id"]).notNull(),
  documentNumber: varchar("document_number", { length: 100 }).notNull(),
  documentFileUrl: varchar("document_file_url", { length: 500 }).notNull(),
  verificationStatus: mysqlEnum("kyc_verification_status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  verifiedAt: datetime("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── KYC Selfies ───────────────────────────────────────
export const kycSelfies = mysqlTable("kyc_selfies", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  selfieUrl: varchar("selfie_url", { length: 500 }).notNull(),
  faceDetected: boolean("face_detected").default(false).notNull(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  verificationStatus: mysqlEnum("selfie_verification_status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Business Documents ────────────────────────────────
export const businessDocuments = mysqlTable("business_documents", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  documentType: mysqlEnum("biz_doc_type", ["business_permit", "sec_registration", "bir_cor", "other"]).notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  verificationStatus: mysqlEnum("biz_doc_verification_status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Collection Transactions ───────────────────────────
export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  swiftpayPaymentId: varchar("swiftpay_payment_id", { length: 100 }),
  referenceNo: varchar("reference_no", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
  status: mysqlEnum("transaction_status", ["PENDING", "EXECUTED", "CANCELED", "REJECTED", "EXPIRED"]).default("PENDING").notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerAddress: json("customer_address"),
  institutionCode: varchar("institution_code", { length: 50 }),
  redirectUrl: varchar("redirect_url", { length: 1000 }),
  signature: varchar("signature", { length: 255 }),
  callbackReceived: boolean("callback_received").default(false).notNull(),
  callbackPayload: json("callback_payload"),
  executedAt: datetime("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Transaction = typeof transactions.$inferSelect;

// ─── Disbursements ─────────────────────────────────────
export const disbursements = mysqlTable("disbursements", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  swiftpayDisbursementId: varchar("swiftpay_disbursement_id", { length: 100 }),
  merchantReferenceNo: varchar("merchant_reference_no", { length: 100 }).notNull(),
  channel: varchar("channel", { length: 20 }).default("INSTAPAY").notNull(),
  institutionCode: varchar("institution_code", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
  status: mysqlEnum("disbursement_status", ["PENDING", "EXECUTED", "REJECTED", "FAILED"]).default("PENDING").notNull(),
  remarks: text("remarks"),
  recipientAccountNumber: varchar("recipient_account_number", { length: 50 }).notNull(),
  recipientFirstName: varchar("recipient_first_name", { length: 100 }).notNull(),
  recipientMiddleName: varchar("recipient_middle_name", { length: 100 }),
  recipientLastName: varchar("recipient_last_name", { length: 100 }).notNull(),
  recipientMobile: varchar("recipient_mobile", { length: 20 }),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientAddress: json("recipient_address"),
  channelReferenceNo: varchar("channel_reference_no", { length: 100 }),
  bankOperationId: varchar("bank_operation_id", { length: 100 }),
  errorMessage: text("error_message"),
  webhookReceived: boolean("webhook_received").default(false).notNull(),
  webhookPayload: json("webhook_payload"),
  executedAt: datetime("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Disbursement = typeof disbursements.$inferSelect;

// ─── Balance Transactions ──────────────────────────────
export const balanceTransactions = mysqlTable("balance_transactions", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("balance_txn_type", ["top_up", "withdrawal", "fee", "adjustment"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  referenceNo: varchar("reference_no", { length: 100 }),
  status: mysqlEnum("balance_txn_status", ["completed", "pending", "failed"]).default("completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Settings ──────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  environment: mysqlEnum("swiftpay_env", ["sandbox", "production"]).default("sandbox").notNull(),
  sandboxAccessKey: varchar("sandbox_access_key", { length: 255 }),
  sandboxSecretKey: varchar("sandbox_secret_key", { length: 255 }),
  productionAccessKey: varchar("production_access_key", { length: 255 }),
  productionSecretKey: varchar("production_secret_key", { length: 255 }),
  redirectUrl: varchar("redirect_url", { length: 500 }),
  callbackUrl: varchar("callback_url", { length: 500 }),
  webhookUrl: varchar("webhook_url", { length: 500 }),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Manila").notNull(),
  dateFormat: varchar("date_format", { length: 30 }).default("MMM d, yyyy").notNull(),
  currencyDisplay: varchar("currency_display", { length: 30 }).default("symbol").notNull(),
  itemsPerPage: int("items_per_page").default(20).notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── Platform API Keys ─────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: serial("id").primaryKey(),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  publicKey: varchar("public_key", { length: 255 }).notNull().unique(),
  secretKey: varchar("secret_key", { length: 255 }).notNull(),
  environment: mysqlEnum("api_key_env", ["sandbox", "production"]).default("sandbox").notNull(),
  status: mysqlEnum("api_key_status", ["active", "revoked"]).default("active").notNull(),
  lastUsedAt: datetime("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Activity Logs ─────────────────────────────────────
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  merchantId: bigint("merchant_id", { mode: "number", unsigned: true }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: bigint("entity_id", { mode: "number", unsigned: true }),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
