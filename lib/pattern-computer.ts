import type { Decision, PatternSnapshot } from './types';

/**
 * Computes the user's decision fingerprint from their history.
 * This is the core of PRISM's "can't live without it" moat —
 * the more decisions logged, the more valuable the patterns.
 */
export function computePatterns(decisions: Decision[]): PatternSnapshot | null {
  if (!decisions || decisions.length < 1) return null;

  const resolved = decisions.filter((d) => d.outcomeQuality);
  const total = decisions.length;

  // ─── Overall Success Rate ─────────────────────────────────────────────
  const successes = resolved.filter(
    (d) => d.outcomeQuality === 'good' || d.outcomeQuality === 'exceeded'
  );
  const successRate = resolved.length > 0
    ? Math.round((successes.length / resolved.length) * 100)
    : null;

  // ─── Brier Score (Calibration) ────────────────────────────────────────
  // Measures how well-calibrated the user's confidence predictions are.
  // Perfect calibration = 100. Random = 75. Inverse = 0.
  let brierScore: number | null = null;
  if (resolved.length >= 3) {
    let brierSum = 0;
    resolved.forEach((d) => {
      const predicted = (d.input.userConfidence || 50) / 100;
      const actual = (d.outcomeQuality === 'good' || d.outcomeQuality === 'exceeded') ? 1 : 0;
      brierSum += Math.pow(predicted - actual, 2);
    });
    brierScore = Math.round((1 - brierSum / resolved.length) * 100);
  }

  // ─── Domain Performance ───────────────────────────────────────────────
  const domainPerformance: Record<string, { good: number; total: number }> = {};
  resolved.forEach((d) => {
    const domain = d.input.domain;
    if (!domainPerformance[domain]) domainPerformance[domain] = { good: 0, total: 0 };
    domainPerformance[domain].total++;
    if (d.outcomeQuality === 'good' || d.outcomeQuality === 'exceeded') {
      domainPerformance[domain].good++;
    }
  });

  // ─── Emotional State Correlation ──────────────────────────────────────
  const emotionalCorrelation: Record<string, { good: number; total: number }> = {};
  resolved.forEach((d) => {
    const state = d.input.emotionalState || 'calm';
    if (!emotionalCorrelation[state]) emotionalCorrelation[state] = { good: 0, total: 0 };
    emotionalCorrelation[state].total++;
    if (d.outcomeQuality === 'good' || d.outcomeQuality === 'exceeded') {
      emotionalCorrelation[state].good++;
    }
  });

  // ─── Stakes Performance ───────────────────────────────────────────────
  const stakesPerformance: Record<string, { good: number; total: number }> = {};
  resolved.forEach((d) => {
    const stakes = d.input.stakes;
    if (!stakesPerformance[stakes]) stakesPerformance[stakes] = { good: 0, total: 0 };
    stakesPerformance[stakes].total++;
    if (d.outcomeQuality === 'good' || d.outcomeQuality === 'exceeded') {
      stakesPerformance[stakes].good++;
    }
  });

  // ─── Decision Quality vs Outcome Quality (Annie Duke) ─────────────────
  const goodDecisionBadOutcome = resolved.filter(
    (d) => d.decisionQuality === 'good' && (d.outcomeQuality === 'failed' || d.outcomeQuality === 'below')
  ).length;

  const badDecisionGoodOutcome = resolved.filter(
    (d) => d.decisionQuality === 'poor' && (d.outcomeQuality === 'good' || d.outcomeQuality === 'exceeded')
  ).length;

  // ─── Average Confidence ───────────────────────────────────────────────
  const avgConfidence = Math.round(
    decisions.reduce((sum, d) => sum + (d.input.userConfidence || 50), 0) / decisions.length
  );

  return {
    totalDecisions: total,
    resolvedDecisions: resolved.length,
    successRate,
    brierScore,
    domainPerformance,
    emotionalCorrelation,
    stakesPerformance,
    goodDecisionBadOutcome,
    badDecisionGoodOutcome,
    avgConfidence,
    computedAt: new Date().toISOString(),
  };
}
