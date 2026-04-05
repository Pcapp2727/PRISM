// ─── Input Types ─────────────────────────────────────────────────────────────

export interface DecisionInput {
  decision: string;
  context: string;
  domain: 'business' | 'financial' | 'career' | 'health' | 'relationship' | 'technical' | 'legal' | 'other';
  stakes: 'low' | 'medium' | 'high' | 'existential';
  timeframe: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  reversibility: 'easy' | 'partial' | 'hard' | 'irreversible' | 'unsure';
  stakeholders: string;
  priorAttempts: string;
  userConfidence: number; // 0-100
  emotionalState: 'calm' | 'excited' | 'anxious' | 'frustrated' | 'uncertain';
  expertiseLevel: 'none' | 'some' | 'experienced' | 'expert';
  killCriteria: string;
  decisionSpeed: 'snap' | 'fast' | 'moderate' | 'deliberate' | 'agonizing';
}

// ─── Analysis Output Types ──────────────────────────────────────────────────

export interface CynefinClassification {
  classification: 'simple' | 'complicated' | 'complex' | 'chaotic';
  reasoning: string;
  implication: string;
}

export interface ReferenceClass {
  classDescription: string;
  baseRateSuccess: string;
  baseRateSource: string;
  adjustmentFactors: Array<{
    factor: string;
    direction: 'above' | 'below';
    magnitude: 'slight' | 'moderate' | 'significant';
    evidence: string;
  }>;
  adjustedEstimate: string;
}

export interface ConvexityAnalysis {
  payoffStructure: 'convex' | 'concave' | 'linear';
  maxDownside: string;
  maxUpside: string;
  asymmetryRatio: string;
  fragilityScore: number; // 0-100
  fragilityFactors: string[];
  antifragileElements: string[];
  barbellOption: string;
}

export interface EvidenceLayers {
  internal: {
    patternsRelevant: string[];
    calibrationWarning: string | null;
    emotionalStatePattern: string | null;
    expertiseAssessment: string;
  };
  external: {
    baseRates: Array<{
      fact: string;
      sourceType: 'research' | 'industry' | 'historical';
      confidence: 'high' | 'medium' | 'low';
    }>;
    historicalAnalogues: Array<{
      situation: string;
      outcome: string;
      lesson: string;
    }>;
    domainSuccessFactors: string[];
    domainFailureModes: string[];
  };
  gaps: {
    criticalUnknowns: Array<{
      unknown: string;
      impact: 'high' | 'medium' | 'low';
      resolution: string;
    }>;
    completenessScore: number; // 0-100
    completenessReasoning: string;
  };
}

export interface BiasDetection {
  bias: string;
  detectedSignal: string;
  severity: 'high' | 'medium' | 'low';
  reframe: string;
}

export interface NoiseCheck {
  wouldChangetomorrow: 'yes' | 'probably' | 'no';
  noiseSources: string[];
  noiseReduction: string;
}

export interface ExpertiseWeighting {
  intuitionWeight: 'high' | 'moderate' | 'low' | 'ignore';
  reasoning: string;
}

export interface Framework {
  name: string;
  whySelected: string;
  application: string;
  verdict: string;
}

export interface Scenario {
  name: string;
  probability: number;
  probabilityBasis: string;
  outcome: string;
  leadingIndicators: string;
  timeline: string;
}

export interface Verdict {
  recommendation: string;
  confidenceLevel: number; // 0-100
  confidenceBasis: string;
  theQuestion: string;
  killCriteria: string[];
  decisionTriggers: {
    proceed: string;
    reconsider: string;
    abort: string;
  };
  speedAdvisory: 'MOVE NOW' | 'TAKE YOUR TIME' | 'SET DEADLINE' | 'GATHER DATA' | 'DELAY IS THE DECISION';
  speedReasoning: string;
  reviewSchedule: string;
  whatWouldFlip: string;
  metaQuestion: string;
}

export interface PRISMAnalysis {
  cynefin: CynefinClassification;
  referenceClass: ReferenceClass;
  convexityAnalysis: ConvexityAnalysis;
  evidenceLayers: EvidenceLayers;
  biasDetection: BiasDetection[];
  noiseCheck: NoiseCheck;
  expertiseWeighting: ExpertiseWeighting;
  frameworks: Framework[];
  scenarios: Scenario[];
  verdict: Verdict;
  analysisVersion: string;
  generatedAt: string;
}

// ─── Database Types ─────────────────────────────────────────────────────────

export interface Decision {
  id: string;
  userId: string;
  input: DecisionInput;
  analysis: PRISMAnalysis;
  outcomeQuality: string | null;
  decisionQuality: string | null;
  outcomeNotes: string | null;
  outcomeSurprise: string | null;
  outcomeDate: string | null;
  createdAt: string;
}

export interface PatternSnapshot {
  totalDecisions: number;
  resolvedDecisions: number;
  successRate: number | null;
  brierScore: number | null;
  domainPerformance: Record<string, { good: number; total: number }>;
  emotionalCorrelation: Record<string, { good: number; total: number }>;
  stakesPerformance: Record<string, { good: number; total: number }>;
  goodDecisionBadOutcome: number;
  badDecisionGoodOutcome: number;
  avgConfidence: number;
  computedAt: string;
}
