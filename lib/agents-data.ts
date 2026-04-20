// Server-side helpers for the Agent Intelligence layer.
// Uses your existing `createServerClient()` from lib/supabase.ts (service role).
// Single-tenant: user_id hardcoded to PRISM_USER_ID from env.

import { createServerClient } from '@/lib/supabase';
import type {
  AgentDecision,
  AgentFleetSummary,
  CalibrationRow,
  ReasoningTrace,
  RegisteredAgent,
  ReliabilityBucket,
} from '@/lib/agent-types';
import { labelBrier } from '@/lib/agent-types';

// Fallback UUID if env not set — your actual Supabase auth UID.
const USER_ID = process.env.PRISM_USER_ID ?? '9af7c6b4-7bff-458e-8509-e1392381c4e2';

export async function getAgentFleet(): Promise<AgentFleetSummary[]> {
  const supabase = createServerClient();

  const { data: agents } = await supabase
    .from('registered_agents')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: true });

  if (!agents || agents.length === 0) return [];

  const { data: calibration } = await supabase
    .from('calibration_by_agent_domain')
    .select('*')
    .eq('user_id', USER_ID);

  const { data: counts } = await supabase
    .from('agent_decisions')
    .select('agent_id, domain, outcome_logged_at, created_at')
    .eq('user_id', USER_ID);

  const rows = counts ?? [];
  const cal  = (calibration ?? []) as CalibrationRow[];

  return (agents as RegisteredAgent[]).map(agent => {
    const mine       = rows.filter(r => r.agent_id === agent.agent_id);
    const resolved   = mine.filter(r => r.outcome_logged_at).length;
    const domainCal  = cal.filter(c => c.agent_id === agent.agent_id);
    const totalN     = domainCal.reduce((s, c) => s + c.n, 0);
    const weighted   = totalN > 0
      ? domainCal.reduce((s, c) => s + c.mean_brier * c.n, 0) / totalN
      : null;
    const lastAt     = mine.length > 0
      ? mine.map(m => m.created_at).sort().reverse()[0]
      : null;
    const domains    = Array.from(new Set(mine.map(m => m.domain)));

    return {
      agent,
      total_decisions:    mine.length,
      resolved_decisions: resolved,
      pending_decisions:  mine.length - resolved,
      mean_brier:         weighted,
      domains_active:     domains,
      last_decision_at:   lastAt,
      calibration_label:  labelBrier(weighted, resolved),
    };
  });
}

export async function getAgent(agentId: string): Promise<RegisteredAgent | null> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('registered_agents')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('agent_id', agentId)
    .single();

  return data as RegisteredAgent | null;
}

export async function getAgentCalibration(agentId: string): Promise<CalibrationRow[]> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('calibration_by_agent_domain')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('agent_id', agentId)
    .order('n', { ascending: false });

  return (data ?? []) as CalibrationRow[];
}

export async function getAgentDecisions(
  agentId: string,
  limit = 50,
): Promise<AgentDecision[]> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('agent_decisions')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as AgentDecision[];
}

export async function getDecisionWithTraces(decisionId: string): Promise<{
  decision: AgentDecision | null;
  traces: ReasoningTrace[];
}> {
  const supabase = createServerClient();

  const [decRes, trcRes] = await Promise.all([
    supabase
      .from('agent_decisions')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('id', decisionId)
      .single(),
    supabase
      .from('reasoning_traces')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('agent_decision_id', decisionId)
      .order('created_at', { ascending: true }),
  ]);

  return {
    decision: decRes.data as AgentDecision | null,
    traces:   (trcRes.data ?? []) as ReasoningTrace[],
  };
}

export async function getReliabilityDiagram(opts: {
  agentId?: string;
  domain?:  string;
  lookbackDays?: number;
} = {}): Promise<{
  sample_size: number;
  mean_brier: number | null;
  buckets: ReliabilityBucket[];
}> {
  const supabase = createServerClient();

  const lookbackDays = opts.lookbackDays ?? 180;
  const cutoff = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();

  let query = supabase
    .from('agent_decisions')
    .select('brier_score, predicted_outcome, actual_outcome')
    .eq('user_id', USER_ID)
    .not('brier_score', 'is', null)
    .gte('created_at', cutoff);
  if (opts.agentId) query = query.eq('agent_id', opts.agentId);
  if (opts.domain)  query = query.eq('domain', opts.domain);

  const { data } = await query;
  const rows = data ?? [];
  const n = rows.length;

  if (n === 0) return { sample_size: 0, mean_brier: null, buckets: [] };

  const meanBrier = rows.reduce((s, d) => s + (d.brier_score ?? 0), 0) / n;

  const buckets: ReliabilityBucket[] = [0, 0.2, 0.4, 0.6, 0.8].map((lo, i) => {
    const hi = lo + 0.2;
    const isLast = i === 4;
    const inBucket = rows.filter(d => {
      const p = ((d.predicted_outcome as { probability?: number })?.probability) ?? 0;
      return p >= lo && (isLast ? p <= 1.0 : p < hi);
    });
    const avgPred = inBucket.length
      ? inBucket.reduce((s, d) =>
          s + (((d.predicted_outcome as { probability?: number })?.probability) ?? 0), 0) / inBucket.length
      : null;
    const actRate = inBucket.length
      ? inBucket.filter(d =>
          ((d.actual_outcome as { succeeded?: boolean })?.succeeded) === true).length / inBucket.length
      : null;
    return {
      predicted_range: `${lo.toFixed(1)}-${hi.toFixed(1)}`,
      n:               inBucket.length,
      avg_predicted:   avgPred !== null ? Number(avgPred.toFixed(3)) : null,
      actual_rate:     actRate !== null ? Number(actRate.toFixed(3)) : null,
    };
  });

  return {
    sample_size: n,
    mean_brier:  Number(meanBrier.toFixed(4)),
    buckets,
  };
}
