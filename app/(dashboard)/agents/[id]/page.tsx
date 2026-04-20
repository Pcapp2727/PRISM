import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAgent,
  getAgentCalibration,
  getAgentDecisions,
  getReliabilityDiagram,
} from '@/lib/agents-data';
import { ReliabilityDiagram } from '@/components/agents/ReliabilityDiagram';
import { DecisionFeedRow } from '@/components/agents/DecisionFeedRow';
import { labelBrier } from '@/lib/agent-types';
import { CalibrationBadge } from '@/components/agents/CalibrationBadge';
import { LogDecisionForm } from '@/components/agents/LogDecisionForm';

export const dynamic = 'force-dynamic';

export default async function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const agent = await getAgent(params.id);
  if (!agent) notFound();

  const [calibration, decisions, reliability] = await Promise.all([
    getAgentCalibration(params.id),
    getAgentDecisions(params.id, 25),
    getReliabilityDiagram({ agentId: params.id }),
  ]);

  const resolvedCount = decisions.filter(d => d.outcome_logged_at).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href="/agents"
        className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white/70 font-mono"
      >
        ← Fleet
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8 pb-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${
            agent.status === 'active' ? 'bg-emerald-400'
            : agent.status === 'paused' ? 'bg-amber-400'
            : 'bg-white/20'
          }`} aria-hidden />
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono">
            {agent.agent_id} · {agent.status}
          </span>
        </div>
        <h1 className="text-4xl font-serif text-white/90">{agent.display_name}</h1>
        {agent.role && <p className="text-sm text-white/55 mt-1">{agent.role}</p>}
        {agent.description && (
          <p className="text-sm text-white/65 mt-3 max-w-2xl leading-relaxed">
            {agent.description}
          </p>
        )}
      </div>

      {/* Log new decision */}
      <div className="mb-8">
        <LogDecisionForm agentId={agent.agent_id} />
      </div>

      {/* Reliability chart */}
      <div className="mb-10">
        <ReliabilityDiagram
          buckets={reliability.buckets}
          meanBrier={reliability.mean_brier}
          sampleSize={reliability.sample_size}
        />
      </div>

      {/* Calibration by domain */}
      {calibration.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono mb-3">
            Calibration by Domain
          </h2>
          <div className="border border-white/[0.06] rounded-lg divide-y divide-white/[0.04]">
            {calibration.map(c => (
              <div key={c.domain} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-white/85">{c.domain}</div>
                  <div className="text-[10px] text-white/40 font-mono mt-0.5">
                    predicted {(c.mean_predicted_prob * 100).toFixed(0)}% · actual {(c.actual_success_rate * 100).toFixed(0)}%
                  </div>
                </div>
                <CalibrationBadge
                  label={labelBrier(c.mean_brier, c.n)}
                  brier={c.mean_brier}
                  n={c.n}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent decisions */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono">
            Recent Decisions
          </h2>
          <span className="text-[10px] text-white/30 font-mono">
            {decisions.length} shown · {resolvedCount} resolved
          </span>
        </div>
        {decisions.length === 0 ? (
          <div className="border border-white/[0.06] rounded-lg p-10 text-center text-white/40 text-sm">
            No decisions logged yet. Use &quot;Log New Decision&quot; above to start tracking.
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.map(d => (
              <DecisionFeedRow key={d.id} decision={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
