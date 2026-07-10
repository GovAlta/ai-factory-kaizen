import type { EvalRunResult } from '../domain/eval-run-result';
import type { ParThreshold } from '../domain/par-threshold';
import { scoreAgainstThresholds } from './score';

const sample: EvalRunResult = {
  harness_id: 'keystone',
  spec_id: 'spec-1',
  timestamp: '2026-01-01T00:00:00.000Z',
  stages: {
    'build/test': { attempted: 1, passed: true, iterations: 2, duration_s: 30, findings: { critical: 0, high: 0, medium: 0, low: 0 } },
    security: { attempted: 1, passed: false, iterations: 1, duration_s: 10, findings: { critical: 0, high: 1, medium: 2, low: 0 } },
    deployment: { attempted: 1, passed: true, iterations: 1, duration_s: 5, findings: { critical: 0, high: 0, medium: 0, low: 0 } },
    post_deploy_verification: { attempted: 1, passed: true, iterations: 1, duration_s: 3, findings: { critical: 0, high: 0, medium: 0, low: 0 } },
  },
  requirement_coverage: { total: 10, traced_to_code: 9, traced_to_test: 8 },
  overall: {
    build_passed: true,
    security_gate_passed: false,
    deployed: true,
    post_deploy_verified: true,
    cycle_time_s: 120,
    total_iterations: 5,
  },
};

// Example thresholds only — the real numeric par values are deferred to epic 2, decided
// immediately before the first live Tier A comparison run (docs/requirements.md FR-7).
const exampleThresholds: ParThreshold[] = [
  { name: 'minRequirementCoveragePercent', comparator: 'min', limit: 90, actual: (m) => m.requirementCoveragePercent },
  { name: 'maxCriticalFindings', comparator: 'max', limit: 0, actual: (m) => m.securityFindingsBySeverity.critical },
  { name: 'maxHighFindings', comparator: 'max', limit: 0, actual: (m) => m.securityFindingsBySeverity.high },
  { name: 'maxCycleTimeSeconds', comparator: 'max', limit: 600, actual: (m) => m.cycleTimeSeconds ?? Infinity },
];

describe('FR-7: score against explicit par thresholds, never blended', () => {
  it('given an EvalRunResult and named thresholds, when scored, then each threshold reports its own pass/fail', () => {
    expect(scoreAgainstThresholds(sample, exampleThresholds)).toEqual([
      { threshold: 'minRequirementCoveragePercent', actual: 80, limit: 90, passed: false },
      { threshold: 'maxCriticalFindings', actual: 0, limit: 0, passed: true },
      { threshold: 'maxHighFindings', actual: 1, limit: 0, passed: false },
      { threshold: 'maxCycleTimeSeconds', actual: 120, limit: 600, passed: true },
    ]);
  });

  it('given a threshold set with zero entries, when scored, then the result is an empty list, not an error and not a default pass', () => {
    expect(scoreAgainstThresholds(sample, [])).toEqual([]);
  });

  it('given results that mix passing and failing thresholds, when scored, then no entry influences another\'s pass/fail', () => {
    const report = scoreAgainstThresholds(sample, exampleThresholds);
    const failing = report.filter((r) => !r.passed);
    const passing = report.filter((r) => r.passed);
    expect(failing.map((r) => r.threshold)).toEqual(['minRequirementCoveragePercent', 'maxHighFindings']);
    expect(passing.map((r) => r.threshold)).toEqual(['maxCriticalFindings', 'maxCycleTimeSeconds']);
  });
});
