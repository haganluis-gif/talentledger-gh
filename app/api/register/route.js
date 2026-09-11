import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateRegistration } from "@/lib/validation";

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await request.formData();
    const fullName = formData.get("fullName");
    const location = formData.get("location");
    const phone = formData.get("phone");
    const file = formData.get("file");

    const errors = validateRegistration({ fullName, location, phone, file });

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const contestantId = `TLG-${Date.now().toString(36).toUpperCase()}`;

    const fileExt = file.name.split(".").pop();
    const filePath = `auditions/${contestantId}.${fileExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("audition-clips")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload audition clip." },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("audition-clips")
      .getPublicUrl(filePath);

    const { data: contestant, error: dbError } = await supabaseAdmin
      .from("contestants")
      .insert({
        contestant_id: contestantId,
        full_name: fullName,
        location,
        phone,
        clip_url: urlData.publicUrl,
        payment_status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save contestant data." },
        { status: 500 }
      );
    }

    return NextResponse.json({ contestant }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
