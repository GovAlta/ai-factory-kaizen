// Run from the repo root: `npx tsx packages/ai-factory-kaizen/src/report/generate-dogfood-report.ts`
// A small runnable script, not an Nx target — no CI/scheduling need yet (docs/plan.md, Epic 2b).
// Epic 4: also includes the Tier B records (confidence: 'retrospective') alongside dogfood
// telemetry (confidence: 'live'), and appends the generation to history.json (FR-9).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadDogfoodRun } from '../adapters/dogfood/load';
import { TIER_B_RECORDS } from '../adapters/tier-b/records';
import { buildReport, type RunInput } from './build-report';
import { appendToHistory } from './history';

const TELEMETRY_DIR = resolve(process.cwd(), '.claude/telemetry');
const OUTPUT_PATH = resolve(process.cwd(), 'docs/reports/dogfood-self-eval.json');
const HISTORY_PATH = resolve(process.cwd(), 'docs/reports/history.json');

// Every currently-shipped epic — extended as later epics ship (docs/plan.md). epic-6 itself is
// omitted: its own telemetry isn't finalized until after this same ship run completes.
const SHIPPED_EPIC_IDS = [
  'epic-1-walking-skeleton',
  'epic-2-keystone-adapter',
  'epic-2b-dogfood-self-eval',
  'epic-3-tier-b-adapter',
  'epic-4-report-and-trend',
  'epic-5-judge-panel-and-scorecard',
];

function main() {
  const liveInputs: RunInput[] = SHIPPED_EPIC_IDS.map((id) => ({
    result: loadDogfoodRun(id, TELEMETRY_DIR),
    confidence: 'live',
  }));
  const retrospectiveInputs: RunInput[] = TIER_B_RECORDS.map((record) => ({
    result: record.result,
    confidence: 'retrospective',
  }));

  const report = buildReport([...liveInputs, ...retrospectiveInputs], new Date().toISOString());

  // OUTPUT_PATH/HISTORY_PATH are fixed module-level constants derived from process.cwd(), not
  // external input — the false-positive case this lint rule is known for.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  mkdirSync(resolve(OUTPUT_PATH, '..'), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_PATH}`);

  appendToHistory(report, HISTORY_PATH);
  console.log(`Appended to ${HISTORY_PATH}`);
}

main();
