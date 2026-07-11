import type { KeystoneCapabilityResult, KeystoneCoverageResult } from './types';
import { mapKeystoneResult } from './map';

// Representative of Keystone's real, verified output shape (score.mjs --json) — the actual
// live-run number comes later, as its own explicitly-authorized step (see docs/requirements.md
// FR-2's scope finding).
const capability: KeystoneCapabilityResult = {
  task: 'token-echo',
  score: 100,
  checks: [
    { desc: 'verify (build + tests + golden + compiled rules)', ok: true },
    { desc: 'coverage (FR/NFR traceability + verifier)', ok: true },
    { desc: 'echo route exists', ok: true },
    { desc: 'behavioral: 401 unauthenticated, 200 echo for a valid token, 400 invalid body', ok: true },
  ],
};

const coveragePassing: KeystoneCoverageResult = {
  gate: 'coverage',
  ok: true,
  blocking: false,
  counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
  findings: [],
  note: 'traced app/.ai/requirements.md (3 req)',
  exit: 0,
};

const meta = { timestamp: '2026-01-01T00:00:00.000Z' };

describe("FR-2: map Keystone's real output shapes onto EvalRunResult", () => {
  it('given a passing capability + coverage result, when mapped, then build/test and requirement_coverage reflect them', () => {
    const result = mapKeystoneResult(capability, coveragePassing, meta);
    expect(result.harness_id).toBe('keystone');
    expect(result.spec_id).toBe('token-echo');
    expect(result.timestamp).toBe(meta.timestamp);
    expect(result.stages['build/test']).toEqual({
      attempted: 1,
      passed: true,
      iterations: 1,
      duration_s: 0,
      findings: { critical: 0, high: 0, medium: 0, low: 0 },
    });
    expect(result.requirement_coverage).toEqual({ total: 3, traced_to_code: 3, traced_to_test: 3 });
  });

  it("given eval-capability doesn't exercise security/deployment/post-deploy, when mapped, then those stages are absent, not fabricated", () => {
    const result = mapKeystoneResult(capability, coveragePassing, meta);
    expect(result.stages.security).toBeUndefined();
    expect(result.stages.deployment).toBeUndefined();
    expect(result.stages.post_deploy_verification).toBeUndefined();
  });

  it('given a coverage result with a failed-trace finding, when mapped, then traced_to_test and traced_to_code both subtract it', () => {
    const failing: KeystoneCoverageResult = {
      ...coveragePassing,
      ok: false,
      counts: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, LOW: 0, INFO: 0 },
      findings: [{ severity: 'HIGH', id: 'coverage.missing-trace', message: 'FR-2 has no test' }],
    };
    const result = mapKeystoneResult(capability, failing, meta);
    expect(result.requirement_coverage).toEqual({ total: 3, traced_to_code: 2, traced_to_test: 2 });
  });

  it('given a build/test failure, when mapped, then it is reported, not swallowed', () => {
    const failedBuild: KeystoneCapabilityResult = {
      ...capability,
      checks: [{ ...capability.checks[0], ok: false }, ...capability.checks.slice(1)],
    };
    const result = mapKeystoneResult(failedBuild, coveragePassing, meta);
    expect(result.stages['build/test']?.passed).toBe(false);
  });

  it('given a note that does not match the expected "(N req)" pattern, when mapped, then it fails loud rather than guessing a total', () => {
    const unparseable: KeystoneCoverageResult = { ...coveragePassing, note: 'nothing to trace' };
    expect(() => mapKeystoneResult(capability, unparseable, meta)).toThrow(/total FR count/i);
  });
});
