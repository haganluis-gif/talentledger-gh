import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function isAuthorized(request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return request.headers.get("x-admin-password") === adminPassword;
}

function extractStoragePath(clipUrl) {
  try {
    const url = new URL(clipUrl);
    const parts = url.pathname.split("/");
    const bucketIndex = parts.indexOf("audition-clips");
    if (bucketIndex === -1) return null;
    return parts.slice(bucketIndex + 1).join("/");
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: contestants, error } = await supabaseAdmin
      .from("contestants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contestants }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contestant ID is required." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: contestant, error: fetchError } = await supabaseAdmin
      .from("contestants")
      .select("contestant_id, clip_url")
      .eq("contestant_id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!contestant) {
      return NextResponse.json(
        { error: "Contestant not found." },
        { status: 404 }
      );
    }

    const { error: dbError } = await supabaseAdmin
      .from("contestants")
      .delete()
      .eq("contestant_id", id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (contestant.clip_url) {
      const storagePath = extractStoragePath(contestant.clip_url);
      if (storagePath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("audition-clips")
          .remove([storagePath]);
        if (storageError) {
          console.error("Storage cleanup error:", storageError);
        }
      }
    }

    return NextResponse.json(
      { message: "Contestant removed.", contestant },
      { status: 200 }
    );
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
