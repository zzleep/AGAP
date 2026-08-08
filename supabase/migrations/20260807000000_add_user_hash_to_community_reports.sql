-- Migration: 20260807000000_add_user_hash_to_community_reports.sql
-- Description: Add user_hash column to community_reports for anonymous-report detection
-- on the evacuation map (same pattern as sos_reports.user_hash).

ALTER TABLE public.community_reports 
ADD COLUMN IF NOT EXISTS user_hash TEXT;
