#!/usr/bin/env node
// Deterministic tally over a findings file written by an isolated reviewer subagent.
// The dispatch (Task, diff + criteria only, fresh context) happens in the `ship` skill —
// this script never runs a model itself; it only judges the structured output (Article 6).
//
// Expected findings file shape (.claude/findings/review.json):
// { "criteria": ["vocabulary-drift","unjustified-complexity","report-clarity"],
//   "findings": [ { "criterion": "...", "severity": "CRITICAL|HIGH|MEDIUM|LOW",
//                   "evidence": "...", "file": "..." } ] }
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/project.mjs';

const BLOCKING = new Set(['CRITICAL', 'HIGH']);

export function tally(findingsPath) {
  if (!existsSync(findingsPath)) {
    return { ok: false, blocking: [], note: 'no findings file — reviewer has not run' };
  }
  const { findings = [] } = JSON.parse(readFileSync(findingsPath, 'utf8'));
  const blocking = findings.filter((f) => BLOCKING.has(f.severity));
  return { ok: blocking.length === 0, blocking, advisory: findings.filter((f) => !BLOCKING.has(f.severity)) };
}

function selftest() {
  const tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-review-'));
  const path = resolve(tmp, 'review.json');
  writeFileSync(
    path,
    JSON.stringify({
      findings: [
        { criterion: 'vocabulary-drift', severity: 'HIGH', evidence: 'x calls it config.limits, spec calls it par-threshold', file: 'src/x.ts' },
      ],
    })
  );
  const result = tally(path);
  rmSync(tmp, { recursive: true, force: true });
  if (!result.ok && result.blocking.length === 1) {
    console.log('selftest OK:', result);
    process.exit(0);
  }
  console.error('selftest FAIL:', result);
  process.exit(1);
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const findingsPath = resolve(repoRoot(), '.claude/findings/review.json');
  const result = tally(findingsPath);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
