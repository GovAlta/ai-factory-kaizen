// FR-6: provider-agnostic by design — a JudgeVerdict doesn't pin a model/vendor. Only the tally
// is closed (deterministic); producing a verdict is the caller's concern.
export interface JudgeVerdict {
  judge: string;
  verdict: 'pass' | 'fail';
  evidence: string;
}

export interface PanelResult {
  consensus: 'pass' | 'fail';
  verdicts: JudgeVerdict[];
}
