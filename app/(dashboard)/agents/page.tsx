import { getAgentFleet } from '@/lib/agents-data';
import { AgentCard } from '@/components/agents/AgentCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const fleet = await getAgentFleet();

  const active   = fleet.filter(f => f.agent.status === 'active').length;
  const totalDec = fleet.reduce((s, f) => s + f.total_decisions, 0);
  const resolved = fleet.reduce((s, f) => s + f.resolved_decisions, 0);
  const pending  = fleet.reduce((s, f) => s + f.pending_decisions, 0);

  const meanBrier = (() => {
    const withData = fleet.filter(f => f.mean_brier !== null && f.resolved_decisions > 0);
    if (withData.length === 0) return null;
    const totalN = withData.reduce((s, f) => s + f.resolved_decisions, 0);
    return withData.reduce((s, f) => s + (f.mean_brier! * f.resolved_decisions), 0) / totalN;
  })();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 font-mono">
            Capgull Technologies · Operator Intelligence
          </div>
          <h1 className="text-4xl font-serif text-white/90 mt-1">Agent Fleet</h1>
          <p className="text-sm text-white/45 mt-1">
            Calibrated autonomy · measured, logged, compounding.
          </p>
        </div>
        <Link
          href="/calibration"
          className="text-[10px] uppercase tracking-[0.18em] font-mono border border-white/10 hover:border-[#5B9DF5]/40 hover:text-[#5B9DF5] rounded px-3 py-2 text-white/50 transition-colors"
        >
          Reliability Board →
        </Link>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <TopStat label="Active Agents"  value={active} />
        <TopStat label="Decisions"      value={totalDec} />
        <TopStat label="Resolved"       value={resolved} />
        <TopStat
          label="Fleet Brier"
          value={meanBrier !== null ? meanBrier.toFixed(3) : '—'}
          tint={meanBrier === null ? undefined : meanBrier < 0.15 ? '#34D399' : meanBrier < 0.25 ? '#FBBF24' : '#FB7185'}
        />
      </div>

      {/* Fleet */}
      {fleet.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {pending > 0 && (
            <div className="mb-4 text-xs text-white/45 font-mono">
              {pending} decision{pending === 1 ? '' : 's'} awaiting outcome resolution
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fleet.map(summary => (
              <AgentCard key={summary.agent.id} summary={summary} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TopStat({ label, value, tint }: { label: string; value: string | number; tint?: string }) {
  return (
    <div className="border border-white/[0.06] rounded-lg p-4">
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/30 font-mono">{label}</div>
      <div className="text-2xl font-serif mt-1" style={{ color: tint ?? 'rgba(255,255,255,0.88)' }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-white/[0.06] rounded-lg p-10 text-center">
      <div className="text-white/60 text-base mb-2">No agents registered yet.</div>
      <p className="text-sm text-white/40 max-w-md mx-auto">
        Register an agent in your MCP server config, then have it call <code className="text-[#5B9DF5]">should_gate</code> for
        its first consequential decision. It will appear here automatically.
      </p>
      <div className="mt-6 text-[11px] text-white/30 font-mono">
        See <code className="text-white/50">prism-mcp-server/README.md</code> for wiring.
      </div>
    </div>
  );
}
