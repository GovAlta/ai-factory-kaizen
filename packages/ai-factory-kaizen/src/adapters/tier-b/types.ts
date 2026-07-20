// FR-4: the retrospective counterpart to a live adapter. `result` uses the exact same
// EvalRunResult schema a live adapter would produce (FR-4's own wording) — but every field it
// populates carries a quoted citation in `evidence`, keyed by field path, so a disputed value
// audits back to the source document rather than resting on an unstated judgment call.
import type { EvalRunResult } from '../../domain/eval-run-result';

export interface TierBRecord {
  result: EvalRunResult;
  evidence: Record<string, string>;
  sourceDoc: string;
}
