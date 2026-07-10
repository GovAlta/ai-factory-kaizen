// Records this harness's own epic runs in exactly the EvalRunResult shape from
// EVALUATION-FRAMEWORK.md, so once epic 1 builds that schema, every epic already run is real
// test data for the scoring engine — not a synthetic fixture. `harness_id` distinguishes this
// dogfood harness's own runs from the harnesses it will later evaluate (Keystone, etc.).
//
// Deliberately mirrors the schema's own boundary: Review is the one judgment stage kept outside
// the closed schema (EVALUATION-FRAMEWORK.md's contained judge-panel exception) — it is never
// recorded here either. Only build/test, security, deployment, and post_deploy_verification go
// in `stages`; requirement_coverage gets its own dedicated shape, same as the source schema.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot } from './project.mjs';

const HARNESS_ID = 'ai-factory-kaizen-dogfood';

function telemetryDir() {
  return resolve(repoRoot(), '.claude/telemetry');
}

function pathFor(epicId) {
  return resolve(telemetryDir(), `${epicId}.json`);
}

function emptyRun(epicId) {
  return {
    harness_id: HARNESS_ID,
    spec_id: epicId,
    timestamp: null,
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
}

function write(epicId, run) {
  mkdirSync(telemetryDir(), { recursive: true });
  writeFileSync(pathFor(epicId), JSON.stringify(run, null, 2));
  return run;
}

export function readRun(epicId) {
  const p = pathFor(epicId);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : emptyRun(epicId);
}

export function startRun(epicId, timestamp = new Date().toISOString()) {
  const run = emptyRun(epicId);
  run.timestamp = timestamp;
  return write(epicId, run);
}

// category is one of: 'build/test' | 'security' | 'deployment' | 'post_deploy_verification'
export function recordStage(epicId, category, { passed, duration_s, findings }) {
  const run = readRun(epicId);
  const prev = run.stages[category];
  run.stages[category] = {
    attempted: (prev?.attempted ?? 0) + 1,
    passed,
    iterations: (prev?.iterations ?? 0) + 1,
    duration_s,
    findings: findings ?? { critical: 0, high: 0, medium: 0, low: 0 },
  };
  run.overall.total_iterations += 1;
  return write(epicId, run);
}

export function recordCoverage(epicId, coverageResult) {
  const run = readRun(epicId);
  run.requirement_coverage = {
    total: coverageResult.total,
    traced_to_code: coverageResult.covered.length,
    traced_to_test: coverageResult.covered.length,
  };
  return write(epicId, run);
}

export function finalizeRun(epicId, overallPatch) {
  const run = readRun(epicId);
  const startedMs = run.timestamp ? Date.parse(run.timestamp) : NaN;
  const cycle_time_s = Number.isNaN(startedMs) ? null : Math.round((Date.now() - startedMs) / 1000);
  run.overall = { ...run.overall, cycle_time_s, ...overallPatch };
  return write(epicId, run);
}
