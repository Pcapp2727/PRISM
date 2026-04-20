'use client';

import type { ReliabilityBucket } from '@/lib/agent-types';

/**
 * Reliability diagram. X = avg predicted probability per bucket,
 * Y = actual success rate. A perfectly calibrated forecaster's points
 * lie on the y=x line. Above the line = underconfident, below = overconfident.
 */
export function ReliabilityDiagram({
  buckets,
  meanBrier,
  sampleSize,
  height = 320,
}: {
  buckets: ReliabilityBucket[];
  meanBrier: number | null;
  sampleSize: number;
  height?: number;
}) {
  const pad = 40;
  const W   = 480;
  const H   = height;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const toX = (p: number) => pad + p * innerW;
  const toY = (p: number) => pad + (1 - p) * innerH;

  if (sampleSize === 0) {
    return (
      <div className="border border-white/[0.06] rounded-lg p-8 text-center">
        <div className="text-white/40 text-sm mb-2">No resolved decisions yet.</div>
        <div className="text-white/25 text-xs">
          Calibration becomes meaningful at ~20 resolved outcomes. Keep logging.
        </div>
      </div>
    );
  }

  const maxN = Math.max(...buckets.map(b => b.n), 1);

  return (
    <div className="border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono">Reliability Diagram</div>
          <div className="text-xl font-serif text-white/88 mt-1">
            {meanBrier !== null ? `Brier ${meanBrier.toFixed(3)}` : '—'}
          </div>
          <div className="text-xs text-white/45 mt-0.5">
            n={sampleSize} resolved · {describeBrier(meanBrier)}
          </div>
        </div>
        <div className="text-[10px] text-white/35 text-right font-mono leading-relaxed">
          y = x is perfect<br />
          above = underconfident<br />
          below = overconfident
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: height }}
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={pad} x2={toX(v)} y2={H - pad}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <line x1={pad} y1={toY(v)} x2={W - pad} y2={toY(v)}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={toX(v)} y={H - pad + 16}
                  fontSize="9" fill="rgba(255,255,255,0.3)"
                  textAnchor="middle" fontFamily="monospace">
              {v.toFixed(2)}
            </text>
            <text x={pad - 8} y={toY(v) + 3}
                  fontSize="9" fill="rgba(255,255,255,0.3)"
                  textAnchor="end" fontFamily="monospace">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Perfect-calibration diagonal */}
        <line x1={toX(0)} y1={toY(0)} x2={toX(1)} y2={toY(1)}
              stroke="rgba(91,157,245,0.3)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Connect points */}
        {(() => {
          const pts = buckets
            .filter(b => b.avg_predicted !== null && b.actual_rate !== null)
            .map(b => `${toX(b.avg_predicted!)},${toY(b.actual_rate!)}`)
            .join(' ');
          return pts
            ? <polyline points={pts} fill="none" stroke="#5B9DF5" strokeWidth="1.5" opacity="0.6" />
            : null;
        })()}

        {/* Bucket points — radius scales with sample size */}
        {buckets.map((b, i) => {
          if (b.avg_predicted === null || b.actual_rate === null) return null;
          const r = 4 + Math.sqrt(b.n / maxN) * 10;
          return (
            <g key={i}>
              <circle cx={toX(b.avg_predicted)} cy={toY(b.actual_rate)}
                      r={r} fill="#5B9DF5" opacity="0.25" />
              <circle cx={toX(b.avg_predicted)} cy={toY(b.actual_rate)}
                      r="3" fill="#5B9DF5" />
              <text x={toX(b.avg_predicted)} y={toY(b.actual_rate) - r - 4}
                    fontSize="9" fill="rgba(255,255,255,0.5)"
                    textAnchor="middle" fontFamily="monospace">
                n={b.n}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={W / 2} y={H - 6}
              fontSize="10" fill="rgba(255,255,255,0.45)"
              textAnchor="middle" fontFamily="monospace">
          Predicted probability
        </text>
        <text x={12} y={H / 2}
              fontSize="10" fill="rgba(255,255,255,0.45)"
              textAnchor="middle" fontFamily="monospace"
              transform={`rotate(-90 12 ${H / 2})`}>
          Actual rate
        </text>
      </svg>

      <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-5 gap-2 text-[10px] font-mono">
        {buckets.map(b => (
          <div key={b.predicted_range} className="text-center">
            <div className="text-white/30">{b.predicted_range}</div>
            <div className="text-white/60 mt-0.5">n={b.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function describeBrier(b: number | null): string {
  if (b === null) return 'insufficient data';
  if (b < 0.10) return 'excellent calibration';
  if (b < 0.15) return 'good calibration';
  if (b < 0.25) return 'room to improve';
  return 'systematically miscalibrated';
}
