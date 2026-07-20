// FR-5: deterministic metrics derived from an EvalRunResult — same input always produces the
// same output, no randomness or hidden state.
import type { EvalRunResult, Findings } from '../domain/eval-run-result';

export interface DerivedMetrics {
  buildTestPassed: boolean;
  // 0 when requirement_coverage is null ("unmeasured") — a documented simplification, not a
  // fabricated positive claim: 0% conservatively fails a minimum-coverage par threshold rather
  // than passing one, the same fail-closed direction as an unmet threshold would take anyway.
  // Revisit if epic 6 needs a real "not applicable" distinct from "measured at zero" here.
  requirementCoveragePercent: number;
  securityFindingsBySeverity: Findings;
  cycleTimeSeconds: number | null;
  // null propagates through, unlike requirementCoveragePercent above — 0 iterations would read
  // as a false positive claim ("no rework happened"), which null does not (epic 3 amendment).
  totalIterations: number | null;
  postDeployVerified: boolean | null;
}

const EMPTY_FINDINGS: Findings = { critical: 0, high: 0, medium: 0, low: 0 };

export function computeMetrics(result: EvalRunResult): DerivedMetrics {
  const coverage = result.requirement_coverage;
  // Coverage percent is measured against traced_to_test, not traced_to_code — a requirement
  // traced to code but never to a passing test doesn't meet this project's own coverage bar
  // (docs/constitution.md Article 3).
  const requirementCoveragePercent =
    coverage === null || coverage.total === 0 ? 0 : Math.round((coverage.traced_to_test / coverage.total) * 100);

  return {
    buildTestPassed: result.stages['build/test']?.passed ?? false,
    requirementCoveragePercent,
    securityFindingsBySeverity: result.stages.security?.findings ?? EMPTY_FINDINGS,
    cycleTimeSeconds: result.overall.cycle_time_s,
    totalIterations: result.overall.total_iterations,
    postDeployVerified: result.overall.post_deploy_verified,
  };
}
