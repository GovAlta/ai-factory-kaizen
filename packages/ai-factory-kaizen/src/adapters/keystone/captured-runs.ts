// A real, live Tier A capture — not evidence-based like TierBRecord, an actual execution:
// `/eval-capability token-echo` run against a fresh Keystone harness copy, scored by Keystone's
// own score.mjs/coverage.mjs. The build half (a builder subagent implementing the held-out spec)
// is not reproducible by re-running this file — it's a point-in-time record of what happened,
// the same "raw data + our own adapter does the mapping" shape TierBRecord uses, just from a
// real run instead of documented evidence.
import type { KeystoneCapabilityResult, KeystoneCoverageResult } from './types';

export interface CapturedKeystoneRun {
  capturedAt: string;
  capability: KeystoneCapabilityResult;
  coverage: KeystoneCoverageResult;
  note: string;
}

export const CAPTURED_KEYSTONE_RUNS: CapturedKeystoneRun[] = [
  {
    capturedAt: '2026-07-20T15:48:23.512Z',
    note:
      'Live /eval-capability token-echo run against a fresh Keystone harness copy. The scaffold ' +
      'already ships an echo route for the service variant (matching Keystone\'s own prior ' +
      'recorded result for this task); the builder subagent added real integration tests. Score ' +
      '80/100: the held-out behavioral test passed (401/200/400 proven by execution), but ' +
      'coverage failed on two real findings — coverage.verifier-not-run (the independent verifier ' +
      'was never dispatched; eval-capability\'s own documented 6 steps do not mention this as a ' +
      'prerequisite, so this is a genuine finding, not a mistake in following the skill) and ' +
      'coverage.orphan-test (a stray FR-2 reference not in this run\'s 1-FR spec).',
    capability: {
      task: 'token-echo',
      score: 80,
      checks: [
        { desc: 'verify (build + tests + golden + compiled rules)', ok: true },
        { desc: 'coverage (FR/NFR traceability + verifier)', ok: false },
        { desc: 'echo route exists', ok: true },
        { desc: 'echo route is mounted in server.ts', ok: true },
        {
          desc: 'behavioral: real bearer-guarded HTTP path with no DB: 401 unauthenticated, 200 echo for a valid token, 400 on an invalid body',
          ok: true,
        },
      ],
    },
    coverage: {
      gate: 'coverage',
      ok: false,
      blocking: true,
      counts: { CRITICAL: 0, HIGH: 1, MEDIUM: 1, LOW: 0, INFO: 0 },
      findings: [
        { severity: 'MEDIUM', id: 'coverage.orphan-test', message: 'tests reference FR-2, which is not in the spec' },
        { severity: 'HIGH', id: 'coverage.verifier-not-run', message: 'the independent verifier has not run' },
      ],
      note: 'traced spec app/.ai/requirements.md (3 req) (references only — production-path proof is the verifier\'s job)',
      exit: 1,
    },
  },
];
