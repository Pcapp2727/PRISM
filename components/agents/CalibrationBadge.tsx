import type { AgentFleetSummary } from '@/lib/agent-types';

const LABEL_STYLES: Record<AgentFleetSummary['calibration_label'], { bg: string; fg: string; text: string }> = {
  excellent:         { bg: 'bg-emerald-500/10',  fg: 'text-emerald-400', text: 'Excellent'     },
  good:              { bg: 'bg-blue-500/10',     fg: 'text-blue-400',    text: 'Good'          },
  mixed:             { bg: 'bg-amber-500/10',    fg: 'text-amber-400',   text: 'Mixed'         },
  poor:              { bg: 'bg-rose-500/10',     fg: 'text-rose-400',    text: 'Miscalibrated' },
  insufficient_data: { bg: 'bg-white/5',         fg: 'text-white/40',    text: 'Gathering...'  },
};

export function CalibrationBadge({
  label,
  brier,
  n,
}: {
  label: AgentFleetSummary['calibration_label'];
  brier: number | null;
  n: number;
}) {
  const s = LABEL_STYLES[label];
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.12em] font-mono ${s.bg} ${s.fg}`}>
      <span>{s.text}</span>
      {brier !== null && (
        <span className="opacity-60">· Brier {brier.toFixed(3)} · n={n}</span>
      )}
      {label === 'insufficient_data' && n > 0 && (
        <span className="opacity-60">· n={n}/10</span>
      )}
    </div>
  );
}
