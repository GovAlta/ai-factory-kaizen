// FR-2: the scoring half of the Keystone adapter — shells out to an already-built harness
// copy's score.mjs via execFile with an argument array, never a template string handed to
// exec/execSync (the exact risk security-review's subprocess-injection check exists for).
//
// The build half (fresh harness copy -> /init -> /build -> a builder subagent) is not this
// module's job — it's a real agent-in-the-loop step, not something a subprocess call can do
// (docs/requirements.md, docs/plan.md, Epic 2).
import { execFileSync } from 'node:child_process';
import type { KeystoneCapabilityResult } from './types';

export function runCapabilityScore(
  scoreMjsPath: string,
  builtRoot: string,
  taskPath: string,
): KeystoneCapabilityResult {
  const stdout = execFileSync(
    'node',
    [scoreMjsPath, '--root', builtRoot, '--task', taskPath, '--json'],
    { encoding: 'utf8' },
  );
  return JSON.parse(stdout) as KeystoneCapabilityResult;
}
