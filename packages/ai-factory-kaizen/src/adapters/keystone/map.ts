// FR-2: map Keystone's real, native output shapes onto EvalRunResult.
import type { EvalRunResult } from '../../domain/eval-run-result';
import type { KeystoneCapabilityResult, KeystoneCoverageResult } from './types';

export interface MapMeta {
  timestamp: string;
}

const NOTE_TOTAL_RE = /\((\d+)\s+req\)/;

function extractTotal(note: string): number {
  const match = NOTE_TOTAL_RE.exec(note);
  if (!match) {
    // Fail loud rather than guess a number — same "SKIPPED LOUD" discipline Keystone's own
    // behavioral-test convention uses, applied to a value we genuinely can't derive.
    throw new Error(
      `mapKeystoneResult: could not extract total FR count from coverage note: "${note}"`,
    );
  }
  return Number(match[1]);
}

export function mapKeystoneResult(
  capability: KeystoneCapabilityResult,
  coverage: KeystoneCoverageResult,
  meta: MapMeta,
): EvalRunResult {
  // Index 0 is always the verify check — score.mjs's scoreTask() writes checks in a fixed
  // order (verify, then coverage, then accept/behavior), Keystone's own invariant, not a
  // convention this adapter imposes (docs/vocabulary.md, Epic 2). A literal index, not a
  // variable, avoids the object-injection lint warning a named constant triggered here.
  const [verifyCheck] = capability.checks;

  const total = extractTotal(coverage.note);
  // Keystone's coverage gate reports "no test references this requirement" as one finding per
  // requirement, but never distinguishes "has code, no test" from "has neither" — so
  // traced_to_code and traced_to_test are necessarily equal here, not independently derivable
  // from this source (a limitation of the source data, documented in docs/vocabulary.md).
  const tracedCount = total - coverage.findings.length;

  return {
    harness_id: 'keystone',
    spec_id: capability.task,
    timestamp: meta.timestamp,
    stages: {
      'build/test': {
        attempted: 1,
        passed: verifyCheck.ok,
        iterations: 1,
        // score.mjs reports no timing and no severity-graded findings for verify — both are
        // real absences in the source data, not this adapter's omission.
        duration_s: 0,
        findings: { critical: 0, high: 0, medium: 0, low: 0 },
      },
      // security, deployment, and post_deploy_verification are deliberately absent:
      // eval-capability doesn't exercise them at all (docs/requirements.md FR-2).
    },
    requirement_coverage: {
      total,
      traced_to_code: tracedCount,
      traced_to_test: tracedCount,
    },
    overall: {
      build_passed: verifyCheck.ok,
      security_gate_passed: null,
      deployed: null,
      post_deploy_verified: null,
      cycle_time_s: null,
      total_iterations: 1,
    },
  };
}
