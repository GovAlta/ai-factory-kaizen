import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const CLAUDE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EPICS_PATH = resolve(CLAUDE_DIR, 'epics.json');

export function readEpics(path = EPICS_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// The Nx project name for the scaffolded service. Set once epic 1's Spec step
// names it (see .claude/epics.json's "project" field) — gates fail with an
// actionable message rather than guessing if it isn't set yet.
export function getProjectName(path = EPICS_PATH) {
  const { project } = readEpics(path);
  if (!project) {
    throw new Error(
      'No project name set in .claude/epics.json ("project"). Set it once the service is ' +
        'scaffolded (epic 1, Spec step) before running gates.'
    );
  }
  return project;
}

export function repoRoot() {
  return resolve(CLAUDE_DIR, '..');
}
