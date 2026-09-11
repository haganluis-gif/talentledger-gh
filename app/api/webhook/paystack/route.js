import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey || secretKey === "your-paystack-secret-key") {
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

    const event = JSON.parse(rawBody);

    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const contestantId = event.data?.metadata?.contestant_id;

    if (!contestantId) {
      return NextResponse.json({ received: true });
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