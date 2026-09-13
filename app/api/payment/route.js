import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPaystackSecretKey } from "@/lib/paystack";

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { contestantId } = await request.json();

    if (!contestantId) {
      return NextResponse.json(
        { error: "Contestant ID is required." },
        { status: 400 }
      );
    }

    const { data: contestant, error: fetchError } = await supabaseAdmin
      .from("contestants")
      .select("*")
      .eq("contestant_id", contestantId)
      .single();

    if (fetchError || !contestant) {
      return NextResponse.json(
        { error: "Contestant not found." },
        { status: 404 }
      );
    }

    const secretKey = getPaystackSecretKey();

    if (!secretKey) {
      const { data: updated } = await supabaseAdmin
        .from("contestants")
        .update({ payment_status: "paid" })
        .eq("contestant_id", contestantId)
        .select()
        .single();

      return NextResponse.json({
        status: "success",
        message: "Payment simulated (no API key configured).",
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
          amount: 5000,
          currency: "GHS",
          metadata: {
            contestant_id: contestantId,
            full_name: contestant.full_name,
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
      contestant,
    });
  } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
