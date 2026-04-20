// POST /api/agent-decisions/:id/resolve
// Records the actual outcome for a previously-logged decision.
// Computes and stores the Brier score automatically.

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const USER_ID = process.env.PRISM_USER_ID ?? '9af7c6b4-7bff-458e-8509-e1392381c4e2';

interface ResolveBody {
  succeeded: boolean;
  description: string;
  actual_value_usd?: number;
  notes?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: ResolveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.succeeded !== 'boolean' || typeof body.description !== 'string') {
    return NextResponse.json(
      { error: "Body must include 'succeeded' (boolean) and 'description' (string)." },
      { status: 400 },
    );
  }

  const supabase = createServerClient();

  // Read prior prediction so we can compute Brier
  const { data: prior, error: readErr } = await supabase
    .from('agent_decisions')
    .select('predicted_outcome, outcome_logged_at')
    .eq('id', params.id)
    .eq('user_id', USER_ID)
    .single();

  if (readErr || !prior) {
    return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
  }
  if (prior.outcome_logged_at) {
    return NextResponse.json(
      { error: 'Already resolved', already_resolved_at: prior.outcome_logged_at },
      { status: 409 },
    );
  }

  const predictedP = (prior.predicted_outcome as { probability?: number })?.probability ?? 0.5;
  const actualBin  = body.succeeded ? 1 : 0;
  const brier      = Math.pow(predictedP - actualBin, 2);

  const { error: updateErr } = await supabase
    .from('agent_decisions')
    .update({
      actual_outcome: {
        description:      body.description.trim(),
        succeeded:        body.succeeded,
        ...(typeof body.actual_value_usd === 'number'
          ? { actual_value_usd: body.actual_value_usd }
          : {}),
      },
      outcome_logged_at: new Date().toISOString(),
      brier_score:       brier,
      outcome_notes:     body.notes ? `[manual] ${body.notes}` : '[manual]',
    })
    .eq('id', params.id)
    .eq('user_id', USER_ID);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    decision_id:           params.id,
    predicted_probability: predictedP,
    actual_binary:         actualBin,
    brier_score:           Math.round(brier * 10_000) / 10_000,
  });
}
