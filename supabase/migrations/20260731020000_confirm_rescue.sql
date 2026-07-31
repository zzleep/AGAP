-- Migration: 20260731020000_confirm_rescue.sql
-- Description: Victim-side rescue confirmation (positive disposition only).
--
-- PROTOCOL: victims may CONFIRM rescue (status -> 'resolved') but may not
-- cancel, downgrade, or otherwise dispose of a request. This is deliberately a
-- SEPARATE RPC from update_my_sos (which remains purely informational) so the
-- two capabilities are auditable and the surface is minimal: the victim can
-- only ever move a request forward to completion — never sideways or backward.
--
-- Ordering note: this migration assumes 20260731010000 has run (the RETURNING
-- clause references the latitude/longitude/note/updated_at columns added there).

DROP FUNCTION IF EXISTS public.confirm_my_rescue(TEXT);
CREATE OR REPLACE FUNCTION public.confirm_my_rescue(p_user_hash TEXT)
RETURNS TABLE (
  id                    UUID,
  status                TEXT,
  barangay              TEXT,
  created_at            TIMESTAMPTZ,
  claimed_at            TIMESTAMPTZ,
  assigned_operator_id  UUID,
  latitude              DECIMAL,
  longitude             DECIMAL,
  note                  TEXT,
  updated_at            TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT r.id INTO v_id
  FROM public.sos_reports r
  WHERE r.user_hash = p_user_hash
    AND r.status IN ('pending', 'responding')
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.sos_reports r SET
    status      = 'resolved',
    updated_at  = NOW()
  WHERE r.id = v_id
  RETURNING r.id, r.status, r.barangay, r.created_at, r.claimed_at,
            r.assigned_operator_id, r.latitude, r.longitude, r.note, r.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_my_rescue(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_my_rescue(TEXT) TO anon, authenticated;
