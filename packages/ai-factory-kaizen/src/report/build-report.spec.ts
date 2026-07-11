import type { EvalRunResult } from '../domain/eval-run-result';
import { buildReport } from './build-report';

const run1: EvalRunResult = {
  harness_id: 'ai-factory-kaizen-dogfood',
  spec_id: 'epic-1-walking-skeleton',
  timestamp: '2026-01-01T00:00:00.000Z',
  stages: {
    'build/test': { attempted: 1, passed: true, iterations: 1, duration_s: 2, findings: { critical: 0, high: 0, medium: 0, low: 0 } },
  },
  requirement_coverage: { total: 3, traced_to_code: 3, traced_to_test: 3 },
  overall: { build_passed: true, security_gate_passed: true, deployed: true, post_deploy_verified: true, cycle_time_s: 14500, total_iterations: 4 },
};

const run2: EvalRunResult = {
  ...run1,
  spec_id: 'epic-2-keystone-adapter',
  overall: { ...run1.overall, cycle_time_s: 1451 },
};

describe('FR-10 (minimal): build a human-readable report per run', () => {
  it('given multiple EvalRunResults, when built, then the report has one RunReport per run with real computed metrics', () => {
    const report = buildReport([run1, run2], '2026-01-02T00:00:00.000Z');
    expect(report.generatedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(report.runs).toHaveLength(2);
    expect(report.runs[0]).toEqual({
      harness_id: 'ai-factory-kaizen-dogfood',
      spec_id: 'epic-1-walking-skeleton',
      timestamp: '2026-01-01T00:00:00.000Z',
      metrics: {
        buildTestPassed: true,
        requirementCoveragePercent: 100,
        securityFindingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        cycleTimeSeconds: 14500,
        totalIterations: 4,
        postDeployVerified: true,
      },
    });
    expect(report.runs[1].metrics.cycleTimeSeconds).toBe(1451);
  });

  it('given zero runs, when built, then it produces a report with an empty runs list, not an error', () => {
    const report = buildReport([], '2026-01-02T00:00:00.000Z');
    expect(report.runs).toEqual([]);
  });
});
