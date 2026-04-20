// POST /api/agent-decisions
// Creates a new agent_decision row. Used by the "Log Decision" form.

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const USER_ID = process.env.PRISM_USER_ID ?? '9af7c6b4-7bff-458e-8509-e1392381c4e2';

interface CreateBody {
  agent_id: string;
  domain: string;
  category: string;
  decision_summary: string;
  predicted_description: string;
  predicted_probability: number;        // 0..1
  expected_value_usd?: number;
  resolution_date: string;               // ISO date or datetime
  notes?: string;
}

export async function POST(req: Request) {
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Basic validation
  if (!body.agent_id || !body.domain || !body.category || !body.decision_summary) {
    return NextResponse.json(
      { error: 'Missing required: agent_id, domain, category, decision_summary' },
      { status: 400 },
    );
  }
  if (typeof body.predicted_probability !== 'number'
      || body.predicted_probability < 0
      || body.predicted_probability > 1) {
    return NextResponse.json(
      { error: 'predicted_probability must be between 0 and 1' },
      { status: 400 },
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('agent_decisions')
    .insert({
      user_id:          USER_ID,
      agent_id:         body.agent_id,
      domain:           body.domain.trim().toLowerCase(),
      category:         body.category.trim().toLowerCase(),
      decision_summary: body.decision_summary.trim(),
      payload:          body.notes ? { notes: body.notes } : {},
      predicted_outcome: {
        description: body.predicted_description.trim(),
        probability: body.predicted_probability,
        ...(typeof body.expected_value_usd === 'number'
          ? { expected_value_usd: body.expected_value_usd }
          : {}),
      },
      resolution_date: body.resolution_date,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, decision_id: data.id });
}
