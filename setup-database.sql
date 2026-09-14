-- ============================================================
-- TalentLedger GH — Complete Supabase Setup (SECURE)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- SECURITY MODEL:
--   * The browser NEVER talks to Supabase directly. All data and
--     storage operations go through Next.js API routes, which use the
--     service_role key (bypasses RLS).
--   * Anonymous + authenticated roles receive NO grants.
--   * RLS stays ENFORCED as defense-in-depth.
-- ============================================================

-- 1. TABLE: contestants
CREATE TABLE IF NOT EXISTS public.contestants (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contestant_id TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  location      TEXT NOT NULL,
  phone         TEXT NOT NULL,
  clip_url      TEXT,
  payment_status TEXT DEFAULT 'pending'
                CHECK (payment_status IN ('pending', 'paid')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by contestant_id (used in pass, payment, delete)
CREATE INDEX IF NOT EXISTS idx_contestants_contestant_id
  ON public.contestants (contestant_id);

-- Index for admin dashboard listing (sorted by newest first)
CREATE INDEX IF NOT EXISTS idx_contestants_created_at
  ON public.contestants (created_at DESC);

-- 2. ROW LEVEL SECURITY — enforced, NO public policies.
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contestants FROM anon, authenticated;

-- 3. STORAGE BUCKET: audition-clips
--    public = true so the pass/admin <video> element can play clips
--    through the unauthenticated public URL. All WRITES are done
--    server-side (service_role key).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audition-clips',
  'audition-clips',
  true,
  5242880,  -- 5MB in bytes (app cap is 4MB)
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. STORAGE ACCESS — none for public/authenticated.
--    Upload / delete happens only via the app (service_role key).
REVOKE ALL ON TABLE storage.objects FROM anon, authenticated;