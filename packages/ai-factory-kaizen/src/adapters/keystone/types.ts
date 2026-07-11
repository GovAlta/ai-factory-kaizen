// FR-2: raw shapes verified directly against Keystone's own source
// (keystone/.claude/eval/capability/score.mjs, keystone/.claude/gates/coverage/coverage.mjs) —
// not assumed.

export interface KeystoneCapabilityCheck {
  desc: string;
  ok: boolean;
  skipped?: boolean;
}

// score.mjs's scoreTask() pushes checks in a fixed order: verify, coverage, then 0+ structural
// accept checks, then 0-1 behavioral check. That order is Keystone's own invariant, not a
// convention this adapter imposes.
export interface KeystoneCapabilityResult {
  task: string;
  score: number;
  checks: KeystoneCapabilityCheck[];
}

export interface KeystoneCoverageFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  id: string;
  message: string;
}

export interface KeystoneCoverageResult {
  gate: string;
  ok: boolean;
  blocking: boolean;
  counts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
  };
  findings: KeystoneCoverageFinding[];
  // Total FR/NFR count lives only here, as free text ("traced <file> (<N> req)") — Keystone's
  // coverage.mjs has no structured total field. A real limitation of the source data.
  note: string;
  exit: number;
}
