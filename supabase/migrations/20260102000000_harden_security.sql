-- ============================================================
-- SECURITY HARDENING — least-privilege RLS
-- Fixes: anonymous read/update/delete of contestants,
--        anonymous storage writes, oversized bucket.
--
-- The application performs ALL database/storage access
-- server-side using the service_role key (which bypasses RLS),
-- so anonymous/authenticated roles no longer need ANY access.
--
-- Apply to the hosted project via:
--   Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Block all anonymous/authenticated access to contestants.
REVOKE ALL ON TABLE public.contestants FROM anon, authenticated;

-- 2. Drop the overly-permissive policies.
DROP POLICY IF EXISTS "Public read contestants"    ON public.contestants;
DROP POLICY IF EXISTS "Public insert contestants"  ON public.contestants;
DROP POLICY IF EXISTS "Update payment status"      ON public.contestants;
DROP POLICY IF EXISTS "Delete contestants"         ON public.contestants;

-- 3. RLS stays ENFORCED as defense-in-depth.
--    No anon/authenticated policies exist -> strict no-access.
--    (If Supabase Auth users are added later, add ownership-based
--     policies at that point.)
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;

-- 4. Block anonymous/authenticated access to the storage object API
--    (upload / list / delete). Public-bucket URL playback of the
--    <video> element is unaffected -- public buckets serve those URLs
--    without passing through RLS.
REVOKE ALL ON TABLE storage.objects FROM anon, authenticated;

DROP POLICY IF EXISTS "Public read audition clips" ON storage.objects;
DROP POLICY IF EXISTS "Insert audition clips"      ON storage.objects;
DROP POLICY IF EXISTS "Delete audition clips"      ON storage.objects;

-- 5. Bucket size limit aligned with the app's 4MB upload cap (5MB headroom).
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'audition-clips';

-- 6. Optional: harden the bucket settings if not already applied.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
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
WHERE id = 'audition-clips';