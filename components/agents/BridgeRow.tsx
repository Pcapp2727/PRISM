'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PrismDecisionSummary } from '@/lib/bridge-data';

interface AgentOption {
  agent_id: string;
  display_name: string;
  role: string | null;
  domain_tags: string[];
}

export function BridgeRow({
  decision,
  agents,
}: {
  decision: PrismDecisionSummary;
  agents: AgentOption[];
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [chosenAgent, setChosenAgent] = useState<string>(suggestAgent(decision, agents));
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const conf = decision.verdict_confidence;
  const probability = conf !== null ? conf / 100 : 0.5;

  async function promote() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/agent-decisions/from-prism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_id: decision.id,
          agent_id:    chosenAgent,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setPicking(false);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Already-tracked row
  if (decision.already_tracked) {
    return (
      <div className="border border-emerald-500/15 rounded-lg p-4 bg-emerald-500/[0.02]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-xs">✓</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/30 font-mono">
                tracked as {decision.linked_agent_id} · {new Date(decision.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-white/75 line-clamp-2 leading-relaxed">
              {decision.decision_text}
            </p>
          </div>
          {decision.linked_agent_decision_id && (
            <Link
              href={`/agent-decisions/${decision.linked_agent_decision_id}`}
              className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-emerald-400 hover:text-emerald-300 font-mono border border-emerald-500/20 rounded px-3 py-1.5"
            >
              View →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Untracked row
  return (
    <div className="border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/30 font-mono">
              {new Date(decision.created_at).toLocaleDateString()}
            </span>
            {decision.domain && (
              <span className="text-[9px] uppercase tracking-wider font-mono text-white/35 border border-white/[0.06] rounded px-1.5 py-0.5">
                {decision.domain}
              </span>
            )}
            {conf !== null && (
              <span className="text-[9px] uppercase tracking-[0.15em] font-mono text-[#5B9DF5]">
                {conf}% confidence
              </span>
            )}
          </div>
          <p className="text-sm text-white/85 leading-relaxed">
            {decision.decision_text}
          </p>
          {decision.verdict_recommendation && (
            <p className="text-xs text-white/50 mt-2 italic leading-relaxed">
              &ldquo;{decision.verdict_recommendation.slice(0, 180)}
              {decision.verdict_recommendation.length > 180 ? '...' : ''}&rdquo;
            </p>
          )}
        </div>
      </div>

      {!picking && (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="w-full py-2 text-[10px] tracking-[0.2em] uppercase font-mono rounded border border-[#5B9DF5]/25 text-[#5B9DF5] hover:bg-[#5B9DF5]/10 transition-colors"
        >
          + Track as Agent Decision
        </button>
      )}

      {picking && (
        <div className="pt-3 border-t border-white/[0.04] mt-1">
          <div className="text-[9px] uppercase tracking-[0.18em] text-white/40 font-mono mb-2">
            Assign to agent
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={chosenAgent}
              onChange={e => setChosenAgent(e.target.value)}
              className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded px-3 py-2 text-sm text-white/85 focus:border-[#5B9DF5]/35 focus:outline-none"
            >
              {agents.map(a => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.display_name} — {a.role ?? a.agent_id}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPicking(false)}
                disabled={submitting}
                className="px-4 py-2 text-[10px] tracking-[0.18em] uppercase font-mono rounded border border-white/[0.06] text-white/45 hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={promote}
                disabled={submitting}
                className="px-4 py-2 text-[10px] tracking-[0.18em] uppercase font-mono rounded border border-[#5B9DF5]/35 text-[#5B9DF5] hover:bg-[#5B9DF5]/10 disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Tracking...' : 'Track'}
              </button>
            </div>
          </div>
          <div className="text-[10px] text-white/35 font-mono mt-2">
            Probability {(probability * 100).toFixed(0)}% · resolves in 30 days
          </div>
          {err && (
            <div className="text-xs text-rose-400 mt-2">{err}</div>
          )}
        </div>
      )}
    </div>
  );
}

/** Best-guess agent from the decision's domain — user can override. */
function suggestAgent(d: PrismDecisionSummary, agents: AgentOption[]): string {
  if (agents.length === 0) return '';
  if (!d.domain) return agents[0].agent_id;
  const domain = d.domain.toLowerCase();

  // Match by domain tag first
  const tagMatch = agents.find(a => a.domain_tags.some(t => domain.includes(t) || t.includes(domain)));
  if (tagMatch) return tagMatch.agent_id;

  // Keyword fallback
  if (domain.includes('financ') || domain.includes('money') || domain.includes('budget')) {
    const compass = agents.find(a => a.agent_id === 'compass');
    if (compass) return compass.agent_id;
  }
  if (domain.includes('business') || domain.includes('strat')) {
    const atlas = agents.find(a => a.agent_id === 'atlas');
    if (atlas) return atlas.agent_id;
  }
  return agents[0].agent_id;
}
