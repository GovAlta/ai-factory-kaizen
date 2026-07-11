// Run from the repo root: `npx tsx packages/ai-factory-kaizen/src/report/generate-dogfood-report.ts`
// A small runnable script, not an Nx target — no CI/scheduling need yet (docs/plan.md, Epic 2b).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadDogfoodRun } from '../adapters/dogfood/load';
import { buildReport } from './build-report';

const TELEMETRY_DIR = resolve(process.cwd(), '.claude/telemetry');
const OUTPUT_PATH = resolve(process.cwd(), 'docs/reports/dogfood-self-eval.json');

// Every currently-shipped epic — extended as later epics ship (docs/plan.md).
const SHIPPED_EPIC_IDS = ['epic-1-walking-skeleton', 'epic-2-keystone-adapter'];

function main() {
  const runs = SHIPPED_EPIC_IDS.map((id) => loadDogfoodRun(id, TELEMETRY_DIR));
  const report = buildReport(runs, new Date().toISOString());
  // OUTPUT_PATH is a fixed module-level constant derived from process.cwd(), not external
  // input — both calls below are the false-positive case this lint rule is known for.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  mkdirSync(resolve(OUTPUT_PATH, '..'), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
