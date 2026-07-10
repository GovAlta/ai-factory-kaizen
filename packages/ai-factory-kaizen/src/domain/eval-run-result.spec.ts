import { validateEvalRunResult } from './eval-run-result';

const validRecord = {
  harness_id: 'keystone',
  spec_id: 'spec-1',
  timestamp: '2026-01-01T00:00:00.000Z',
  stages: {},
  requirement_coverage: { total: 0, traced_to_code: 0, traced_to_test: 0 },
  overall: {
    build_passed: null,
    security_gate_passed: null,
    deployed: null,
    post_deploy_verified: null,
    cycle_time_s: null,
    total_iterations: 0,
  },
};

describe('FR-1: EvalRunResult schema', () => {
  it('given a minimal valid record, when validated, then it passes', () => {
    const result = validateEvalRunResult(validRecord);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('given a record using an unrecognized stage category name, when validated, then it is rejected regardless of the source harness\'s own stage naming', () => {
    const result = validateEvalRunResult({
      ...validRecord,
      harness_id: 'goa-software-factory',
      stages: {
        phase1: {
          attempted: 1,
          passed: true,
          iterations: 1,
          duration_s: 1,
          findings: { critical: 0, high: 0, medium: 0, low: 0 },
        },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('phase1'))).toBe(true);
  });

  it('given a record missing a required field, when validated, then it is rejected', () => {
    const result = validateEvalRunResult({ spec_id: 'spec-1' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('harness_id'))).toBe(true);
  });

  it('given a non-object value, when validated, then it is rejected without throwing', () => {
    const result = validateEvalRunResult(null);
    expect(result.valid).toBe(false);
  });
});
