// FR-10 (minimal first cut): a human-readable report per run. No trend/history persistence
// across generations here — that's FR-9, epic 4, not duplicated (docs/plan.md, Epic 2b).
import type { EvalRunResult } from '../domain/eval-run-result';
import { computeMetrics, type DerivedMetrics } from '../scoring/metrics';

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
