import { getAgentFleet, getReliabilityDiagram } from '@/lib/agents-data';
import { ReliabilityDiagram } from '@/components/agents/ReliabilityDiagram';
import { CalibrationBadge } from '@/components/agents/CalibrationBadge';
import { labelBrier } from '@/lib/agent-types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CalibrationPage() {
  const [fleet, fleetReliability] = await Promise.all([
    getAgentFleet(),
    getReliabilityDiagram({}),
  ]);

  const ranked = [...fleet]
    .filter(f => f.mean_brier !== null)
    .sort((a, b) => (a.mean_brier ?? 1) - (b.mean_brier ?? 1));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href="/agents"
        className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white/70 font-mono"
      >
        ← Fleet
      </Link>

      <div className="mt-4 mb-8">
        <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 font-mono">
          Operator Intelligence · Quality Layer
        </div>
        <h1 className="text-4xl font-serif text-white/90 mt-1">Reliability Board</h1>
        <p className="text-sm text-white/50 mt-2 max-w-2xl">
          Who is trustworthy at what, quantitatively. Lower Brier = better calibration.
          Ranked across the full fleet over the last 180 days.
        </p>
      </div>

      {/* Fleet-wide diagram */}
      <div className="mb-10">
        <ReliabilityDiagram
          buckets={fleetReliability.buckets}
          meanBrier={fleetReliability.mean_brier}
          sampleSize={fleetReliability.sample_size}
          height={360}
        />
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono mb-3">
          Agent Leaderboard
        </h2>
        {ranked.length === 0 ? (
          <div className="border border-white/[0.06] rounded-lg p-8 text-center text-white/45 text-sm">
            Need at least 10 resolved decisions per agent to rank. Keep logging outcomes.
          </div>
        ) : (
          <div className="border border-white/[0.06] rounded-lg divide-y divide-white/[0.04]">
            {ranked.map((f, i) => (
              <Link
                key={f.agent.id}
                href={`/agents/${f.agent.agent_id}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xl font-serif text-white/30 w-6 text-right">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-white/85">{f.agent.display_name}</div>
                    <div className="text-[10px] text-white/35 font-mono mt-0.5">
                      {f.agent.agent_id} · {f.resolved_decisions} resolved · {f.domains_active.length} domains
                    </div>
                  </div>
                </div>
                <CalibrationBadge
                  label={labelBrier(f.mean_brier, f.resolved_decisions)}
                  brier={f.mean_brier}
                  n={f.resolved_decisions}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 pt-6 border-t border-white/[0.04]">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono mb-3">
          How to read this
        </h2>
        <div className="text-sm text-white/60 space-y-2 leading-relaxed max-w-2xl">
          <p>
            <span className="text-emerald-400">Brier &lt; 0.10</span> — excellent. This agent&apos;s
            confidence matches reality.
          </p>
          <p>
            <span className="text-blue-400">Brier 0.10–0.15</span> — reliably calibrated. Trust with guardrails.
          </p>
          <p>
            <span className="text-amber-400">Brier 0.15–0.25</span> — mixed. Predictions are directionally
            useful but noisy. Review reasoning traces.
          </p>
          <p>
            <span className="text-rose-400">Brier &gt; 0.25</span> — systematically miscalibrated. Narrow this
            agent&apos;s scope, retrain prompts, or retire it.
          </p>
        </div>
      </section>
    </div>
  );
}
