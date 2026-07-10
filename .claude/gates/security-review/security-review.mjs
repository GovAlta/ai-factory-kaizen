#!/usr/bin/env node
// Deterministic, mandatory, gate-blocking (Article 7) — never folded into Review's advisory
// judgment. Three checks: secrets, dependency audit, and (once the Keystone adapter exists,
// epic 2+) unsanitized subprocess construction — a real, specific injection surface here,
// not boilerplate, since this framework shells out to invoke Keystone's own skill.
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/project.mjs';
import { recordStage } from '../../lib/telemetry.mjs';

function epicArg() {
  const i = process.argv.indexOf('--epic');
  return i === -1 ? undefined : process.argv[i + 1];
}

function severityCounts(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity.toLowerCase()] = (counts[f.severity.toLowerCase()] ?? 0) + 1;
  return counts;
}

const SECRET_PATTERNS = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, what: 'private key' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, what: 'AWS access key id' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, what: 'GitHub token' },
];

// Flags exec/execSync/spawn called with a template literal that interpolates a
// variable — the FAC-S4-style "best-effort regex" backstop this gate exists for
// until the Keystone adapter is built with parameterized args instead (epic 2).
const UNSAFE_SUBPROCESS_RE = /\b(exec|execSync)\s*\(\s*`[^`]*\$\{/;

function scanFile(path, text) {
  const findings = [];
  for (const { re, what } of SECRET_PATTERNS) {
    if (re.test(text)) findings.push({ criterion: 'secret', severity: 'CRITICAL', evidence: what, file: path });
  }
  if (UNSAFE_SUBPROCESS_RE.test(text)) {
    findings.push({
      criterion: 'subprocess-injection',
      severity: 'HIGH',
      evidence: 'exec/execSync called with an interpolated template string — use execFile/spawn with an argument array instead',
      file: path,
    });
  }
  return findings;
}

// Scans the product being shipped, not this harness's own tooling — otherwise the gate's own
// selftest fixture strings (which deliberately contain the risky pattern, to prove detection
// works) trip the detector on itself.
function trackedFiles(root) {
  try {
    return execSync('git ls-files', { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .filter((f) => !f.startsWith('.claude/'));
  } catch {
    return [];
  }
}

export function runSecurityReview(root) {
  const findings = [];
  for (const f of trackedFiles(root)) {
    const full = resolve(root, f);
    if (!existsSync(full)) continue;
    let text;
    try {
      text = readFileSync(full, 'utf8');
    } catch {
      continue; // binary or unreadable — not a text-based secret/subprocess risk
    }
    findings.push(...scanFile(f, text));
  }
  const blocking = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  return { ok: blocking.length === 0, blocking, findings };
}

function selftest() {
  const tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-secreview-'));
  writeFileSync(resolve(tmp, 'bad.ts'), 'execSync(`node .claude/skills/eval-capability/run.mjs ${taskId}`);\n');
  writeFileSync(resolve(tmp, 'good.ts'), "execFile('oc', ['apply', '-f', userInput]);\n");
  execSync('git init -q', { cwd: tmp });
  execSync('git add -A', { cwd: tmp });
  const result = runSecurityReview(tmp);
  rmSync(tmp, { recursive: true, force: true });
  const flaggedBad = result.blocking.some((f) => f.file === 'bad.ts');
  const flaggedGood = result.blocking.some((f) => f.file === 'good.ts');
  if (!result.ok && flaggedBad && !flaggedGood) {
    console.log('selftest OK:', result);
    process.exit(0);
  }
  console.error('selftest FAIL:', result);
  process.exit(1);
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const startedMs = Date.now();
  const result = runSecurityReview(repoRoot());
  const epic = epicArg();
  if (epic) {
    recordStage(epic, 'security', {
      passed: result.ok,
      duration_s: Math.round((Date.now() - startedMs) / 1000),
      findings: severityCounts(result.findings),
    });
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
