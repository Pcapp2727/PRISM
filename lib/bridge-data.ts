// Bridge helpers — connect PRISM decisions ⇄ agent_decisions.
// Reads the PRISM decisions table (your personal journal) and checks which
// have already been promoted into the agent fleet.

import { createServerClient } from '@/lib/supabase';

const USER_ID = process.env.PRISM_USER_ID ?? '9af7c6b4-7bff-458e-8509-e1392381c4e2';

export interface PrismDecisionSummary {
  id: string;
  created_at: string;
  decision_text: string;          // "dec" — the decision itself
  domain: string | null;
  verdict_recommendation: string | null;
  verdict_confidence: number | null;   // 0-100 from Claude's analysis
  outcome_logged: boolean;

  // Bridge status
  already_tracked: boolean;
  linked_agent_decision_id: string | null;
  linked_agent_id: string | null;
}

/**
 * PRISM's decisions table has varied over versions. This helper normalizes
 * field access so the bridge keeps working even if column names shift.
 */
function extractField(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return null;
}

function extractVerdict(analysis: unknown): { recommendation: string | null; confidence: number | null } {
  if (!analysis || typeof analysis !== 'object') return { recommendation: null, confidence: null };
  const a = analysis as Record<string, unknown>;
  const v = (a.verdict ?? {}) as Record<string, unknown>;

  const rec = (v.recommendation ?? v.rec) as string | undefined;
  // Both field names appear across PRISM versions
  const conf = (v.confidence_level ?? v.confidence ?? v.conf) as number | string | undefined;
  const confNum = typeof conf === 'number' ? conf : (conf ? Number(conf) : null);

  return {
    recommendation: rec ?? null,
    confidence: confNum !== null && !Number.isNaN(confNum) ? confNum : null,
  };
}

export async function getRecentPrismDecisions(limit = 30): Promise<PrismDecisionSummary[]> {
  const supabase = createServerClient();

  // Pull recent PRISM decisions
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !decisions) return [];

  // Check which ones are already bridged
  const ids = decisions.map((d: Record<string, unknown>) => d.id as string);
  const { data: bridged } = await supabase
    .from('agent_decisions')
    .select('id, agent_id, source_decision_id')
    .eq('user_id', USER_ID)
    .in('source_decision_id', ids);

  const bridgeMap = new Map<string, { agent_decision_id: string; agent_id: string }>();
  for (const b of bridged ?? []) {
    if (b.source_decision_id) {
      bridgeMap.set(b.source_decision_id as string, {
        agent_decision_id: b.id as string,
        agent_id: b.agent_id as string,
      });
    }
  }

  return decisions.map((d: Record<string, unknown>) => {
    const analysis = d.analysis as unknown;
    const { recommendation, confidence } = extractVerdict(analysis);
    const bridge = bridgeMap.get(d.id as string);

    return {
      id:                       d.id as string,
      created_at:               d.created_at as string,
      decision_text:            (extractField(d, ['decision_text', 'dec', 'decision']) as string) ?? '',
      domain:                   (extractField(d, ['domain', 'dom']) as string) ?? null,
      verdict_recommendation:   recommendation,
      verdict_confidence:       confidence,
      outcome_logged:           !!extractField(d, ['outcome_date', 'outcome_logged_at', 'oDate']),
      already_tracked:          !!bridge,
      linked_agent_decision_id: bridge?.agent_decision_id ?? null,
      linked_agent_id:          bridge?.agent_id ?? null,
    };
  });
}

/** Count untracked PRISM decisions — used for the banner on /agents. */
export async function countUntrackedDecisions(): Promise<number> {
  const recent = await getRecentPrismDecisions(50);
  return recent.filter(d => !d.already_tracked).length;
}
