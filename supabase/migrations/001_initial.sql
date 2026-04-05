-- PRISM Database Schema
-- Run: supabase db push

-- ═══ Profiles (extends Supabase Auth) ═══
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  plan text not null default 'free',
  stripe_customer_id text,
  decisions_this_month int not null default 0,
  month_reset_at timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ═══ Decisions (core journal) ═══
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,

  -- Input fields
  decision_text text not null,
  context text,
  domain text not null default 'other',
  stakes text not null default 'medium',
  timeframe text,
  reversibility text,
  stakeholders text,
  prior_attempts text,
  user_confidence int default 50,
  emotional_state text,
  expertise_level text,
  kill_criteria text,
  decision_speed text,

  -- Analysis output (full JSONB)
  analysis jsonb,
  analysis_version text,

  -- Outcome tracking (filled in later)
  outcome_quality text, -- exceeded, good, mixed, below, failed
  decision_quality text, -- good, adequate, poor
  outcome_notes text,
  outcome_surprise text,
  outcome_date timestamptz,

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table decisions enable row level security;
create policy "Users CRUD own decisions" on decisions
  for all using (auth.uid() = user_id);

create index idx_decisions_user on decisions(user_id);
create index idx_decisions_user_created on decisions(user_id, created_at desc);
create index idx_decisions_user_domain on decisions(user_id, domain);
create index idx_decisions_outcome on decisions(user_id, outcome_quality) where outcome_quality is not null;

-- ═══ Pattern Snapshots (cached computation) ═══
create table if not exists pattern_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,

  total_decisions int not null default 0,
  resolved_decisions int not null default 0,
  success_rate numeric,
  brier_score numeric,
  domain_performance jsonb default '{}',
  emotional_correlation jsonb default '{}',
  stakes_performance jsonb default '{}',
  good_decision_bad_outcome int default 0,
  bad_decision_good_outcome int default 0,
  avg_confidence numeric,
  calibration_trend jsonb default '[]',

  computed_at timestamptz not null default now()
);

alter table pattern_snapshots enable row level security;
create policy "Users read own patterns" on pattern_snapshots
  for all using (auth.uid() = user_id);

create index idx_patterns_user on pattern_snapshots(user_id, computed_at desc);

-- ═══ Helper Functions ═══

-- Increment monthly decision counter (with auto-reset)
create or replace function increment_monthly_decisions(uid uuid)
returns void as $$
begin
  update profiles
  set
    decisions_this_month = case
      when month_reset_at < date_trunc('month', now())
      then 1
      else decisions_this_month + 1
    end,
    month_reset_at = case
      when month_reset_at < date_trunc('month', now())
      then date_trunc('month', now())
      else month_reset_at
    end,
    updated_at = now()
  where id = uid;
end;
$$ language plpgsql security definer;

-- Check if user can analyze (free plan limit)
create or replace function can_analyze(uid uuid)
returns boolean as $$
declare
  user_plan text;
  monthly_count int;
  reset_at timestamptz;
begin
  select plan, decisions_this_month, month_reset_at
  into user_plan, monthly_count, reset_at
  from profiles where id = uid;

  -- Pro/team users: unlimited
  if user_plan != 'free' then return true; end if;

  -- Free users: 3 per month, auto-reset
  if reset_at < date_trunc('month', now()) then return true; end if;

  return monthly_count < 3;
end;
$$ language plpgsql security definer;

-- Updated_at trigger
create or replace function update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger decisions_updated_at
  before update on decisions
  for each row execute function update_modified_column();
