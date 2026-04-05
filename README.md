# PRISM — Pattern Recognition & Intelligent Strategy Mapping

Evidence-grounded decision intelligence by Capgull Technologies LLC.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in your API keys

# 3. Set up database
# Create a Supabase project at supabase.com
# Run the migration:
npx supabase db push
# Or paste supabase/migrations/001_initial.sql into the SQL editor

# 4. Run dev server
npm run dev
```

## Architecture

- **Next.js 14** — App Router, API routes, SSR
- **Supabase** — Postgres, Auth, Row-Level Security
- **Anthropic API** — Claude Sonnet for analysis (2-call architecture)
- **Stripe** — Subscription billing

## How It Works

1. User inputs a decision with structured metadata
2. PRISM makes two API calls to Claude:
   - **Call 1:** Evidence + Classification (Cynefin, reference class, convexity, bias detection)
   - **Call 2:** Frameworks + Scenarios + Verdict (seeded with Call 1 findings)
3. Results are normalized and saved to the decision journal
4. Over time, pattern detection learns the user's calibration, biases, and blind spots

## Key Files

```
lib/prompts.ts        — The brain. All prompt templates.
lib/prism-engine.ts   — Two-call analysis pipeline with streaming.
lib/normalizer.ts     — Maps API response to typed structure.
lib/pattern-computer.ts — Decision fingerprint computation.
lib/types.ts          — Full TypeScript type definitions.
app/api/analyze/      — Main analysis API endpoint.
supabase/migrations/  — Database schema with RLS.
```

## Pricing

- Free: 3 analyses/month
- Pro: $14.99/mo unlimited
- API cost per analysis: ~$0.03

---

*PRISM v1.0 — Capgull Technologies LLC*
