-- ============================================================================
-- PRISM v1.2 — Bridge Migration
-- ============================================================================
-- Adds a link from agent_decisions back to the original PRISM decision that
-- spawned it. Nullable so manually-logged agent_decisions still work fine.
-- ============================================================================

alter table public.agent_decisions
  add column if not exists source_decision_id uuid
    references public.decisions(id) on delete set null;

create index if not exists agent_decisions_source_idx
  on public.agent_decisions(source_decision_id)
  where source_decision_id is not null;

comment on column public.agent_decisions.source_decision_id is
  'If this agent_decision was created from a PRISM analysis, this points to the source decisions.id. Null for manually-logged decisions.';
