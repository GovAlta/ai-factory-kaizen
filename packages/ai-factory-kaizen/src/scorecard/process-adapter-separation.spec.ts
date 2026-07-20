import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { checkProcessAdapterSeparation } from './process-adapter-separation';

describe('FR-8: process/adapter-separation cleanliness — verified concretely, not claimed', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-separation-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('given every adapter imports EvalRunResult from domain/, when scanned, then it is verified and enforced', () => {
    const adapterDir = resolve(tmp, 'clean-adapter');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- our own mkdtempSync temp dir
    mkdirSync(adapterDir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(
      resolve(adapterDir, 'map.ts'),
      "import type { EvalRunResult } from '../../domain/eval-run-result';\nexport function map(): EvalRunResult { throw new Error('stub'); }\n",
    );
    const result = checkProcessAdapterSeparation(tmp);
    expect(result.verified).toBe(true);
    expect(result.enforced).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('given an adapter locally redefines EvalRunResult instead of importing it, when scanned, then it is not verified — real duplicated substance, not claimed cleanliness', () => {
    const adapterDir = resolve(tmp, 'dirty-adapter');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- our own mkdtempSync temp dir
    mkdirSync(adapterDir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(resolve(adapterDir, 'map.ts'), 'export interface EvalRunResult { harness_id: string }\n');
    const result = checkProcessAdapterSeparation(tmp);
    expect(result.verified).toBe(false);
    expect(result.evidence.some((e) => e.includes('dirty-adapter'))).toBe(true);
  });

  it('given no adapter directories at all, when scanned, then it reports unverified rather than a false positive', () => {
    const result = checkProcessAdapterSeparation(tmp);
    expect(result.verified).toBe(false);
  });

  it('given an adapter imports EvalRunResult as a type-only named import specifier (not a local declaration), when scanned, then it is NOT flagged as a redefinition', () => {
    // Regression: "import { type EvalRunResult } from ..." contains the literal substring
    // "type EvalRunResult", which a naive regex matches the same as a real "type EvalRunResult ="
    // declaration. Caught by running this scan against this project's own real adapters/dogfood/
    // load.ts, which uses exactly this import shape.
    const adapterDir = resolve(tmp, 'real-shape-adapter');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- our own mkdtempSync temp dir
    mkdirSync(adapterDir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(
      resolve(adapterDir, 'load.ts'),
      "import { validateEvalRunResult, type EvalRunResult } from '../../domain/eval-run-result';\nexport function load(): EvalRunResult { throw new Error('stub'); }\n",
    );
    const result = checkProcessAdapterSeparation(tmp);
    expect(result.evidence.some((e) => e.includes('real-shape-adapter') && e.includes('redefines'))).toBe(false);
  });
});
