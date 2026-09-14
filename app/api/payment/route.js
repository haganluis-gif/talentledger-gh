import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getPaystackSecretKey,
  getProgramFee,
  AUDITION_FEE_CURRENCY,
} from "@/lib/paystack";
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

    const limiter = rateLimit(`payment:${clientIp(request)}`, {
      limit: 20,
      windowMs: 10 * 60 * 1000, // 20 per 10 minutes per IP
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many payment attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json().catch(() => null);
    const contestantId = body?.contestantId;

    if (typeof contestantId !== "string" || !contestantId) {
      return NextResponse.json(
        { error: "Contestant ID is required." },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9-]+$/.test(contestantId)) {
      return NextResponse.json(
        { error: "Invalid contestant ID." },
        { status: 400 }
      );
    }

    const { data: contestant, error: fetchError } = await supabaseAdmin
      .from("contestants")
      .select("contestant_id, full_name, phone, payment_status, program")
      .eq("contestant_id", contestantId)
      .single();

    if (fetchError || !contestant) {
      return NextResponse.json(
        { error: "Contestant not found." },
        { status: 404 }
      );
    }

    // The fee is resolved from the *stored* program, never from the
    // client, so a caller cannot downgrade to a cheaper program.
    const fee = getProgramFee(contestant.program);

    const secretKey = getPaystackSecretKey();

    if (!secretKey) {
      if (process.env.NODE_ENV === "production") {
        // Never auto-grant "paid" in production.
        return NextResponse.json(
          { error: "Payments are not configured yet." },
          { status: 503 }
        );
      }
      // Dev-only simulation: never shipped to production.
      const { data: updated } = await supabaseAdmin
        .from("contestants")
        .update({ payment_status: "paid" })
        .eq("contestant_id", contestantId)
        .select("id, contestant_id, full_name, payment_status")
        .single();

      return NextResponse.json({
        status: "success",
        message: "Payment simulated (dev only — no API key configured).",
        contestant: updated,
      });
    }

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `${contestant.phone.replace(/[\s-]/g, "")}@talentledgergh.com`,
          amount: fee,
          currency: AUDITION_FEE_CURRENCY,
          metadata: {
            contestant_id: contestantId,
            full_name: contestant.full_name,
            program: contestant.program || "ngs",
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/pass?id=${contestantId}`,
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { error: "Payment initialization failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      authorization_url: paystackData.data.authorization_url,
      contestant: {
        id: contestant.id,
        contestant_id: contestant.contestant_id,
        full_name: contestant.full_name,
        payment_status: contestant.payment_status,
      },
    });
  } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}