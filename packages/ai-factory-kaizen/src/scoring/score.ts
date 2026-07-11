// FR-7: score a run against explicit par thresholds — one entry per threshold, never
// collapsed into a single blended score.
import type { EvalRunResult } from '../domain/eval-run-result';
import type { ParThreshold, ScoreReport } from '../domain/par-threshold';
import { computeMetrics } from './metrics';

export function scoreAgainstThresholds(
  result: EvalRunResult,
  thresholds: ParThreshold[],
): ScoreReport {
  const metrics = computeMetrics(result);
  return thresholds.map((threshold) => {
    const actual = threshold.actual(metrics);
    const passed = threshold.comparator === 'min' ? actual >= threshold.limit : actual <= threshold.limit;
    return { threshold: threshold.name, actual, limit: threshold.limit, passed };
  });
}
