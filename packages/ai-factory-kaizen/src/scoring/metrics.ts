// FR-5: deterministic metrics derived from an EvalRunResult — same input always produces the
// same output, no randomness or hidden state.
import type { EvalRunResult, Findings } from '../domain/eval-run-result';

export interface DerivedMetrics {
  buildTestPassed: boolean;
  requirementCoveragePercent: number;
  securityFindingsBySeverity: Findings;
  cycleTimeSeconds: number | null;
  totalIterations: number;
  postDeployVerified: boolean | null;
}

const EMPTY_FINDINGS: Findings = { critical: 0, high: 0, medium: 0, low: 0 };

export function computeMetrics(result: EvalRunResult): DerivedMetrics {
  const { total, traced_to_test } = result.requirement_coverage;
  // Coverage percent is measured against traced_to_test, not traced_to_code — a requirement
  // traced to code but never to a passing test doesn't meet this project's own coverage bar
  // (docs/constitution.md Article 3).
  const requirementCoveragePercent = total === 0 ? 0 : Math.round((traced_to_test / total) * 100);

  return {
    buildTestPassed: result.stages['build/test']?.passed ?? false,
    requirementCoveragePercent,
    securityFindingsBySeverity: result.stages.security?.findings ?? EMPTY_FINDINGS,
    cycleTimeSeconds: result.overall.cycle_time_s,
    totalIterations: result.overall.total_iterations,
    postDeployVerified: result.overall.post_deploy_verified,
  };
}
