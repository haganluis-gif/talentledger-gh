-- TalentLedger GH - Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project

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

-- 2. Create storage bucket for audition clips
INSERT INTO storage.buckets (id, name, public)
VALUES ('audition-clips', 'audition-clips', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public read access to audition clips
CREATE POLICY "Public read access for audition clips"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audition-clips');

-- 4. Allow authenticated insert to audition clips
CREATE POLICY "Insert audition clips"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audition-clips');

-- 5. Enable RLS on contestants table
ALTER TABLE contestants ENABLE ROW LEVEL SECURITY;

-- 6. Allow public read access to contestants
CREATE POLICY "Public read contestants"
ON contestants
FOR SELECT
USING (true);

-- 7. Allow public insert to contestants
CREATE POLICY "Public insert contestants"
ON contestants
FOR INSERT
WITH CHECK (true);
