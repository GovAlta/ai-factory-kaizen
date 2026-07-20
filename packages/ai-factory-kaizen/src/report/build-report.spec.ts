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

const retrospectiveRun: EvalRunResult = {
  harness_id: 'goa-software-factory',
  spec_id: 'tier-b-retrospective',
  timestamp: '2026-01-01T00:00:00.000Z',
  stages: {},
  requirement_coverage: null,
  overall: {
    build_passed: null,
    security_gate_passed: false,
    deployed: null,
    post_deploy_verified: null,
    cycle_time_s: null,
    total_iterations: null,
  },
};

describe('FR-10: build a human-readable report per run, distinguishing confidence', () => {
  it('given live runs, when built, then each RunReport has real computed metrics and confidence "live"', () => {
    const report = buildReport(
      [
        { result: run1, confidence: 'live' },
        { result: run2, confidence: 'live' },
      ],
      '2026-01-02T00:00:00.000Z',
    );
    expect(report.generatedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(report.runs).toHaveLength(2);
    expect(report.runs[0]).toEqual({
      harness_id: 'ai-factory-kaizen-dogfood',
      spec_id: 'epic-1-walking-skeleton',
      timestamp: '2026-01-01T00:00:00.000Z',
      confidence: 'live',
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

  it('given a mix of live and retrospective runs, when built, then each keeps its own confidence — never blended or defaulted', () => {
    const report = buildReport(
      [
        { result: run1, confidence: 'live' },
        { result: retrospectiveRun, confidence: 'retrospective' },
      ],
      '2026-01-02T00:00:00.000Z',
    );
    expect(report.runs[0].confidence).toBe('live');
    expect(report.runs[1].confidence).toBe('retrospective');
    expect(report.runs[1].harness_id).toBe('goa-software-factory');
  });

  it('given any report, when built, then it is self-documenting — a legend explains what "live" and "retrospective" mean without requiring the reader to find the source code', () => {
    const report = buildReport([], '2026-01-02T00:00:00.000Z');
    expect(report.confidenceLegend.live).toMatch(/real|observed/i);
    expect(report.confidenceLegend.retrospective).toMatch(/evidence|not.*measur/i);
    // Specifically calls out that a retrospective entry's timestamp isn't a real observation
    // instant — the exact misread a reviewer flagged (all three Tier B entries share one).
    expect(report.confidenceLegend.retrospective).toMatch(/timestamp/i);
  });
});
