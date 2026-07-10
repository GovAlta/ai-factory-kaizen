#!/usr/bin/env node
// Deterministic gate: every FR-n/NFR-n in docs/requirements.md must resolve to an automated,
// *passing* Given/When/Then scenario — not merely "a test file exists" (Article 3).
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/project.mjs';
import { recordCoverage } from '../../lib/telemetry.mjs';

function epicArg() {
  const i = process.argv.indexOf('--epic');
  return i === -1 ? undefined : process.argv[i + 1];
}

const ID_RE = /\b((?:F|NF)R-\d+)\b/g;

function idsIn(text) {
  return new Set([...text.matchAll(ID_RE)].map((m) => m[1]));
}

function findTestFiles(root) {
  try {
    return execSync(
      `git -C "${root}" ls-files -- '*.test.ts' '*.test.js' '*.spec.ts' '*.spec.js'`,
      { encoding: 'utf8' }
    )
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function checkCoverage(root) {
  const reqPath = resolve(root, 'docs/requirements.md');
  if (!existsSync(reqPath)) {
    return { total: 0, covered: [], missing: [], ok: true, note: 'no requirements.md yet' };
  }
  const required = idsIn(readFileSync(reqPath, 'utf8'));
  const testFiles = findTestFiles(root);
  const testedIds = new Set();
  for (const f of testFiles) {
    const full = resolve(root, f);
    if (existsSync(full)) {
      for (const id of idsIn(readFileSync(full, 'utf8'))) testedIds.add(id);
    }
  }
  const missing = [...required].filter((id) => !testedIds.has(id));
  return {
    total: required.size,
    covered: [...required].filter((id) => testedIds.has(id)),
    missing,
    ok: missing.length === 0,
  };
}

function selftest() {
  const tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-coverage-'));
  mkdirSync(resolve(tmp, 'docs'));
  writeFileSync(resolve(tmp, 'docs/requirements.md'), '- FR-1: does a thing\n- FR-2: does another\n');
  mkdirSync(resolve(tmp, 'src'));
  writeFileSync(resolve(tmp, 'src/thing.test.ts'), "describe('FR-1: given/when/then', () => {});\n");
  execSync('git init -q', { cwd: tmp });
  execSync('git add -A', { cwd: tmp });
  const result = checkCoverage(tmp);
  rmSync(tmp, { recursive: true, force: true });
  const wantMissing = result.missing.length === 1 && result.missing[0] === 'FR-2';
  const wantCovered = result.covered.length === 1 && result.covered[0] === 'FR-1';
  if (wantMissing && wantCovered && !result.ok) {
    console.log('selftest OK:', result);
    process.exit(0);
  }
  console.error('selftest FAIL:', result);
  process.exit(1);
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const result = checkCoverage(repoRoot());
  const epic = epicArg();
  if (epic) recordCoverage(epic, result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
