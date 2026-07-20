import type { EvalRunResult } from '../domain/eval-run-result';
import { computeMetrics } from './metrics';

const sample: EvalRunResult = {
  harness_id: 'keystone',
  spec_id: 'spec-1',
  timestamp: '2026-01-01T00:00:00.000Z',
  stages: {
    'build/test': {
      attempted: 1,
      passed: true,
      iterations: 2,
      duration_s: 30,
      findings: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    security: {
      attempted: 1,
      passed: false,
      iterations: 1,
      duration_s: 10,
      findings: { critical: 0, high: 1, medium: 2, low: 0 },
    },
    deployment: {
      attempted: 1,
      passed: true,
      iterations: 1,
      duration_s: 5,
      findings: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    post_deploy_verification: {
      attempted: 1,
      passed: true,
      iterations: 1,
      duration_s: 3,
      findings: { critical: 0, high: 0, medium: 0, low: 0 },
    },
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

describe('FR-5: deterministic metrics from EvalRunResult', () => {
  it('given a populated EvalRunResult, when scored, then it returns the derived metrics', () => {
    expect(computeMetrics(sample)).toEqual({
      buildTestPassed: true,
      requirementCoveragePercent: 80,
      securityFindingsBySeverity: { critical: 0, high: 1, medium: 2, low: 0 },
      cycleTimeSeconds: 120,
      totalIterations: 5,
      postDeployVerified: true,
    });
  });

  it('given the same EvalRunResult scored twice, when compared, then the results are identical', () => {
    expect(computeMetrics(sample)).toEqual(computeMetrics(sample));
  });

  it('given requirement_coverage.total is zero, when scored, then requirementCoveragePercent is 0, not NaN', () => {
    const empty: EvalRunResult = {
      ...sample,
      requirement_coverage: { total: 0, traced_to_code: 0, traced_to_test: 0 },
    };
    expect(computeMetrics(empty).requirementCoveragePercent).toBe(0);
  });

  it('given a stage is absent from a run, when scored, then it defaults rather than throwing', () => {
    const noSecurity: EvalRunResult = { ...sample, stages: {} };
    const metrics = computeMetrics(noSecurity);
    expect(metrics.buildTestPassed).toBe(false);
    expect(metrics.securityFindingsBySeverity).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
  });

  it('given requirement_coverage is null (epic 3 Tier B, "unmeasured"), when scored, then it does not throw and reports 0%, not a fabricated positive number', () => {
    const unmeasured: EvalRunResult = { ...sample, requirement_coverage: null };
    expect(() => computeMetrics(unmeasured)).not.toThrow();
    expect(computeMetrics(unmeasured).requirementCoveragePercent).toBe(0);
  });

  it('given overall.total_iterations is null (epic 3 Tier B, "unmeasured"), when scored, then totalIterations stays null, not a fabricated 0', () => {
    const unmeasured: EvalRunResult = { ...sample, overall: { ...sample.overall, total_iterations: null } };
    expect(computeMetrics(unmeasured).totalIterations).toBeNull();
  });
});
