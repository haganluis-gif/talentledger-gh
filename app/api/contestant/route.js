import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contestant ID is required." },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: "Contestant not found." },
        { status: 404 }
      );
    }

    const limiter = rateLimit(`pass:${clientIp(request)}`, {
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: contestant, error } = await supabaseAdmin
      .from("contestants")
      .select(
        "id, contestant_id, full_name, location, payment_status, created_at, program, age, city, church_denomination, media_url"
      )
      .eq("contestant_id", id)
      .single();

    if (error || !contestant) {
      return NextResponse.json(
        { error: "Contestant not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ contestant }, { status: 200 });
  } catch (err) {
    console.error("Contestant lookup error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}