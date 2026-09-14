-- ============================================================
-- MISS AKWAABA — strictly-additive schema support
--
-- Adds optional columns so a single `contestants` table can hold
-- both programs without touching existing rows/types/data.
--
-- SAFETY:
--   * No DROP, no ALTER of existing column types, no renames.
--   * Every new column is NULLABLE except `program`, which takes a
--     safe default ('ngs') so all 7 existing/legacy rows instantly
--     read as gospel entries. No existing data is modified.
--   * `media_url` stores a valid JSON array of the two photo URLs,
--     e.g. ["headshot-url","traditional-url"].
-- ============================================================

ALTER TABLE public.contestants
  ADD COLUMN IF NOT EXISTS program text NOT NULL DEFAULT 'ngs'
    CHECK (program IN ('ngs', 'akwaaba')),
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS church_denomination text,
  ADD COLUMN IF NOT EXISTS media_url text;

CREATE INDEX IF NOT EXISTS idx_contestants_program
  ON public.contestants (program);