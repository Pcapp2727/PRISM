// Types for the Agent Intelligence layer.
// Add these alongside your existing lib/types.ts — or import from here.

export interface RegisteredAgent {
  id: string;
  user_id: string;
  agent_id: string;
  display_name: string;
  role: string | null;
  domain_tags: string[];
  description: string | null;
  status: 'active' | 'paused' | 'retired';
  mcp_endpoint: string | null;
  created_at: string;
  updated_at: string;
}

export interface PredictedOutcome {
  description: string;
  probability: number;                // 0..1
  expected_value_usd?: number;
}

export interface ActualOutcome {
  description: string;
  succeeded: boolean;
  actual_value_usd?: number;
}

export interface AgentDecision {
  id: string;
  user_id: string;
  agent_id: string;
  created_at: string;

  domain: string;
  category: string;
  decision_summary: string;
  payload: Record<string, unknown>;

  predicted_outcome: PredictedOutcome;
  resolution_date: string | null;

  actual_outcome: ActualOutcome | null;
  outcome_logged_at: string | null;
  outcome_notes: string | null;

  brier_score: number | null;
  parent_decision_id: string | null;
}

export interface ReasoningTrace {
  id: string;
  user_id: string;
  agent_decision_id: string | null;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  latency_ms: number | null;
  created_at: string;
}

export interface CalibrationRow {
  user_id: string;
  agent_id: string;
  domain: string;
  n: number;
  mean_brier: number;
  actual_success_rate: number;
  mean_predicted_prob: number;
  earliest: string;
  latest_outcome: string | null;
}

// Summary shown in the fleet overview card.
export interface AgentFleetSummary {
  agent: RegisteredAgent;
  total_decisions: number;
  resolved_decisions: number;
  pending_decisions: number;
  mean_brier: number | null;          // null = not enough resolved
  domains_active: string[];
  last_decision_at: string | null;
  calibration_label: 'excellent' | 'good' | 'mixed' | 'poor' | 'insufficient_data';
}

export function labelBrier(brier: number | null, n: number): AgentFleetSummary['calibration_label'] {
  if (brier === null || n < 10) return 'insufficient_data';
  if (brier < 0.10) return 'excellent';
  if (brier < 0.15) return 'good';
  if (brier < 0.25) return 'mixed';
  return 'poor';
}

// Reliability diagram bucket
export interface ReliabilityBucket {
  predicted_range: string;            // '0.0-0.2'
  n: number;
  avg_predicted: number | null;
  actual_rate: number | null;
}
