-- TalentLedger GH - Supabase Schema (SECURE default)
-- Run this in the Supabase SQL Editor after creating your project
--
-- SECURITY MODEL:
--   * ALL reads/writes/uploads happen server-side with the
--     service_role key (bypasses RLS). The browser NEVER talks to
--     Supabase directly.
--   * Anonymous + authenticated roles get NO database/storage access.
--   * RLS remains ENFORCED on the table as defense-in-depth.

-- 1. Create the contestants table
CREATE TABLE IF NOT EXISTS contestants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contestant_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  clip_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contestants_contestant_id ON contestants (contestant_id);
CREATE INDEX IF NOT EXISTS idx_contestants_created_at ON contestants (created_at DESC);

-- 2. Row Level Security - ENFORCED, but no public policies exist.
ALTER TABLE contestants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE contestants FROM anon, authenticated;

-- 3. Storage bucket for audition clips.
--    Public = true so the pass/admin <video> element can play clips
--    via the unauthenticated public URL endpoint. All WRITES are done
--    server-side with the service_role key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audition-clips',
  'audition-clips',
  true,
  5242880,   -- 5MB in bytes (app cap is 4MB)
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

-- No storage.objects policies are created for anon/authenticated.
-- Uploads / deletes are performed by the application's service-role key only.
REVOKE ALL ON TABLE storage.objects FROM anon, authenticated;