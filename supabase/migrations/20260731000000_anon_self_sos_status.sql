-- Migration: 20260731000000_anon_self_sos_status.sql
-- Description: Citizen self-service status read for SOS requests.
--
-- Rationale: RLS only allows `authenticated` SELECT on sos_reports, and citizens
-- use the app anonymously, so they can never read back their own request status.
-- This SECURITY DEFINER RPC returns exactly ONE row — the latest report matching
-- the caller's user_hash — and nothing else.
--
-- Tradeoff note: the caller supplies the user_hash, so a caller could query another
-- person's hash if they knew it. This is the same trust level as the existing
-- anonymous INSERT policy (anyone can insert with any user_hash) and is acceptable
-- for the hackathon scope. Only the latest single row is ever exposed.

CREATE OR REPLACE FUNCTION public.get_my_sos_status(p_user_hash TEXT)
RETURNS TABLE (
  id                    UUID,
  status                TEXT,
  barangay              TEXT,
  created_at            TIMESTAMPTZ,
  claimed_at            TIMESTAMPTZ,
  assigned_operator_id  UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.status, r.barangay, r.created_at, r.claimed_at, r.assigned_operator_id
  FROM public.sos_reports r
  WHERE r.user_hash = p_user_hash
  ORDER BY r.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_sos_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_sos_status(TEXT) TO anon, authenticated;
