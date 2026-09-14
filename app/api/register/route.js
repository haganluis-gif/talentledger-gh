import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  validateRegistration,
  isValidMediaHeader,
  extensionForMime,
  isSafeFilename,
  MAX_MEDIA_SIZE,
} from "@/lib/validation";
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

    const limiter = rateLimit(`register:${clientIp(request)}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000, // 10 per 10 minutes per IP
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Try again later." },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

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

    if (!isSafeFilename(file.name)) {
      return NextResponse.json(
        { errors: ["Invalid file name."] },
        { status: 400 }
      );
    }

    const ext = extensionForMime(file.type);
    if (!ext) {
      return NextResponse.json({ errors: ["Unsupported file type."] }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_MEDIA_SIZE) {
      return NextResponse.json(
        { errors: ["File must be 4MB or smaller."] },
        { status: 400 }
      );
    }

    if (!isValidMediaHeader(file.type, buffer)) {
      return NextResponse.json(
        { errors: ["File content does not match a supported media type."] },
        { status: 400 }
      );
    }

    // Unguessable, non-enumerable contestant ID.
    const contestantId = `TLG-${randomUUID().replace(/-/g, "").toUpperCase()}`;

    // Path is fully server-controlled (ID + extension from validated MIME).
    const filePath = `auditions/${contestantId}.${ext}`;

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
      .select("id, contestant_id, full_name, location, payment_status")
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      // Don't leave an orphaned clip behind.
      await supabaseAdmin.storage.from("audition-clips").remove([filePath]);
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