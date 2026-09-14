import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getPaystackSecretKey,
  AUDITION_FEE_PESEWAS,
  AUDITION_FEE_CURRENCY,
} from "@/lib/paystack";

export async function POST(request) {
  try {
    const secretKey = getPaystackSecretKey();

    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack is not configured." },
        { status: 503 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 401 });
    }

    const expected = createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const contestantId = event.data?.metadata?.contestant_id;

    if (!contestantId || typeof contestantId !== "string") {
      return NextResponse.json({ error: "Missing contestant ID." }, { status: 400 });
    }

    // Only honour verified charges for the exact configured amount.
    // Reject refunds, partial payments, or wrong-currency charges.
    if (
      event.data?.amount !== AUDITION_FEE_PESEWAS ||
      event.data?.currency !== AUDITION_FEE_CURRENCY ||
      typeof event.data?.reference !== "string" ||
      !event.data.reference
    ) {
      return NextResponse.json(
        { error: "Charge verification failed." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("contestants")
      .update({ payment_status: "paid" })
      .eq("contestant_id", contestantId);

    if (error) {
      console.error("Webhook DB error:", error);
      return NextResponse.json(
        { error: "Failed to record payment." },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}