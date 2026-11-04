// Shared-password login, signed with SESSION_SECRET.
// The cookie holds only an expiry time and a signature. The signature also covers
// a fingerprint of the password, so changing SITE_PASSWORD logs everyone out.

export const COOKIE_NAME = "__Host-gb_session";
export const SESSION_DAYS = 30;
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();

export function isConfigured(env) {
  return (
    typeof env.SITE_PASSWORD === "string" &&
    env.SITE_PASSWORD.length > 0 &&
    typeof env.SESSION_SECRET === "string" &&
    env.SESSION_SECRET.length >= MIN_SECRET_LENGTH
  );
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares two byte arrays without stopping at the first difference.
function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Both sides are hashed first, so the comparison time does not depend on the password length.
export async function checkPassword(env, attempt) {
  if (typeof attempt !== "string") return false;
  const [expected, given] = await Promise.all([
    hmac(env.SESSION_SECRET, "pw|" + env.SITE_PASSWORD),
    hmac(env.SESSION_SECRET, "pw|" + attempt),
  ]);
  return equalBytes(expected, given);
}

async function signature(env, expires) {
  return toHex(await hmac(env.SESSION_SECRET, `v1|${expires}|${env.SITE_PASSWORD}`));
}

export async function createSessionValue(env, now = Date.now()) {
  const expires = Math.floor(now / 1000) + SESSION_DAYS * 24 * 60 * 60;
  return `${expires}.${await signature(env, expires)}`;
}

export async function isValidSession(env, value, now = Date.now()) {
  if (typeof value !== "string") return false;
  const match = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires <= Math.floor(now / 1000)) return false;
  const expected = await signature(env, expires);
  return equalBytes(encoder.encode(expected), encoder.encode(match[2]));
}

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

// Host-only cookie (no Domain attribute, __Host- prefix): it is never sent to
// other subdomains such as dashboard.morimorimontessori.com.
export function sessionCookie(value) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

// Only allow redirects to a path on this site, never to another site.
export function safeNext(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.includes("\\")) return "/";
  if (/[\u0000-\u001f]/.test(value)) return "/";
  return value;
}
