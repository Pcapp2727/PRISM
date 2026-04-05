import { NextRequest, NextResponse } from 'next/server';
import { analyzeDecision } from '@/lib/prism-engine';
import { createServerClient } from '@/lib/supabase';
import { computePatterns } from '@/lib/pattern-computer';
import type { DecisionInput } from '@/lib/types';

export const maxDuration = 60; // Allow up to 60s for two API calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body.input as DecisionInput;

    if (!input?.decision?.trim()) {
      return NextResponse.json(
        { error: 'Decision text is required' },
        { status: 400 }
      );
    }

    // Get user's auth token from header
    const authHeader = req.headers.get('Authorization');
    const supabase = createServerClient();
    let userId: string | null = null;
    let patterns = null;

    // If authenticated, fetch decision history for pattern analysis
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        // Fetch past decisions for internal pattern analysis
        const { data: pastDecisions } = await supabase
          .from('decisions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (pastDecisions && pastDecisions.length > 0) {
          // Transform DB records to Decision type
          const mapped = pastDecisions.map((d) => ({
            id: d.id,
            userId: d.user_id,
            input: {
              decision: d.decision_text,
              context: d.context,
              domain: d.domain,
              stakes: d.stakes,
              timeframe: d.timeframe,
              reversibility: d.reversibility,
              stakeholders: d.stakeholders,
              priorAttempts: d.prior_attempts,
              userConfidence: d.user_confidence,
              emotionalState: d.emotional_state,
              expertiseLevel: d.expertise_level,
              killCriteria: d.kill_criteria,
              decisionSpeed: d.decision_speed,
            },
            analysis: d.analysis,
            outcomeQuality: d.outcome_quality,
            decisionQuality: d.decision_quality,
            outcomeNotes: d.outcome_notes,
            outcomeSurprise: d.outcome_surprise,
            outcomeDate: d.outcome_date,
            createdAt: d.created_at,
          }));

          patterns = computePatterns(mapped);
        }
      }
    }

    // Run PRISM analysis
    const analysis = await analyzeDecision(input, patterns);

    // Save to database if authenticated
    if (userId) {
      await supabase.from('decisions').insert({
        user_id: userId,
        decision_text: input.decision,
        context: input.context,
        domain: input.domain,
        stakes: input.stakes,
        timeframe: input.timeframe,
        reversibility: input.reversibility,
        stakeholders: input.stakeholders,
        prior_attempts: input.priorAttempts,
        user_confidence: input.userConfidence,
        emotional_state: input.emotionalState,
        expertise_level: input.expertiseLevel,
        kill_criteria: input.killCriteria,
        decision_speed: input.decisionSpeed,
        analysis: analysis,
        analysis_version: analysis.analysisVersion,
      });

      // Update monthly counter
      await supabase.rpc('increment_monthly_decisions', { uid: userId });
    }

    return NextResponse.json({ analysis, patterns });

  } catch (error) {
    console.error('PRISM analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
