// FR-6: the closed half of the judge panel — deterministic, no model call inside the tally
// itself. Producing a JudgeVerdict (the open, LLM-based half) is the caller's concern.
import type { JudgeVerdict, PanelResult } from './types';

export function tallyPanel(verdicts: JudgeVerdict[]): PanelResult {
  if (verdicts.length < 2) {
    throw new Error(
      `tallyPanel: requires at least two independent verdicts, got ${verdicts.length} — a panel of one is not a panel`,
    );
  }

  const passCount = verdicts.filter((v) => v.verdict === 'pass').length;
  // A tie fails closed — never passes on a tie (docs/requirements.md, Epic 5).
  const consensus = passCount > verdicts.length / 2 ? 'pass' : 'fail';

  return { consensus, verdicts };
}
