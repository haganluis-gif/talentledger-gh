-- ============================================================
-- TalentLedger GH — Complete Supabase Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
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

-- 2. ROW LEVEL SECURITY
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;

-- Public can read contestants (for pass page display)
CREATE POLICY "Public read contestants"
  ON public.contestants
  FOR SELECT
  USING (true);

-- Public can insert contestants (registration form)
CREATE POLICY "Public insert contestants"
  ON public.contestants
  FOR INSERT
  WITH CHECK (true);

-- Allow update for payment status (webhook uses service role which bypasses RLS,
-- but this policy is here for completeness if you ever use the anon key)
CREATE POLICY "Update payment status"
  ON public.contestants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow delete (admin uses service role which bypasses RLS)
CREATE POLICY "Delete contestants"
  ON public.contestants
  FOR DELETE
  USING (true);

-- 3. STORAGE BUCKET: audition-clips
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audition-clips',
  'audition-clips',
  true,
  52428800,  -- 50MB in bytes
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

-- 4. STORAGE POLICIES
-- Public can view audition clips (for admin dashboard video playback)
CREATE POLICY "Public read audition clips"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'audition-clips');

-- Anyone can upload audition clips (registration flow)
CREATE POLICY "Insert audition clips"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'audition-clips');

-- Allow delete for cleanup when admin removes a contestant
CREATE POLICY "Delete audition clips"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'audition-clips');
