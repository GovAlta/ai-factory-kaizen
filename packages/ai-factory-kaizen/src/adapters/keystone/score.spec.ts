import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { runCapabilityScore } from './score';

describe("FR-2: safely shell out to Keystone's score.mjs", () => {
  let tmp: string;
  let fakeScoreMjs: string;

  beforeEach(() => {
    tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-score-'));
    fakeScoreMjs = resolve(tmp, 'fake-score.mjs');
    // Echoes its own argv back as JSON, so the test asserts exactly what was passed — proves
    // this adapter's argument construction without depending on Keystone's real code.
    // Path is our own mkdtempSync-generated temp dir, not external input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(
      fakeScoreMjs,
      "console.log(JSON.stringify({ task: 'fake', score: 100, checks: [], argv: process.argv.slice(2) }));\n",
    );
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('given a built root and task path, when scored, then it invokes score.mjs with an argument array', () => {
    const result = runCapabilityScore(fakeScoreMjs, '/some/built/root', '/some/task.json') as unknown as {
      argv: string[];
    };
    expect(result.argv).toEqual(['--root', '/some/built/root', '--task', '/some/task.json', '--json']);
  });

  it('given score.mjs exits non-zero, when scored, then the error is reported, not swallowed', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- same temp-dir path.
    writeFileSync(fakeScoreMjs, 'process.exit(1);\n');
    expect(() => runCapabilityScore(fakeScoreMjs, '/some/root', '/some/task.json')).toThrow();
  });

  it('given a root path containing shell metacharacters, when passed, then it is not shell-interpreted (execFile semantics)', () => {
    const dangerousRoot = '/some/root; rm -rf /tmp/evidence';
    const result = runCapabilityScore(fakeScoreMjs, dangerousRoot, '/some/task.json') as unknown as {
      argv: string[];
    };
    // Passed through verbatim as one argument — never split or executed as a second command.
    expect(result.argv).toContain(dangerousRoot);
  });
});
