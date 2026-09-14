import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  validateRegistration,
  validateAkwaabaRegistration,
  isValidMediaHeader,
  isValidImageHeader,
  extensionForMime,
  imageExtensionForMime,
  isSafeFilename,
  MAX_MEDIA_SIZE,
  MAX_PHOTO_SIZE,
} from "@/lib/validation";
import { generateContestantId } from "@/lib/id";
import { normalizeProgram } from "@/lib/program";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-guard";

const BUCKET = "audition-clips";
// Collision safety net: regenerate + retry the whole attempt on a
// unique-contraint race (instead of failing an otherwise fine request).
const MAX_ID_RETRIES = 3;

function photoPath(folder, id, ext) {
  return `${folder}/${id}.${ext}`;
}

function getPublicUrl(admin, path) {
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removePaths(admin, paths) {
  if (paths.length === 0) return;
  await admin.storage.from(BUCKET).remove(paths);
}

// Sniff + buffer a photo on the server. Never trust the client's
// filename, reported type or size beyond the MIME allowlist.
async function prepareImage(file) {
  const ext = imageExtensionForMime(file.type);
  if (!ext) return { ok: false };
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_PHOTO_SIZE) return { ok: false };
  if (!isValidImageHeader(file.type, buffer)) return { ok: false };
  return { ok: true, buffer, ext };
}

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

    // Program is *suggested* by the client and whitelist-normalized
    // here. The ID generator decides the final program server-side.
    const program = normalizeProgram(formData.get("program"));
    const fullName = formData.get("fullName");
    const phone = formData.get("phone");

    for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt += 1) {
      const contestantId = generateContestantId(program);
      let attemptPaths = [];

      if (program === "akwaaba") {
        const headshot = formData.get("headshot");
        const traditional = formData.get("traditional");

        const errors = validateAkwaabaRegistration({
          fullName,
          phone,
          age: formData.get("age"),
          region: formData.get("region"),
          languages: formData.get("languages"),
          headshot,
          traditional,
        });
        if (errors.length > 0) {
          return NextResponse.json({ errors }, { status: 400 });
        }

        const hs = await prepareImage(headshot);
        const tr = await prepareImage(traditional);
        if (!hs.ok || !tr.ok) {
          return NextResponse.json(
            { errors: ["Invalid image file. Use a JPEG, PNG or WebP photo up to 1.5MB. For resubmission, reselect your photos."] },
            { status: 400 }
          );
        }

        const headshotPath = photoPath("pageants/headshots", contestantId, hs.ext);
        const traditionalPath = photoPath("pageants/traditional", contestantId, tr.ext);

        // Upload both photos independently; a full attempt only
        // succeeds if BOTH land.
        const results = await Promise.allSettled([
          supabaseAdmin.storage
            .from(BUCKET)
            .upload(headshotPath, hs.buffer, { contentType: headshot.type, upsert: false }),
          supabaseAdmin.storage
            .from(BUCKET)
            .upload(traditionalPath, tr.buffer, { contentType: traditional.type, upsert: false }),
        ]);

        const headshotOk = results[0].status === "fulfilled" && !results[0].value.error;
        const traditionalOk = results[1].status === "fulfilled" && !results[1].value.error;

        if (!headshotOk || !traditionalOk) {
          console.error(
            "Akwaaba upload error:",
            results[0].status === "fulfilled" ? results[0].value.error : results[0].reason,
            results[1].status === "fulfilled" ? results[1].value.error : results[1].reason
          );
          await removePaths(supabaseAdmin, [headshotPath, traditionalPath]);
          // No DB row was written — nothing to clean besides storage.
          return NextResponse.json(
            { error: "Failed to upload one of your photos. Please try again." },
            { status: 500 }
          );
        }

        attemptPaths = [headshotPath, traditionalPath];
        const mediaUrl = JSON.stringify([
          getPublicUrl(supabaseAdmin, headshotPath),
          getPublicUrl(supabaseAdmin, traditionalPath),
        ]);

        const { data: contestant, error: dbError } = await supabaseAdmin
          .from("contestants")
          .insert({
            contestant_id: contestantId,
            full_name: fullName,
            // `location` is NOT NULL in the production table; Akwaaba
            // rows carry no audition clip, so mirror the region here.
            location: String(formData.get("region")).trim(),
            phone,
            age: Number(formData.get("age")),
            city: String(formData.get("region")).trim(),
            church_denomination: String(formData.get("languages")).trim(),
            media_url: mediaUrl,
            payment_status: "pending",
            program: "akwaaba",
          })
          .select("id, contestant_id, full_name, location, payment_status, program")
          .single();

        if (dbError && dbError.code === "23505") {
          // ID collision race — clean up this attempt's uploads and retry.
          await removePaths(supabaseAdmin, attemptPaths);
          continue;
        }
        if (dbError) {
          console.error("DB error:", dbError);
          await removePaths(supabaseAdmin, attemptPaths);
          return NextResponse.json(
            { error: "Failed to save contestant data." },
            { status: 500 }
          );
        }

        return NextResponse.json({ contestant }, { status: 201 });
      }

      // ---- The Next Gospel Star (existing behavior) ----
      const location = formData.get("location");
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

      // Path is fully server-controlled (ID + extension from validated MIME).
      const filePath = `auditions/${contestantId}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
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

      attemptPaths = [filePath];

      const { data: contestant, error: dbError } = await supabaseAdmin
        .from("contestants")
        .insert({
          contestant_id: contestantId,
          full_name: fullName,
          location,
          phone,
          clip_url: getPublicUrl(supabaseAdmin, filePath),
          payment_status: "pending",
          program: "ngs",
        })
        .select("id, contestant_id, full_name, location, payment_status, program")
        .single();

      if (dbError && dbError.code === "23505") {
        await removePaths(supabaseAdmin, attemptPaths);
        continue;
      }
      if (dbError) {
        console.error("DB error:", dbError);
        // Don't leave an orphaned clip behind.
        await removePaths(supabaseAdmin, attemptPaths);
        return NextResponse.json(
          { error: "Failed to save contestant data." },
          { status: 500 }
        );
      }

      return NextResponse.json({ contestant }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Could not save your registration. Please try again." },
      { status: 500 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}