-- ============================================================================
-- PRISM v1.1 — Agent Intelligence Migration
-- ============================================================================
-- ADDITIVE ONLY. Does not modify the existing `decisions` table used by the
-- personal decision journal. Everything agent-related lives in new tables.
--
-- Run in Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- ─── 1. registered_agents ───────────────────────────────────────────────────
-- Metadata for each agent in the user's fleet (Harvey, Donna, Walter, etc.)

create table if not exists public.registered_agents (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  agent_id        text        not null,                    -- 'harvey', 'donna', etc.
  display_name    text        not null,
  role            text,                                    -- 'Pricing Agent', 'Customer Comms', etc.
  domain_tags     text[]      default '{}',                -- ['pricing','quoting']
  description     text,
  status          text        not null default 'active',   -- active | paused | retired
  mcp_endpoint    text,                                    -- optional: where this agent runs
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, agent_id)
);

create index if not exists registered_agents_user_idx   on public.registered_agents(user_id);
create index if not exists registered_agents_status_idx on public.registered_agents(status);

-- ─── 2. agent_decisions ─────────────────────────────────────────────────────
-- Every consequential decision routed through a PRISM-gated agent.
-- Separate from `decisions` (which is for human personal decisions).

create table if not exists public.agent_decisions (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  agent_id           text        not null,                 -- matches registered_agents.agent_id
  created_at         timestamptz not null default now(),

  domain             text        not null,                 -- 'pricing', 'fulfillment', etc.
  category           text        not null,                 -- 'quote_over_10k'
  decision_summary   text        not null,
  payload            jsonb       not null default '{}'::jsonb,

  predicted_outcome  jsonb       not null,                 -- { description, probability, expected_value_usd? }
  resolution_date    timestamptz,

  actual_outcome     jsonb,                                -- { description, succeeded, actual_value_usd? }
  outcome_logged_at  timestamptz,
  outcome_notes      text,

  brier_score        numeric,                              -- computed on outcome log

  parent_decision_id uuid        references public.agent_decisions(id) on delete set null
);

create index if not exists agent_decisions_user_idx      on public.agent_decisions(user_id);
create index if not exists agent_decisions_agent_idx     on public.agent_decisions(user_id, agent_id);
create index if not exists agent_decisions_domain_idx    on public.agent_decisions(user_id, domain);
create index if not exists agent_decisions_created_idx   on public.agent_decisions(user_id, created_at desc);
create index if not exists agent_decisions_resolved_idx  on public.agent_decisions(user_id, outcome_logged_at)
  where outcome_logged_at is not null;

comment on table public.agent_decisions is
  'Every consequential decision routed through a PRISM-gated agent. Predictions here enable calibration scoring once outcomes are logged.';

-- ─── 3. reasoning_traces ────────────────────────────────────────────────────
-- Observability: which PRISM tools were called, with what inputs, producing what.

create table if not exists public.reasoning_traces (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles(id) on delete cascade,
  agent_decision_id   uuid        references public.agent_decisions(id) on delete cascade,
  tool_name           text        not null,               -- 'premortem', 'red_team', etc.
  input               jsonb       not null,
  output              jsonb       not null,
  latency_ms          integer,
  created_at          timestamptz not null default now()
);

create index if not exists reasoning_traces_decision_idx on public.reasoning_traces(agent_decision_id);
create index if not exists reasoning_traces_user_idx     on public.reasoning_traces(user_id);
create index if not exists reasoning_traces_tool_idx     on public.reasoning_traces(tool_name);

-- ─── 4. calibration_by_agent_domain view ────────────────────────────────────
-- The money view: who's trustworthy at what, quantitatively.

create or replace view public.calibration_by_agent_domain as
select
  user_id,
  agent_id,
  domain,
  count(*)                            as n,
  round(avg(brier_score)::numeric, 4) as mean_brier,
  round(
    sum(case when (actual_outcome->>'succeeded')::boolean then 1 else 0 end)::numeric
    / nullif(count(*), 0),
    3
  )                                   as actual_success_rate,
  round(
    avg((predicted_outcome->>'probability')::numeric),
    3
  )                                   as mean_predicted_prob,
  min(created_at)                     as earliest,
  max(outcome_logged_at)              as latest_outcome
from public.agent_decisions
where brier_score is not null
group by user_id, agent_id, domain;

-- ─── 5. Row Level Security ──────────────────────────────────────────────────
alter table public.registered_agents enable row level security;
alter table public.agent_decisions   enable row level security;
alter table public.reasoning_traces  enable row level security;

-- Users see only their own rows
create policy "users_read_own_agents"    on public.registered_agents for select using (user_id = auth.uid());
create policy "users_write_own_agents"   on public.registered_agents for all    using (user_id = auth.uid());

create policy "users_read_own_decisions"  on public.agent_decisions for select using (user_id = auth.uid());
create policy "users_write_own_decisions" on public.agent_decisions for all    using (user_id = auth.uid());

create policy "users_read_own_traces"     on public.reasoning_traces for select using (user_id = auth.uid());
create policy "users_write_own_traces"    on public.reasoning_traces for all    using (user_id = auth.uid());

-- Service role (MCP server) bypasses RLS automatically — it writes using
-- SUPABASE_SERVICE_ROLE_KEY. The MCP server must set user_id on every insert.
