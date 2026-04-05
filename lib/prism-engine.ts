import Anthropic from '@anthropic-ai/sdk';
import type { DecisionInput, PRISMAnalysis, PatternSnapshot } from './types';
import {
  EVIDENCE_SYSTEM_PROMPT,
  VERDICT_SYSTEM_PROMPT,
  ANALYSIS_VERSION,
  buildEvidencePrompt,
  buildVerdictPrompt,
} from './prompts';
import { normalizeAnalysis } from './normalizer';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = 'claude-sonnet-4-20250514';

// ─── JSON Parser with Truncation Recovery ───────────────────────────────────

function parseJSON(text: string): Record<string, unknown> {
  let clean = text.trim();

  // Strip markdown fences
  clean = clean.replace(/^```(?:json)?\s*/gi, '').replace(/\s*```$/gi, '').trim();

  // Try direct parse
  try {
    return JSON.parse(clean);
  } catch {
    // Extract JSON object
    const match = clean.match(/\{[\s\S]*/);
    if (!match) throw new Error(`No JSON object found in response: ${clean.slice(0, 100)}`);

    let fixable = match[0];

    // Remove trailing incomplete values
    fixable = fixable.replace(/,\s*"[^"]*$/, '');
    fixable = fixable.replace(/,\s*$/, '');
    fixable = fixable.replace(/:\s*"[^"]*$/, ': "..."');
    fixable = fixable.replace(/:\s*$/, ': null');

    // Close unclosed brackets
    const openBraces = (fixable.match(/\{/g) || []).length;
    const closeBraces = (fixable.match(/\}/g) || []).length;
    const openBrackets = (fixable.match(/\[/g) || []).length;
    const closeBrackets = (fixable.match(/\]/g) || []).length;

    for (let i = 0; i < openBrackets - closeBrackets; i++) fixable += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) fixable += '}';

    try {
      return JSON.parse(fixable);
    } catch {
      throw new Error(`Failed to parse truncated JSON: ${clean.slice(0, 100)}`);
    }
  }
}

// ─── Core Analysis Function ─────────────────────────────────────────────────

export async function analyzeDecision(
  input: DecisionInput,
  patterns: PatternSnapshot | null
): Promise<PRISMAnalysis> {

  // ═══ CALL 1: Evidence + Classification ═══
  const evidenceResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: EVIDENCE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildEvidencePrompt(input, patterns),
    }],
  });

  const evidenceText = evidenceResponse.content
    .filter((block) => block.type === 'text')
    .map((block) => ('text' in block ? block.text : ''))
    .join('');

  const evidenceData = parseJSON(evidenceText);

  // ═══ CALL 2: Frameworks + Scenarios + Verdict ═══
  const verdictResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system: VERDICT_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildVerdictPrompt(input, evidenceData),
    }],
  });

  const verdictText = verdictResponse.content
    .filter((block) => block.type === 'text')
    .map((block) => ('text' in block ? block.text : ''))
    .join('');

  const verdictData = parseJSON(verdictText);

  // ═══ Merge + Normalize ═══
  const merged = { ...evidenceData, ...verdictData };
  const analysis = normalizeAnalysis(merged);

  return {
    ...analysis,
    analysisVersion: ANALYSIS_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Streaming Analysis (for real-time UI) ──────────────────────────────────

export async function analyzeDecisionStream(
  input: DecisionInput,
  patterns: PatternSnapshot | null,
  onProgress: (step: string, data?: unknown) => void
): Promise<PRISMAnalysis> {

  onProgress('classifying');

  // Call 1 with streaming
  let evidenceText = '';
  const evidenceStream = client.messages.stream({
    model: MODEL,
    max_tokens: 3000,
    system: EVIDENCE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildEvidencePrompt(input, patterns),
    }],
  });

  onProgress('evidence');

  for await (const event of evidenceStream) {
    if (event.type === 'content_block_delta' && 'delta' in event && 'text' in (event.delta as Record<string, unknown>)) {
      evidenceText += (event.delta as Record<string, string>).text;
    }
  }

  const evidenceData = parseJSON(evidenceText);
  onProgress('evidence_complete', evidenceData);

  // Call 2 with streaming
  let verdictText = '';
  const verdictStream = client.messages.stream({
    model: MODEL,
    max_tokens: 2500,
    system: VERDICT_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildVerdictPrompt(input, evidenceData),
    }],
  });

  onProgress('scenarios');

  for await (const event of verdictStream) {
    if (event.type === 'content_block_delta' && 'delta' in event && 'text' in (event.delta as Record<string, unknown>)) {
      verdictText += (event.delta as Record<string, string>).text;
    }
  }

  const verdictData = parseJSON(verdictText);
  onProgress('verdict_complete', verdictData);

  const merged = { ...evidenceData, ...verdictData };
  const analysis = normalizeAnalysis(merged);

  return {
    ...analysis,
    analysisVersion: ANALYSIS_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Token Cost Estimation ──────────────────────────────────────────────────

export function estimateCost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet pricing (approximate)
  const inputCost = (inputTokens / 1_000_000) * 3.0;  // $3/M input tokens
  const outputCost = (outputTokens / 1_000_000) * 15.0; // $15/M output tokens
  return inputCost + outputCost;
}
