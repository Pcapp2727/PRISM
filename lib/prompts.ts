import type { DecisionInput, PatternSnapshot } from './types';

export const ANALYSIS_VERSION = '1.0.0';

export const EVIDENCE_SYSTEM_PROMPT = `You are PRISM — a Pattern Recognition & Intelligent Strategy Mapping engine built on the combined methodologies of:
- Tetlock (superforecasting, reference class forecasting, Brier scoring)
- Kahneman (System 1/2, bias detection from language patterns, noise)
- Taleb (convexity, fragility, antifragility, barbell strategy)
- Annie Duke (decision quality ≠ outcome quality, resulting, kill criteria)
- Gary Klein (recognition-primed decisions, expertise detection)
- Dalio (believability weighting, root cause analysis)
- Cynefin framework (complexity classification → decision approach)

ABSOLUTE RULES:
1. ZERO opinion. ZERO motivational filler. ZERO encouragement.
2. Every claim must trace to evidence, base rates, or logical deduction.
3. If evidence is insufficient, say "INSUFFICIENT DATA" — never speculate.
4. Detect biases from the USER'S ACTUAL LANGUAGE, not generic checklists.
5. Probability estimates must be grounded in reference class base rates with explicit adjustment factors.
6. All number fields must be integers, not ranges.

Respond with ONLY a valid JSON object. No markdown, no backticks, no text before or after.`;

export const VERDICT_SYSTEM_PROMPT = `You are PRISM — a decision intelligence engine delivering frameworks, scenarios, and verdicts.

ABSOLUTE RULES:
1. Every probability must trace to the reference class base rate provided.
2. Scenarios must include a Black Swan (tail risk) case.
3. Kill criteria must be specific and measurable, not vague.
4. Decision triggers must be concrete conditions, not feelings.
5. The "unasked question" must be genuinely insight-generating, not generic.
6. Speed advisory must match the evidence — don't default to "gather more data" when evidence is sufficient.
7. The meta-question must challenge whether this is even the right decision to be making.

Respond with ONLY a valid JSON object. No markdown, no backticks, no text before or after.`;

function buildDecisionContext(input: DecisionInput): string {
  const parts = [
    "DECISION: " + input.decision,
    "CONTEXT: " + (input.context || "None provided"),
    "DOMAIN: " + input.domain + " | STAKES: " + input.stakes + " | TIMEFRAME: " + input.timeframe,
    "REVERSIBILITY (user assessment): " + input.reversibility,
    "STAKEHOLDERS: " + (input.stakeholders || "Not specified"),
    "PRIOR ATTEMPTS: " + (input.priorAttempts || "None mentioned"),
    "USER CONFIDENCE: " + input.userConfidence + "%",
    "EMOTIONAL STATE: " + input.emotionalState,
    "EXPERTISE IN DOMAIN: " + input.expertiseLevel,
    "DECISION SPEED: " + input.decisionSpeed,
    "USER-DEFINED KILL CRITERIA: " + (input.killCriteria || "Not defined"),
  ];
  return parts.join("\n");
}

function buildPatternContext(patterns: PatternSnapshot | null): string {
  if (!patterns || patterns.totalDecisions < 1) {
    return "INTERNAL PATTERNS: No decision history available. First logged decision.";
  }

  const lines = [
    "INTERNAL PATTERN DATA (" + patterns.totalDecisions + " logged, " + patterns.resolvedDecisions + " with outcomes):",
    "- Overall success rate: " + (patterns.successRate ?? "N/A") + "%",
    "- Brier calibration score: " + (patterns.brierScore ?? "Insufficient data") + "/100",
    "- Good decisions with bad outcomes (variance): " + patterns.goodDecisionBadOutcome,
    "- Bad decisions with good outcomes (luck): " + patterns.badDecisionGoodOutcome,
    "- Average confidence level: " + patterns.avgConfidence + "%",
  ];

  if (Object.keys(patterns.domainPerformance).length > 0) {
    lines.push("- Domain performance: " + JSON.stringify(patterns.domainPerformance));
  }
  if (Object.keys(patterns.emotionalCorrelation).length > 0) {
    lines.push("- Emotional state outcomes: " + JSON.stringify(patterns.emotionalCorrelation));
  }

  return lines.join("\n");
}

