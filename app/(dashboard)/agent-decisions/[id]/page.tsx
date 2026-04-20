import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDecisionWithTraces } from '@/lib/agents-data';
import { ResolveOutcomeForm } from '@/components/agents/ResolveOutcomeForm';

export const dynamic = 'force-dynamic';

export default async function AgentDecisionPage({
  params,
}: {
  params: { id: string };
}) {
  const { decision, traces } = await getDecisionWithTraces(params.id);
  if (!decision) notFound();

  const resolved  = !!decision.outcome_logged_at;
  const succeeded = (decision.actual_outcome as { succeeded?: boolean } | null)?.succeeded;
  const predP     = decision.predicted_outcome.probability;
  const brier     = decision.brier_score;
  const notes     = decision.outcome_notes ?? '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href={`/agents/${decision.agent_id}`}
        className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white/70 font-mono"
      >
        ← {decision.agent_id}
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8 pb-6 border-b border-white/[0.04]">
        <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono">
          {decision.domain} · {decision.category}
        </div>
        <h1 className="text-2xl font-serif text-white/90 mt-2 leading-snug">
          {decision.decision_summary}
        </h1>
        <div className="mt-3 flex items-center gap-4 text-[10px] font-mono text-white/40">
          <span>logged {new Date(decision.created_at).toLocaleString()}</span>
          {decision.resolution_date && (
            <span>· resolves {new Date(decision.resolution_date).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Prediction + Outcome side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-white/[0.06] rounded-lg p-5">
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono mb-3">
            Prediction
          </div>
          <div className="text-sm text-white/80 mb-3 leading-relaxed">
            {decision.predicted_outcome.description}
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-serif text-[#5B9DF5]">
              {(predP * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-white/40">probability</div>
          </div>
          {decision.predicted_outcome.expected_value_usd != null && (
            <div className="text-[11px] text-white/45 font-mono mt-2">
              EV ${decision.predicted_outcome.expected_value_usd.toLocaleString()}
            </div>
          )}
        </div>

        <div className={`border rounded-lg p-5 ${
          resolved
            ? succeeded
              ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
              : 'border-rose-500/20 bg-rose-500/[0.02]'
            : 'border-white/[0.06]'
        }`}>
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono mb-3">
            Outcome
          </div>

          {!resolved && (
            <div className="text-sm text-white/50">
              {decision.resolution_date && new Date(decision.resolution_date) > new Date()
                ? `Awaiting resolution on ${new Date(decision.resolution_date).toLocaleDateString()}.`
                : 'Ready to resolve — use the form below.'}
            </div>
          )}

          {resolved && decision.actual_outcome && (
            <>
              <div className="text-sm text-white/80 mb-3 leading-relaxed">
                {decision.actual_outcome.description}
              </div>
              <div className="flex items-baseline gap-3">
                <div className={`text-3xl font-serif ${succeeded ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {succeeded ? '✓' : '✗'}
                </div>
                <div className="text-xs text-white/50">
                  {succeeded ? 'succeeded' : 'failed'}
                </div>
              </div>
              {brier != null && (
                <div className="text-[11px] text-white/45 font-mono mt-2">
                  Brier {brier.toFixed(4)} ·
                  {brier < 0.05 ? ' excellent call' : brier < 0.15 ? ' good call' : brier < 0.25 ? ' off' : ' badly off'}
                </div>
              )}
              {decision.actual_outcome.actual_value_usd != null && (
                <div className="text-[11px] text-white/45 font-mono mt-1">
                  Actual ${decision.actual_outcome.actual_value_usd.toLocaleString()}
                </div>
              )}
            </>
          )}

          {notes && resolved && (
            <div className="text-[11px] text-white/35 mt-3 pt-3 border-t border-white/[0.04] leading-relaxed">
              {notes}
            </div>
          )}
        </div>
      </div>

      {/* Resolve form (for unresolved decisions) */}
      {!resolved && (
        <div className="mb-8">
          <ResolveOutcomeForm decisionId={decision.id} />
        </div>
      )}

      {/* Payload / notes */}
      {decision.payload && Object.keys(decision.payload).length > 0 && (
        <details className="mt-8 border border-white/[0.04] rounded-md">
          <summary className="cursor-pointer px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 hover:text-white/70 list-none">
            Notes + Context ›
          </summary>
          <pre className="px-4 pb-4 text-[11px] text-white/55 overflow-x-auto leading-relaxed whitespace-pre-wrap">
            <code>{JSON.stringify(decision.payload, null, 2)}</code>
          </pre>
        </details>
      )}
    </div>
  );
}
