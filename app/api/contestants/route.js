import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromRequest } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-guard";

function isAuthorized(request) {
  return getSessionFromRequest(request);
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
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403 }
      );
    }
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const limiter = rateLimit(`admin-list:${clientIp(request)}`, {
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
    const { data: contestants, error } = await supabaseAdmin
      .from("contestants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List error:", error);
      return NextResponse.json(
        { error: "Failed to load contestants." },
        { status: 500 }
      );
    }

    return NextResponse.json({ contestants }, { status: 200 });
  } catch (err) {
    console.error("List error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403 }
      );
    }
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const limiter = rateLimit(`admin-delete:${clientIp(request)}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
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

    if (!/^[A-Za-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid contestant ID." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: contestant, error: fetchError } = await supabaseAdmin
      .from("contestants")
      .select("contestant_id, clip_url, media_url")
      .eq("contestant_id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to load contestant." },
        { status: 500 }
      );
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
      console.error("Delete error:", dbError);
      return NextResponse.json(
        { error: "Failed to remove contestant." },
        { status: 500 }
      );
    }

    // Remove every stored object for this contestant: the audition
    // clip (Gospel Star) and the headshot + traditional photos (Miss
    // Akwaaba), derived solely from stored URLs so a client can never
    // name arbitrary paths to delete.
    const storagePaths = new Set();
    if (contestant.clip_url) {
      const clipPath = extractStoragePath(contestant.clip_url);
      if (clipPath) storagePaths.add(clipPath);
    }
    if (contestant.media_url) {
      try {
        const urls = JSON.parse(contestant.media_url);
        for (const url of urls) {
          if (typeof url === "string") {
            const photoPath = extractStoragePath(url);
            if (photoPath) storagePaths.add(photoPath);
          }
        }
      } catch {
        // Malformed media_url — nothing further to remove.
      }
    }

    if (storagePaths.size > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("audition-clips")
        .remove([...storagePaths]);
      if (storageError) {
        console.error("Storage cleanup error:", storageError);
      }
    }

    return NextResponse.json(
      { message: "Contestant removed." },
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