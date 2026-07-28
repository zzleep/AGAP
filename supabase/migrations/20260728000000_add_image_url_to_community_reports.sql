-- Migration: 20260728000000_add_image_url_to_community_reports.sql
-- Description: Add image_url column and grant RLS insert/select/update permissions for community_reports

-- 1. Add image_url column
ALTER TABLE public.community_reports 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Enable RLS
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow anonymous insert community_reports" ON public.community_reports;
DROP POLICY IF EXISTS "Allow authenticated select community_reports" ON public.community_reports;
DROP POLICY IF EXISTS "Allow authenticated update community_reports" ON public.community_reports;

-- 4. Create RLS Policies allowing inserts and reads
CREATE POLICY "Allow anonymous insert community_reports"
  ON public.community_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select community_reports"
  ON public.community_reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated update community_reports"
  ON public.community_reports FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
