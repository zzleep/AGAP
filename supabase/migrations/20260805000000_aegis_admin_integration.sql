-- Migration: 20260805000000_aegis_admin_integration.sql
-- Description: Admin infrastructure for Aegis (AI advisory) integration.
-- Adds a status lifecycle to aegis_suggestions so suggestions are persisted
-- as 'pending' BEFORE an operator outcome, backfills historical decisions,
-- indexes the new fields, and grants DELETE so the admin panel can bulk-remove
-- entries.

-- 1. status lifecycle
ALTER TABLE public.aegis_suggestions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed')),
  ADD COLUMN IF NOT EXISTS confidence TEXT CHECK (confidence IN ('high','medium','low')),
  ADD COLUMN IF NOT EXISTS fallback BOOLEAN NOT NULL DEFAULT false;

-- 2. backfill historical decisions
UPDATE public.aegis_suggestions SET status = 'reviewed' WHERE outcome IS NOT NULL;

-- 3. indexes
CREATE INDEX IF NOT EXISTS idx_aegis_suggestions_status ON public.aegis_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_aegis_suggestions_barangay ON public.aegis_suggestions(target_barangay);

-- 4. DELETE RLS (bulk delete in admin panel)
-- Restrict deletes to superadmin operators only — the advisory log is an
-- auditable record, so destructive actions should not be available to every
-- authenticated user. Adjust the role check if a broader admin set is needed.
CREATE POLICY "Allow superadmin delete aegis_suggestions"
  ON public.aegis_suggestions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  );
