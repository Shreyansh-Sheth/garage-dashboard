export type AuthRole = "admin" | "readonly";

const COOKIE_NAME = "garage-auth";
const SALT = "garage-dashboard-v1";
const SESSION_MAX_AGE = 60 * 60; // 1 hour in seconds

export { COOKIE_NAME, SESSION_MAX_AGE };

/**
 * Compute a time-bound auth token with an embedded role.
 * Format: `role:issuedAt_hex.signature_hex`
 */
export async function createAuthToken(password: string, role: AuthRole): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const signature = await sign(password, role, issuedAt);
  return `${role}:${issuedAt.toString(16)}.${signature}`;
}

/**
 * Validate a token and return the role if valid, or null if expired/tampered.
 */
export async function validateAuthToken(
  token: string,
  password: string,
): Promise<AuthRole | null> {
  // Parse "role:issuedAt_hex.signature"
  const colonIndex = token.indexOf(":");
  if (colonIndex === -1) return null;

  const role = token.slice(0, colonIndex) as string;
  if (role !== "admin" && role !== "readonly") return null;

  const rest = token.slice(colonIndex + 1);
  const dotIndex = rest.indexOf(".");
  if (dotIndex === -1) return null;

  const issuedAtHex = rest.slice(0, dotIndex);
  const signature = rest.slice(dotIndex + 1);

  const issuedAt = parseInt(issuedAtHex, 16);
  if (isNaN(issuedAt)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > SESSION_MAX_AGE) return null;
  if (issuedAt > now + 60) return null;

  const expected = await sign(password, role, issuedAt);
  if (signature !== expected) return null;

  return role;
}

async function sign(password: string, role: string, issuedAt: number): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = `${SALT}:${role}:${issuedAt}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
