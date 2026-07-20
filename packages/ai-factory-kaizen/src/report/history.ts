// FR-9: persist EvalRunResult/report data over time, versioned, for trend comparison across
// runs — an append-only log, never an overwritten snapshot. No deduplication: "nothing changed
// between these two generations" is itself a real, informative trend signal (docs/requirements.md).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { Report } from './build-report';

// historyPath is a caller-supplied path by design (this module's whole contract is "read/write
// the history file at the path you give me") — unlike DogfoodAdapter's epicId, there is no
// narrower "identifier, not a path" shape to validate against here.
export function readHistory(historyPath: string): Report[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(historyPath)) return [];
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return JSON.parse(readFileSync(historyPath, 'utf8')) as Report[];
}

export function appendToHistory(report: Report, historyPath: string): Report[] {
  const history = [...readHistory(historyPath), report];
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
  return history;
}
