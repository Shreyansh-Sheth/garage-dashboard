const COOKIE_NAME = "garage-auth";
const SALT = "garage-dashboard-v1";

export { COOKIE_NAME };

/**
 * Compute the expected auth token from a password.
 * Uses Web Crypto (available in both Edge and Node runtimes).
 */
export async function computeAuthToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(SALT),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
