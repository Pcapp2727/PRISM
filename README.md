# PRISM v1.1 — Agent Intelligence Update

Drop-in module that adds the Operator Intelligence layer (agent fleet, calibration, reliability board) to your existing PRISM Next.js app **without touching the personal decision journal**.

## What's in this zip

```
prism-updates/
├── supabase/migrations/
│   └── 002_agent_intelligence.sql          # ADDITIVE — new tables only
├── lib/
│   ├── agent-types.ts                      # TypeScript types
│   └── agents-data.ts                      # Server-side data helpers
├── app/
│   ├── (dashboard)/
│   │   ├── agents/
│   │   │   ├── page.tsx                    # Fleet overview
│   │   │   └── [id]/page.tsx               # Agent deep-dive
│   │   └── calibration/
│   │       └── page.tsx                    # Reliability board
│   └── api/
│       ├── agents/route.ts                 # GET /api/agents
│       ├── agents/[id]/route.ts            # GET /api/agents/:id
│       └── calibration/route.ts            # GET /api/calibration
└── components/agents/
    ├── AgentCard.tsx
    ├── CalibrationBadge.tsx
    ├── ReliabilityDiagram.tsx
    └── DecisionFeedRow.tsx
```

## Install (5 minutes)

```powershell
# 1. From the PRISM repo root
cd "C:\Users\Paul Jeanne\Downloads\prism"

# 2. Copy files from this zip into matching paths in your prism repo.
#    (Or unzip directly into the repo — the folder structure matches.)
Expand-Archive ..\prism-updates.zip -DestinationPath . -Force

# 3. Apply the migration
#    Option A: Supabase dashboard → SQL Editor → paste contents of
#              supabase/migrations/002_agent_intelligence.sql → Run
#    Option B: If you have the supabase CLI configured
supabase db push

# 4. Build + deploy
git add .
git commit -m "PRISM v1.1 — Agent Intelligence layer"
git push
# Vercel auto-deploys on push.
```

## Add navigation

Wherever you have your dashboard nav (likely `app/(dashboard)/layout.tsx`), add two links:

```tsx
<Link href="/agents"       className="nav-link">Agents</Link>
<Link href="/calibration"  className="nav-link">Calibration</Link>
```

Keep your existing `Journal` link — the personal decision journal remains unchanged.

## Wire it to the MCP server

The MCP server I built previously had a `decisions` table — same name as your existing PRISM table. **Update the MCP server's schema to use `agent_decisions`** (this zip's migration already uses the new name).

In `prism-mcp-server/supabase/schema.sql` and `prism-mcp-server/src/index.ts`, replace every occurrence of:

- Table name `decisions` → `agent_decisions`
- When the MCP server inserts, it must now also set `user_id`. Options:
  - **Simplest**: hardcode your PRISM user's UUID in the MCP server env as `PRISM_USER_ID` and include it on every insert
  - **Scalable**: pass the user_id as part of the MCP `Bearer` token (JWT with a `sub` claim). Do this when you sell to other operators.

For each agent you run (Harvey, Donna, Walter…), insert a row into `registered_agents` once — that's what makes it appear in the fleet view:

```sql
insert into public.registered_agents (user_id, agent_id, display_name, role, domain_tags, description)
values
  ('<your-uuid>', 'harvey', 'Harvey',  'Pricing Agent',          array['pricing'],      'B2B pricing + quoting across SPW accounts'),
  ('<your-uuid>', 'donna',  'Donna',   'Customer Comms',         array['customer'],     'Account manager outreach + follow-ups'),
  ('<your-uuid>', 'walter', 'Walter',  'Fulfillment Ops',        array['fulfillment'],  '3PL coordination + SLA monitoring');
```

## What you'll see when it's live

**`/agents`** — fleet overview: each agent as a card with live calibration badge, decision counts, domains active. Empty state explains what to do.

**`/agents/harvey`** — the reliability diagram for Harvey specifically, calibration by domain, recent 25 decisions with Brier scores color-coded.

**`/calibration`** — fleet-wide reliability board + agent leaderboard (ranked by Brier), plus the key for interpreting scores.

All three pages SSR-render with server-side Supabase reads respecting your existing RLS policies. No client-side data fetching needed for the initial paint.

## Design notes

- Matches your existing PRISM aesthetic: dark background, #5B9DF5 blue accent, Fraunces serif for headings, JetBrains Mono for labels/metadata, thin `rgba(255,255,255,0.06)` borders.
- Zero new dependencies. Uses only what's already in your `package.json` (Next.js, Supabase, Tailwind).
- The `ReliabilityDiagram` is pure SVG — no Recharts needed for this one. Bucket radius scales with sample size so you can see which buckets have enough data to trust.
- `CalibrationBadge` is the reusable primitive. Use it anywhere you need to show an agent's trustworthiness at a glance.

## What to build next

1. **Agent decision detail page** — `/agent-decisions/[id]` showing the full reasoning trace (every `premortem`, `red_team`, `bias_check` call the agent made before the decision). I have the `ReasoningTraceViewer` pattern ready, ship it in the next iteration.
2. **Outcome watcher** — a scheduled Vercel cron that polls Stripe/WooCommerce/your CRM and auto-calls `log_outcome` on the MCP server. Without this, outcomes have to be logged manually, which means the loop doesn't close.
3. **Org/tenant scoping** — when you sell this to other operators, swap `user_id` for `org_id` and add an `organizations` table. Every table in this migration already has `user_id` indexed, so the refactor is straightforward.
4. **Public-facing landing page update** — reflect the Operator Intelligence category positioning. This is a marketing surface, not an app page — separate ask.
