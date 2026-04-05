import type { PRISMAnalysis } from './types';

/**
 * Normalizes the merged API response (Call 1 + Call 2) into
 * the typed PRISMAnalysis structure. Handles both compact and
 * verbose field names to be resilient to prompt variations.
 */
export function normalizeAnalysis(raw: Record<string, unknown>): Omit<PRISMAnalysis, 'analysisVersion' | 'generatedAt'> {
  const r = raw as Record<string, any>;

  // Evidence layer
  const ev = r.evidence || r.evidence_layers || {};
  const ei = ev.internal || {};
  const ee = ev.external || {};
  const eg = ev.gaps || {};

  // Convexity
  const cv = r.convexity || r.convexity_analysis || {};

  // Reference class
  const rc = r.reference_class || r.ref_class || {};

  // Biases
  const biases = r.biases || r.language_bias_detection || r.bias_scan || [];

  // Noise
  const noise = r.noise || r.noise_check || {};

  // Expertise
  const exp = r.expertise_weight || r.expertise_weighting || r.expertise_wt || {};

  // Frameworks
  const frameworks = (r.frameworks || []).map((f: Record<string, string>) => ({
    name: f.name,
    whySelected: f.why || f.why_selected || f.whySelected || '',
    application: f.insight || f.application || '',
    verdict: f.action || f.do || f.verdict || '',
  }));

  // Scenarios
  const scenarios = (r.scenarios || []).map((s: Record<string, any>) => ({
    name: s.name,
    probability: s.prob ?? s.probability ?? 0,
    probabilityBasis: s.basis || s.probability_basis || s.probabilityBasis || '',
    outcome: s.outcome || '',
    leadingIndicators: s.signals || s.leading_indicators || s.leadingIndicators || '',
    timeline: s.when || s.timeline || '',
  }));

  // Verdict
  const vd = r.verdict || {};
  const triggers = vd.triggers || vd.decision_triggers || {};

  return {
    cynefin: {
      classification: r.cynefin?.classification || r.cynefin?.class || 'complex',
      reasoning: r.cynefin?.reasoning || r.cynefin?.reason || '',
      implication: r.cynefin?.implication || '',
    },

    referenceClass: {
      classDescription: rc.class_description || rc.classDescription || rc.desc || rc.description || '',
      baseRateSuccess: rc.base_rate_success || rc.baseRateSuccess || rc.base_rate || '',
      baseRateSource: rc.base_rate_source || rc.baseRateSource || rc.source || '',
      adjustmentFactors: (rc.adjustment_factors || rc.adjustmentFactors || rc.factors || []).map(
        (af: Record<string, string>) => ({
          factor: af.factor || af.f || '',
          direction: af.direction || af.dir || 'above',
          magnitude: af.magnitude || 'moderate',
          evidence: af.evidence || af.ev || '',
        })
      ),
      adjustedEstimate: rc.adjusted_estimate || rc.adjustedEstimate || rc.adjusted || '',
    },

    convexityAnalysis: {
      payoffStructure: cv.payoff_structure || cv.payoffStructure || cv.structure || 'linear',
      maxDownside: cv.max_downside || cv.maxDownside || cv.downside || '',
      maxUpside: cv.max_upside || cv.maxUpside || cv.upside || '',
      asymmetryRatio: cv.asymmetry_ratio || cv.asymmetryRatio || cv.ratio || '',
      fragilityScore: cv.fragility_score ?? cv.fragilityScore ?? cv.fragility ?? 50,
      fragilityFactors: cv.fragility_factors || cv.fragilityFactors || cv.fragile || cv.fragile_factors || [],
      antifragileElements: cv.antifragile_elements || cv.antifragileElements || cv.antifragile || [],
      barbellOption: cv.barbell_option || cv.barbellOption || cv.barbell || 'N/A',
    },

    evidenceLayers: {
      internal: {
        patternsRelevant: ei.patterns || ei.patterns_relevant_to_this || ei.patternsRelevant || [],
        calibrationWarning: ei.calibration_warning || ei.calibrationWarning || ei.cal_warn || null,
        emotionalStatePattern: ei.emotional_state_pattern || ei.emotionalStatePattern || ei.emotional_pattern || ei.emo_pattern || null,
        expertiseAssessment: ei.expertise_assessment || ei.expertiseAssessment || ei.expertise_note || '',
      },
      external: {
        baseRates: (ee.base_rates || ee.baseRates || ee.rates || []).map(
          (br: Record<string, string>) => ({
            fact: br.fact || '',
            sourceType: br.source_type || br.sourceType || br.source || br.src || 'research',
            confidence: br.confidence || br.conf || 'medium',
          })
        ),
        historicalAnalogues: (ee.historical_analogues || ee.historicalAnalogues || ee.analogues || []).map(
          (ha: Record<string, string>) => ({
            situation: ha.situation || ha.case || '',
            outcome: ha.outcome || ha.result || '',
            lesson: ha.lesson || '',
          })
        ),
        domainSuccessFactors: ee.domain_success_factors || ee.domainSuccessFactors || ee.success_factors || ee.success || [],
        domainFailureModes: ee.domain_failure_modes || ee.domainFailureModes || ee.failure_modes || ee.failure || [],
      },
      gaps: {
        criticalUnknowns: (eg.critical_unknowns || eg.criticalUnknowns || eg.unknowns || []).map(
          (u: Record<string, string>) => ({
            unknown: u.unknown || u.what || '',
            impact: u.impact || 'medium',
            resolution: u.resolution || u.resolve || u.how_to_resolve || '',
          })
        ),
        completenessScore: eg.completeness_score ?? eg.completenessScore ?? eg.completeness ?? eg.complete ?? 0,
        completenessReasoning: eg.completeness_reasoning || eg.completenessReasoning || eg.reasoning || eg.why || '',
      },
    },

    biasDetection: biases.map((b: Record<string, string>) => ({
      bias: b.bias || b.name || '',
      detectedSignal: b.detected_signal || b.detectedSignal || b.signal || '',
      severity: b.severity || 'medium',
      reframe: b.reframe || '',
    })),

    noiseCheck: {
      wouldChangetomorrow: noise.would_answer_change_tomorrow || noise.wouldChangeTomorrow || noise.changes_tomorrow || noise.changes || 'probably',
      noiseSources: noise.noise_sources || noise.noiseSources || noise.sources || [],
      noiseReduction: noise.noise_reduction || noise.noiseReduction || noise.fix || '',
    },

    expertiseWeighting: {
      intuitionWeight: exp.intuition_weight || exp.intuitionWeight || exp.weight || 'moderate',
      reasoning: exp.reasoning || exp.why || '',
    },

    frameworks,
    scenarios,

    verdict: {
      recommendation: vd.recommendation || vd.rec || '',
      confidenceLevel: vd.confidence_level ?? vd.confidenceLevel ?? vd.confidence ?? vd.conf ?? 50,
      confidenceBasis: vd.confidence_basis || vd.confidenceBasis || vd.basis || '',
      theQuestion: vd.the_question || vd.theQuestion || vd.question || '',
      killCriteria: vd.kill_criteria || vd.killCriteria || vd.kills || [],
      decisionTriggers: {
        proceed: triggers.proceed_if || triggers.proceed || triggers.go || '',
        reconsider: triggers.reconsider_if || triggers.reconsider || triggers.wait || '',
        abort: triggers.abort_if || triggers.abort || triggers.stop || '',
      },
      speedAdvisory: vd.speed_advisory || vd.speedAdvisory || vd.speed || 'GATHER DATA',
      speedReasoning: vd.speed_reasoning || vd.speedReasoning || vd.speed_why || '',
      reviewSchedule: vd.review_schedule || vd.reviewSchedule || vd.review || '',
      whatWouldFlip: vd.what_would_flip_this || vd.whatWouldFlip || vd.flip || '',
      metaQuestion: vd.meta_question || vd.metaQuestion || vd.meta || '',
    },
  };
}
