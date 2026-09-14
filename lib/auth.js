// Admin session management.
//
// Stateless, HMAC-signed session cookie:
//   admin_session = base64url(payload).base64url(hmac_sha256(ADMIN_PASSWORD, payload))
//   payload = { exp: <ms epoch>, jti: <random> }
//
// Why ADMIN_PASSWORD as the HMAC key: whoever holds the password may
// authenticate directly, so forging a session token buys no extra power.
// A dedicated AUTH_SECRET env var can be introduced later if desired.

import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

function sign(b64payload) {
  return createHmac("sha256", secret()).update(b64payload).digest("base64url");
}

export function createSessionToken() {
  const payload = { exp: Date.now() + SESSION_TTL_MS, jti: randomUUID() };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${b64}.${sign(b64)}`;
}

export function verifySessionToken(token) {
  const key = secret();
  if (typeof token !== "string" || !key) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64, sig] = parts;

  const expected = sign(b64);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export function getSessionFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : false;
}

export function verifyPassword(input) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || typeof input !== "string") return false;

  const a = createHmac("sha256", pw).update(input).digest();
  const b = createHmac("sha256", pw).update(pw).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export function setSessionCookie(res) {
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(res) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}