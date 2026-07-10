// FR-7: score a run against explicit par thresholds, stated numerically before the run,
// reported per-threshold — never collapsed into one blended score.
//
// `actual` is a plain accessor function rather than a metric-name string, deliberately: a
// string-keyed lookup into DerivedMetrics would need dynamic property access for a set of
// only four known thresholds — more machinery than this size warrants (Article 5).
import type { DerivedMetrics } from '../scoring/metrics';

export type ThresholdComparator = 'min' | 'max';

export interface ParThreshold {
  name: string;
  comparator: ThresholdComparator;
  limit: number;
  actual: (metrics: DerivedMetrics) => number;
}

export interface ScoreReportEntry {
  threshold: string;
  actual: number;
  limit: number;
  passed: boolean;
}
