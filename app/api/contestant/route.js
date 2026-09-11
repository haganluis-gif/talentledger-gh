import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contestant ID is required." },
        { status: 400 }
      );
    }

    const { data: contestant, error } = await supabaseAdmin
      .from("contestants")
      .select("*")
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
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
