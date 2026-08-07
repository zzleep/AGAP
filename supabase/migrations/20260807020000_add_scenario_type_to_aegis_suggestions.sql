-- Migration: 20260807020000_add_scenario_type_to_aegis_suggestions.sql
-- Description: Adds the scenario_type column and supporting indexes to
-- aegis_suggestions. These changes were previously appended to the already-
-- applied init migration (20260727000000), which never executes on existing
-- databases — causing PostgREST schema-cache errors on any query touching the
-- table (see issue #56). All statements are idempotent, so this migration is
-- safe on both fresh and existing deployments.

-- 1. scenario_type column (indexable filtering of AI advisory scenarios)
ALTER TABLE public.aegis_suggestions ADD COLUMN IF NOT EXISTS scenario_type TEXT;

-- 2. index on outcome for server-side aggregation
CREATE INDEX IF NOT EXISTS idx_aegis_suggestions_outcome ON public.aegis_suggestions(outcome);

-- 3. GIN index on related_sos_ids for SOS-to-suggestion queries
CREATE INDEX IF NOT EXISTS idx_aegis_suggestions_related_sos ON public.aegis_suggestions USING GIN (related_sos_ids);