export function buildEvidencePrompt(input: DecisionInput, patterns: PatternSnapshot | null): string {
  const dc = buildDecisionContext(input);
  const pc = buildPatternContext(patterns);

  return "Analyze this decision. Return a JSON object with these exact keys.\n\n" + dc + "\n\n" + pc + "\n\n" + `Required JSON structure:
{
  "cynefin": {
    "classification": "simple" or "complicated" or "complex" or "chaotic",
    "reasoning": "1-2 sentences explaining why",
    "implication": "What this means for the decision approach"
  },
  "reference_class": {
    "class_description": "The specific reference class this decision belongs to",
    "base_rate_success": "XX%" or "INSUFFICIENT DATA",
    "base_rate_source": "Where this base rate comes from",
    "adjustment_factors": [
      {"factor": "specific factor", "direction": "above" or "below", "magnitude": "slight" or "moderate" or "significant", "evidence": "why this adjusts"}
    ],
    "adjusted_estimate": "XX%" or "INSUFFICIENT DATA"
  },
  "convexity": {
    "payoff_structure": "convex" or "concave" or "linear",
    "max_downside": "worst realistic loss, quantified if possible",
    "max_upside": "best realistic gain, quantified if possible",
    "asymmetry_ratio": "X:1 ratio of upside to downside",
    "fragility_score": integer 0-100,
    "fragility_factors": ["single point of failure"],
    "antifragile_elements": ["element that gets stronger with volatility"],
    "barbell_option": "90% safe / 10% speculative restructuring, or N/A"
  },
  "evidence": {
    "internal": {
      "patterns": ["pattern from user history relevant to this decision"],
      "calibration_warning": "warning or null",
      "emotional_pattern": "how user performs in current emotional state, or null",
      "expertise_note": "how much to weight their intuition and why"
    },
    "external": {
      "base_rates": [{"fact": "specific verifiable data point", "source": "research or industry or historical", "confidence": "high or medium or low"}],
      "analogues": [{"situation": "comparable historical case", "outcome": "what happened", "lesson": "key takeaway"}],
      "success_factors": ["evidence-backed factor"],
      "failure_modes": ["evidence-backed common failure pattern"]
    },
    "gaps": {
      "unknowns": [{"what": "critical unknown", "impact": "high or medium or low", "resolve": "how to find this out"}],
      "completeness": integer 0-100,
      "reasoning": "what data we have vs what we would need"
    }
  },
  "biases": [
    {
      "name": "cognitive bias name",
      "signal": "EXACT phrase from the user input that triggered detection",
      "severity": "high or medium or low",
      "reframe": "how to restate the decision without this bias"
    }
  ],
  "noise": {
    "changes_tomorrow": "yes or probably or no",
    "sources": ["factor that could produce inconsistent judgment"],
    "fix": "specific action to reduce noise"
  },
  "expertise_weight": {
    "intuition_weight": "high or moderate or low or ignore",
    "reasoning": "why this weight based on expertise and domain match"
  }
}`;
}

export function buildVerdictPrompt(
  input: DecisionInput,
  evidenceData: Record<string, unknown>
): string {
  const dc = buildDecisionContext(input);
  const cyn = evidenceData.cynefin as Record<string, string> | undefined;
  const rc = evidenceData.reference_class as Record<string, string> | undefined;
  const cv = evidenceData.convexity as Record<string, unknown> | undefined;
  const ev = evidenceData.evidence as Record<string, Record<string, unknown>> | undefined;

  const cynefin = cyn?.classification || "complex";
  const adjusted = rc?.adjusted_estimate || "unknown";
  const structure = cv?.payoff_structure || "unknown";
  const ratio = cv?.asymmetry_ratio || "unknown";
  const completeness = ev?.gaps?.completeness ?? "unknown";

  return "Provide decision frameworks, scenarios, and verdict based on this evidence.\n\n" + dc + "\n\nEVIDENCE SUMMARY:\n- Cynefin: " + cynefin + "\n- Reference class adjusted estimate: " + adjusted + "\n- Payoff structure: " + structure + ", asymmetry ratio: " + ratio + "\n- Information completeness: " + completeness + "%\n\n" + `Required JSON structure:
{
  "frameworks": [
    {
      "name": "framework name",
      "why": "evidence-based reason this framework applies",
      "insight": "the specific insight this framework reveals",
      "action": "what this framework says to do"
    }
  ],
  "scenarios": [
    {
      "name": "Best Case",
      "probability": integer 0-100,
      "basis": "reference class + adjustment factors justifying this number",
      "outcome": "1-2 sentence description",
      "signals": "early indicators that confirm this trajectory",
      "timeline": "when you would see these signals"
    },
    {
      "name": "Base Case",
      "probability": integer 0-100,
      "basis": "evidence basis",
      "outcome": "description",
      "signals": "indicators",
      "timeline": "when"
    },
    {
      "name": "Worst Case",
      "probability": integer 0-100,
      "basis": "evidence basis",
      "outcome": "description",
      "signals": "indicators",
      "timeline": "when"
    },
    {
      "name": "Black Swan",
      "probability": integer under 10,
      "basis": "tail risk analysis",
      "outcome": "the unlikely but catastrophic scenario",
      "signals": "early warning signs",
      "timeline": "when"
    }
  ],
  "verdict": {
    "recommendation": "2-3 sentences. Direct. Evidence-grounded.",
    "confidence": integer 0-100,
    "basis": "traceable to evidence quality and completeness score",
    "question": "the single most important unasked question",
    "kill_criteria": ["specific measurable condition that should trigger reversal"],
    "triggers": {
      "proceed": "concrete condition for proceeding",
      "reconsider": "concrete condition for pausing",
      "abort": "concrete condition for stopping"
    },
    "speed": "MOVE NOW or TAKE YOUR TIME or SET DEADLINE or GATHER DATA or DELAY IS THE DECISION",
    "speed_why": "1 sentence grounded in timeframe, stakes, and reversibility",
    "review": "when to revisit this decision",
    "flip": "single piece of new information that would reverse this recommendation",
    "meta": "should you even be deciding this now"
  }
}`;
}