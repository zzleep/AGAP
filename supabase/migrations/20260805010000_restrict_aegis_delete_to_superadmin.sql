-- Migration: 20260805010000_restrict_aegis_delete_to_superadmin.sql
-- Description: Tightens the aegis_suggestions DELETE RLS policy so only
-- superadmin operators can delete advisory log entries. Replaces the
-- permissive "Allow authenticated delete aegis_suggestions" policy created
-- in 20260805000000_aegis_admin_integration.sql.

-- 1. Drop the permissive policy (idempotent — safe if already dropped)
DROP POLICY IF EXISTS "Allow authenticated delete aegis_suggestions"
  ON public.aegis_suggestions;

-- 2. Create the restricted policy (idempotent — safe if already created)
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