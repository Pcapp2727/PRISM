import Link from 'next/link';
import type { AgentDecision } from '@/lib/agent-types';

export function DecisionFeedRow({ decision }: { decision: AgentDecision }) {
  const resolved = !!decision.outcome_logged_at;
  const succeeded = (decision.actual_outcome as { succeeded?: boolean } | null)?.succeeded;
  const predP = decision.predicted_outcome.probability;
  const brier = decision.brier_score;

  const statusColor = !resolved
    ? 'bg-white/20'
    : succeeded
      ? 'bg-emerald-400'
      : 'bg-rose-400';

  const brierColor = brier === null
    ? 'text-white/30'
    : brier < 0.1  ? 'text-emerald-400'
    : brier < 0.25 ? 'text-amber-400'
                   : 'text-rose-400';

  return (
    <Link
      href={`/agent-decisions/${decision.id}`}
      className="block border border-white/[0.04] hover:border-white/10 rounded-md p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} aria-hidden />
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/35 font-mono">
              {decision.agent_id} · {decision.domain} · {decision.category}
            </span>
          </div>
          <div className="text-sm text-white/85 line-clamp-2">
            {decision.decision_summary}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-mono">
            {resolved ? 'Brier' : 'Predicted'}
          </div>
          <div className={`text-sm font-mono mt-0.5 ${brierColor}`}>
            {resolved && brier !== null
              ? brier.toFixed(3)
              : `${Math.round(predP * 100)}%`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30 font-mono">
        <span>{new Date(decision.created_at).toLocaleDateString()}</span>
        {decision.resolution_date && !resolved && (
          <span>· resolves {new Date(decision.resolution_date).toLocaleDateString()}</span>
        )}
        {resolved && decision.outcome_logged_at && (
          <span>
            · {succeeded ? 'succeeded' : 'failed'} {new Date(decision.outcome_logged_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}
