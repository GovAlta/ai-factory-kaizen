#!/usr/bin/env node
// Thin CLI over telemetry.mjs for the steps ship.mjs drives from bash rather than from a gate
// script with direct import access (start, deployment/post_deploy_verification recording,
// finalize). verify/coverage/security-review call telemetry.mjs's functions in-process instead.
import { startRun, recordStage, finalizeRun } from './telemetry.mjs';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

function bool(v) {
  return v === '1' || v === 'true';
}

const cmd = process.argv[2];
const epic = arg('epic');
if (!epic) {
  console.error('usage: telemetry-cli.mjs <start|record-stage|finalize> --epic <id> ...');
  process.exit(1);
}

if (cmd === 'start') {
  console.log(JSON.stringify(startRun(epic)));
} else if (cmd === 'record-stage') {
  const category = arg('category');
  const passed = bool(arg('passed'));
  const duration_s = Number(arg('duration', '0'));
  const findings = {
    critical: Number(arg('critical', '0')),
    high: Number(arg('high', '0')),
    medium: Number(arg('medium', '0')),
    low: Number(arg('low', '0')),
  };
  console.log(JSON.stringify(recordStage(epic, category, { passed, duration_s, findings })));
} else if (cmd === 'finalize') {
  // Only include a field if its flag was actually passed — an epic that never attempts
  // deployment (e.g. no new runtime surface) should stay null ("not attempted"), not be forced
  // to false ("attempted and failed"). finalizeRun's spread-merge preserves the prior value
  // (null, from emptyRun) for any field omitted here.
  const patch = {};
  for (const [flag, field] of [
    ['build-passed', 'build_passed'],
    ['security-gate-passed', 'security_gate_passed'],
    ['deployed', 'deployed'],
    ['post-deploy-verified', 'post_deploy_verified'],
  ]) {
    const raw = arg(flag);
    if (raw !== undefined) patch[field] = bool(raw);
  }
  console.log(JSON.stringify(finalizeRun(epic, patch)));
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(1);
}
