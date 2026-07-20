// FR-10: a human-readable report per run, distinguishing confidence level (epic 4 — completes
// the product brief's own constraint that Tier B "should not be represented as
// equivalent-confidence data to Tier A in any report").
import type { EvalRunResult } from '../domain/eval-run-result';
import { computeMetrics, type DerivedMetrics } from '../scoring/metrics';

// 'live' = real, observed telemetry (this harness's own dogfood runs, or a real Tier A run).
// 'retrospective' = evidence-based (a TierBRecord) — never blended with 'live' in meaning,
// even though both go through the identical EvalRunResult schema and scoring pipeline.
export type Confidence = 'live' | 'retrospective';

export interface RunInput {
  result: EvalRunResult;
  confidence: Confidence;
}

// Known, deliberately deferred inconsistency: harness_id/spec_id/timestamp are snake_case
// (EvalRunResult's own shape, epic 1) while DerivedMetrics is camelCase (TS convention) — both
// visible together for the first time in this human-readable report. Fixing it means touching
// epic 1's already-shipped schema, which is its own justified epic later, not a reactive
// change folded into this one (Article 5).
export interface RunReport {
  harness_id: string;
  spec_id: string;
  timestamp: string;
  confidence: Confidence;
  metrics: DerivedMetrics;
}

export interface Report {
  generatedAt: string;
  runs: RunReport[];
}

export function buildReport(inputs: RunInput[], generatedAt: string): Report {
  return {
    generatedAt,
    runs: inputs.map(({ result, confidence }) => ({
      harness_id: result.harness_id,
      spec_id: result.spec_id,
      timestamp: result.timestamp,
      confidence,
      metrics: computeMetrics(result),
    })),
  };
}
