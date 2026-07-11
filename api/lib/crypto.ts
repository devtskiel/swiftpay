import crypto from "crypto";

/**
 * Generates an HMAC-SHA256 signature for SwiftPay API requests and webhooks.
 *
 * It sorts parameters starting with "x_" alphabetically, concatenates their values,
 * and hashes them using the secret key.
 */
export function generateSwiftPaySignature(params: Record<string, unknown>, secretKey: string): string {
  const xParams = Object.entries(params)
    .filter(([key]) => key.startsWith("x_") && key !== "x_signature" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b));

  const message = xParams.map(([_, v]) => String(v)).join("");
  return crypto.createHmac("sha256", secretKey).update(message).digest("hex");
}

export function verifySwiftPaySignature(params: Record<string, unknown>, signature: string, secretKey: string): boolean {
  const expectedSignature = generateSwiftPaySignature(params, secretKey);
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
