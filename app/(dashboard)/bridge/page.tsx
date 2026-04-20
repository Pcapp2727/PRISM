import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import { getRecentPrismDecisions } from '@/lib/bridge-data';
import { BridgeRow } from '@/components/agents/BridgeRow';

export const dynamic = 'force-dynamic';

const USER_ID = process.env.PRISM_USER_ID ?? '9af7c6b4-7bff-458e-8509-e1392381c4e2';

export default async function BridgePage() {
  const supabase = createServerClient();

  const [decisionsRes, agentsRes] = await Promise.all([
    getRecentPrismDecisions(50),
    supabase
      .from('registered_agents')
      .select('agent_id, display_name, role, domain_tags')
      .eq('user_id', USER_ID)
      .eq('status', 'active')
      .order('display_name'),
  ]);

  const agents = (agentsRes.data ?? []).map(a => ({
    agent_id:     a.agent_id as string,
    display_name: a.display_name as string,
    role:         a.role as string | null,
    domain_tags:  (a.domain_tags ?? []) as string[],
  }));

  const untracked = decisionsRes.filter(d => !d.already_tracked);
  const tracked   = decisionsRes.filter(d => d.already_tracked);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href="/agents"
        className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white/70 font-mono"
      >
        ← Fleet
      </Link>

      <div className="mt-4 mb-8">
        <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 font-mono">
          Capgull Technologies · Bridge
        </div>
        <h1 className="text-4xl font-serif text-white/90 mt-1">PRISM → Agent Fleet</h1>
        <p className="text-sm text-white/50 mt-2 max-w-2xl leading-relaxed">
          Every PRISM analysis becomes a calibrated prediction. Assign each decision to
          the agent that owns its domain, and it starts feeding your calibration scores automatically.
          Claude&apos;s verdict confidence becomes the probability — no manual entry.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <TopStat label="Total Analyses" value={decisionsRes.length} />
        <TopStat label="Untracked" value={untracked.length} tint={untracked.length > 0 ? '#5B9DF5' : undefined} />
        <TopStat label="Tracked" value={tracked.length} tint={tracked.length > 0 ? '#34D399' : undefined} />
      </div>

      {decisionsRes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Untracked first */}
          {untracked.length > 0 && (
            <section className="mb-10">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono mb-3">
                Ready to Track · {untracked.length}
              </h2>
              <div className="space-y-3">
                {untracked.map(d => (
                  <BridgeRow key={d.id} decision={d} agents={agents} />
                ))}
              </div>
            </section>
          )}

          {/* Tracked below */}
          {tracked.length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono mb-3">
                Already Tracked · {tracked.length}
              </h2>
              <div className="space-y-2">
                {tracked.map(d => (
                  <BridgeRow key={d.id} decision={d} agents={agents} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {agents.length === 0 && decisionsRes.length > 0 && (
        <div className="mt-8 border border-amber-500/20 bg-amber-500/[0.03] rounded-lg p-5 text-sm text-amber-300/80">
          No active agents registered. Seed <code className="text-amber-200">registered_agents</code> in Supabase first, then return here.
        </div>
      )}
    </div>
  );
}

function TopStat({ label, value, tint }: { label: string; value: number; tint?: string }) {
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
      <div className="text-white/60 text-base mb-2">No PRISM analyses yet.</div>
      <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
        Go to the PRISM homepage, run an analysis on a real decision, then come back here.
        Your first analysis becomes your first tracked prediction.
      </p>
      <Link
        href="/"
        className="inline-block mt-5 text-[10px] uppercase tracking-[0.2em] font-mono border border-[#5B9DF5]/35 text-[#5B9DF5] hover:bg-[#5B9DF5]/10 rounded px-4 py-2 transition-colors"
      >
        Run First Analysis →
      </Link>
    </div>
  );
}
