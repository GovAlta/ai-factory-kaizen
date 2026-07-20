import { mapKeystoneResult } from './map';
import { CAPTURED_KEYSTONE_RUNS } from './captured-runs';

describe('FR-2: the real, captured live Keystone run maps cleanly through our own adapter', () => {
  it('given the captured token-echo run, when mapped, then it produces a valid EvalRunResult reflecting the real 80/100 score', () => {
    const run = CAPTURED_KEYSTONE_RUNS[0];
    const result = mapKeystoneResult(run.capability, run.coverage, { timestamp: run.capturedAt });
    expect(result.harness_id).toBe('keystone');
    expect(result.spec_id).toBe('token-echo');
    expect(result.stages['build/test']?.passed).toBe(true);
    // 3 requirements, 2 real findings against them -> 1 traced (the same arithmetic score.mjs's
    // own real output drives, not a synthetic fixture).
    expect(result.requirement_coverage).toEqual({ total: 3, traced_to_code: 1, traced_to_test: 1 });
  });
});
