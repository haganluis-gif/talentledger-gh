import { NextResponse } from "next/server";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-guard";

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403 }
      );
    }

    const limiter = rateLimit(`admin-login:${clientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes per IP
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res);
    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}