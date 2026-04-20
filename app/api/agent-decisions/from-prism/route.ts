// POST /api/agent-decisions/from-prism
// Creates an agent_decision from an existing PRISM decision.
// Extracts probability from the decision's Claude analysis (verdict.confidence).

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const USER_ID = process.env.PRISM_USER_ID ?? '9af7c6b4-7bff-458e-8509-e1392381c4e2';

interface Body {
  decision_id: string;
  agent_id: string;
  resolution_date?: string;      // ISO, defaults to 30 days out
  category?: string;              // defaults to 'general'
  expected_value_usd?: number;
}

function extractVerdict(analysis: unknown): { rec: string | null; conf: number | null } {
  if (!analysis || typeof analysis !== 'object') return { rec: null, conf: null };
  const v = ((analysis as Record<string, unknown>).verdict ?? {}) as Record<string, unknown>;
  const rec = (v.recommendation ?? v.rec) as string | undefined;
  const raw = (v.confidence_level ?? v.confidence ?? v.conf) as number | string | undefined;
  const num = typeof raw === 'number' ? raw : (raw ? Number(raw) : null);
  return { rec: rec ?? null, conf: num !== null && !Number.isNaN(num) ? num : null };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.decision_id || !body.agent_id) {
    return NextResponse.json({ error: 'decision_id and agent_id are required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Read the PRISM decision
  const { data: decision, error: readErr } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', body.decision_id)
    .eq('user_id', USER_ID)
    .single();

  if (readErr || !decision) {
    return NextResponse.json({ error: 'PRISM decision not found' }, { status: 404 });
  }

  // 2. Verify agent exists and belongs to this user
  const { data: agent } = await supabase
    .from('registered_agents')
    .select('agent_id')
    .eq('user_id', USER_ID)
    .eq('agent_id', body.agent_id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: `Agent '${body.agent_id}' not registered` }, { status: 404 });
  }

  // 3. Check for existing bridge — idempotent
  const { data: existing } = await supabase
    .from('agent_decisions')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('source_decision_id', body.decision_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      decision_id: existing.id,
      already_existed: true,
    });
  }

  // 4. Extract data from PRISM decision
  const d = decision as Record<string, unknown>;
  const decText    = (d.decision_text ?? d.dec ?? d.decision ?? '') as string;
  const domain     = (d.domain ?? d.dom ?? 'general') as string;
  const { rec, conf } = extractVerdict(d.analysis);

  // Fall back to 50/50 if no confidence extractable
  const probability = conf !== null ? Math.max(0.01, Math.min(0.99, conf / 100)) : 0.5;

  const resolutionDate = body.resolution_date
    ?? new Date(Date.now() + 30 * 86_400_000).toISOString();

  // 5. Insert the agent_decision
  const { data: inserted, error: insertErr } = await supabase
    .from('agent_decisions')
    .insert({
      user_id:            USER_ID,
      agent_id:           body.agent_id,
      source_decision_id: body.decision_id,
      domain:             domain.toLowerCase().trim(),
      category:           (body.category ?? 'prism_analysis').toLowerCase().trim(),
      decision_summary:   decText.slice(0, 500),
      payload: {
        bridged_from_prism: true,
        prism_decision_id:  body.decision_id,
        original_verdict:   rec,
      },
      predicted_outcome: {
        description: rec ?? 'Outcome per PRISM analysis recommendation',
        probability,
        ...(typeof body.expected_value_usd === 'number'
          ? { expected_value_usd: body.expected_value_usd }
          : {}),
      },
      resolution_date: resolutionDate,
    })
    .select('id')
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    decision_id:     inserted.id,
    probability,
    verdict_used:    rec,
    confidence_used: conf,
  });
}
