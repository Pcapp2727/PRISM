import Link from 'next/link';
import type { AgentFleetSummary } from '@/lib/agent-types';
import { CalibrationBadge } from './CalibrationBadge';

export function AgentCard({ summary }: { summary: AgentFleetSummary }) {
  const a = summary.agent;
  const dot = a.status === 'active'
    ? 'bg-emerald-400' : a.status === 'paused'
    ? 'bg-amber-400'   : 'bg-white/20';

  return (
    <Link
      href={`/agents/${a.agent_id}`}
      className="group block border border-white/[0.06] rounded-lg p-5 hover:border-[#5B9DF5]/35 hover:bg-white/[0.015] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/30 font-mono">
              {a.agent_id}
            </span>
          </div>
          <h3 className="text-xl font-serif text-white/88">{a.display_name}</h3>
          {a.role && <p className="text-xs text-white/40 mt-0.5">{a.role}</p>}
        </div>
        <CalibrationBadge
          label={summary.calibration_label}
          brier={summary.mean_brier}
          n={summary.resolved_decisions}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs pt-3 border-t border-white/[0.04]">
        <Stat label="Total"    value={summary.total_decisions} />
        <Stat label="Resolved" value={summary.resolved_decisions} />
        <Stat label="Pending"  value={summary.pending_decisions} tint={summary.pending_decisions > 0 ? '#5B9DF5' : undefined} />
      </div>

      {summary.domains_active.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {summary.domains_active.slice(0, 4).map(d => (
            <span key={d} className="text-[9px] uppercase tracking-wider font-mono text-white/35 border border-white/[0.06] rounded px-1.5 py-0.5">
              {d}
            </span>
          ))}
          {summary.domains_active.length > 4 && (
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/35">
              +{summary.domains_active.length - 4}
            </span>
          )}
        </div>
      )}

      {a.description && (
        <p className="text-[13px] text-white/55 mt-3 line-clamp-2">{a.description}</p>
      )}
    </Link>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-mono mb-0.5">{label}</div>
      <div className="text-lg font-serif" style={{ color: tint ?? 'rgba(255,255,255,0.88)' }}>
        {value}
      </div>
    </div>
  );
}
