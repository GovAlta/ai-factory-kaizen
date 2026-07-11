// FR-1: the identity-case adapter. This harness's own telemetry is already EvalRunResult-shaped
// (constitution.md Article 10), so there's no format to translate — only load and validate.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateEvalRunResult, type EvalRunResult } from '../../domain/eval-run-result';

// Matches this repo's own epic id convention (epics.json). Rejecting anything else closes a
// real path-traversal risk before it reaches a filesystem call, not just a lint-noise dodge.
const SAFE_EPIC_ID_RE = /^[a-z0-9-]+$/;

export function loadDogfoodRun(epicId: string, telemetryDir: string): EvalRunResult {
  if (!SAFE_EPIC_ID_RE.test(epicId)) {
    throw new Error(`loadDogfoodRun: epicId "${epicId}" is not a safe identifier`);
  }
  const filePath = resolve(telemetryDir, `${epicId}.json`);
  // epicId is validated against SAFE_EPIC_ID_RE above; it cannot contain a path separator.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));

  const { valid, errors } = validateEvalRunResult(raw);
  if (!valid) {
    // Fail loud rather than return a partial/best-effort result — same discipline as the
    // Keystone adapter's unparseable-note case.
    throw new Error(`loadDogfoodRun: ${epicId} failed EvalRunResult validation: ${errors.join('; ')}`);
  }

  return raw as EvalRunResult;
}
