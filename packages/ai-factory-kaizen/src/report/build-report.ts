// FR-10 (minimal first cut): a human-readable report per run. No trend/history persistence
// across generations here — that's FR-9, epic 4, not duplicated (docs/plan.md, Epic 2b).
import type { EvalRunResult } from '../domain/eval-run-result';
import { computeMetrics, type DerivedMetrics } from '../scoring/metrics';

// Known, deliberately deferred inconsistency: harness_id/spec_id/timestamp are snake_case
// (EvalRunResult's own shape, epic 1) while DerivedMetrics is camelCase (TS convention) — both
// visible together for the first time in this human-readable report. Fixing it means touching
// epic 1's already-shipped schema, which is its own justified epic later, not a reactive
// change folded into this one (Article 5).
export interface RunReport {
  harness_id: string;
  spec_id: string;
  timestamp: string;
  metrics: DerivedMetrics;
}

export interface Report {
  generatedAt: string;
  runs: RunReport[];
}

export function buildReport(runs: EvalRunResult[], generatedAt: string): Report {
  return {
    generatedAt,
    runs: runs.map((run) => ({
      harness_id: run.harness_id,
      spec_id: run.spec_id,
      timestamp: run.timestamp,
      metrics: computeMetrics(run),
    })),
  };
}
