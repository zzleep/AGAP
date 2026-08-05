-- Migration: 20260731010000_victim_update_sos.sql
-- Description: Victim self-service informational updates for SOS requests.
--
-- Adds:
--   1. note + updated_at columns on sos_reports
--   2. update_my_sos() RPC — victim can ping (still here), update their location,
--      or leave a note on their own latest active report
--   3. get_my_sos_status() extended to return location/note/updated_at
--
-- PROTOCOL NOTE: victims may NOT change request status (no self-cancel, no
-- forced resolution). Disposition of a request — claim, resolve — belongs
-- exclusively to operators. Victims only provide information; the RPC below
-- has no p_status parameter by design.
--
-- Trust model: caller-supplied user_hash, same as get_my_sos_status and the
-- anonymous INSERT policy — acceptable for the hackathon scope. The update is
-- restricted to the caller's LATEST non-resolved report.

-- 1. New columns
ALTER TABLE public.sos_reports ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.sos_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Extended read-back (location + note + updated_at so the victim can verify their record).
--    DROP first: CREATE OR REPLACE cannot change a function's return type (42P13).
DROP FUNCTION IF EXISTS public.get_my_sos_status(TEXT);
CREATE OR REPLACE FUNCTION public.get_my_sos_status(p_user_hash TEXT)
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.status, r.barangay, r.created_at, r.claimed_at, r.assigned_operator_id,
         r.latitude, r.longitude, r.note, r.updated_at
  FROM public.sos_reports r
  WHERE r.user_hash = p_user_hash
  ORDER BY r.created_at DESC
  LIMIT 1;
$$;

-- 3. Victim informational update RPC.
--    - All-NULL call = "still here" ping (bumps updated_at so operators see freshness).
--    - Targets ONLY the caller's latest non-resolved report.
--    - No status parameter: victims cannot dispose of a request (protocol).
--    DROP first: guard against a previously applied version with a different signature.
DROP FUNCTION IF EXISTS public.update_my_sos(TEXT, TEXT, DECIMAL, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS public.update_my_sos(TEXT, DECIMAL, DECIMAL, TEXT);
CREATE OR REPLACE FUNCTION public.update_my_sos(
  p_user_hash   TEXT,
  p_latitude    DECIMAL DEFAULT NULL,
  p_longitude   DECIMAL DEFAULT NULL,
  p_note        TEXT DEFAULT NULL
)
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
    AND r.status <> 'resolved'
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.sos_reports r SET
    latitude    = COALESCE(p_latitude, r.latitude),
    longitude   = COALESCE(p_longitude, r.longitude),
    note        = COALESCE(p_note, r.note),
    updated_at  = NOW()
  WHERE r.id = v_id
  RETURNING r.id, r.status, r.barangay, r.created_at, r.claimed_at,
            r.assigned_operator_id, r.latitude, r.longitude, r.note, r.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_sos_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_sos_status(TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.update_my_sos(TEXT, DECIMAL, DECIMAL, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_sos(TEXT, DECIMAL, DECIMAL, TEXT) TO anon, authenticated;
