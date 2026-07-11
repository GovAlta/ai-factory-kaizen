import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { loadDogfoodRun } from './load';

const validRun = {
  harness_id: 'ai-factory-kaizen-dogfood',
  spec_id: 'epic-x',
  timestamp: '2026-01-01T00:00:00.000Z',
  stages: {},
  requirement_coverage: { total: 0, traced_to_code: 0, traced_to_test: 0 },
  overall: {
    build_passed: true,
    security_gate_passed: true,
    deployed: true,
    post_deploy_verified: true,
    cycle_time_s: 10,
    total_iterations: 1,
  },
};

describe('FR-1: DogfoodAdapter loads and validates its own telemetry, no translation needed', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-dogfood-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('given a valid real-shaped telemetry file, when loaded, then it round-trips with no translation', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(resolve(tmp, 'epic-x.json'), JSON.stringify(validRun));
    expect(loadDogfoodRun('epic-x', tmp)).toEqual(validRun);
  });

  it('given a telemetry file that fails schema validation, when loaded, then it fails loud with the specific errors', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(resolve(tmp, 'epic-broken.json'), JSON.stringify({ spec_id: 'epic-broken' }));
    expect(() => loadDogfoodRun('epic-broken', tmp)).toThrow(/harness_id/);
  });

  it('given a missing telemetry file, when loaded, then it fails loud rather than returning a default', () => {
    expect(() => loadDogfoodRun('epic-does-not-exist', tmp)).toThrow();
  });

  it('given an epicId containing a path separator, when loaded, then it is rejected before touching the filesystem', () => {
    expect(() => loadDogfoodRun('../../../etc/passwd', tmp)).toThrow(/not a safe identifier/);
  });
});
