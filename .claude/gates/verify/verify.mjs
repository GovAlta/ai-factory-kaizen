#!/usr/bin/env node
// Deterministic gate: build + test. Exit code is the verdict — never a model's own claim.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { getProjectName, repoRoot } from '../../lib/project.mjs';

function run(project, target) {
  const result = spawnSync('npx', ['nx', 'run', `${project}:${target}`], {
    cwd: repoRoot(),
    stdio: 'inherit',
  });
  return result.status === 0;
}

function selftest() {
  // Isolated fixtures, not the live epics.json — proves the gate's own logic
  // (resolve-or-fail-closed on the project name) independent of harness state.
  const tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-verify-'));
  const unset = resolve(tmp, 'unset.json');
  const set = resolve(tmp, 'set.json');
  writeFileSync(unset, JSON.stringify({ project: null }));
  writeFileSync(set, JSON.stringify({ project: 'demo-project' }));

  let ok = true;
  try {
    getProjectName(unset);
    console.error('selftest FAIL: expected getProjectName() to throw with no project set');
    ok = false;
  } catch {
    /* expected */
  }
  if (getProjectName(set) !== 'demo-project') {
    console.error('selftest FAIL: expected getProjectName() to resolve a set project name');
    ok = false;
  }
  rmSync(tmp, { recursive: true, force: true });
  if (ok) console.log('selftest OK');
  process.exit(ok ? 0 : 1);
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const project = getProjectName();
  const buildOk = run(project, 'build');
  const testOk = buildOk && run(project, 'test');
  if (!buildOk || !testOk) {
    console.error(`verify: FAIL (build=${buildOk}, test=${testOk})`);
    process.exit(1);
  }
  console.log('verify: PASS');
}
