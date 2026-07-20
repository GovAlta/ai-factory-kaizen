// FR-4: hand-curated, not parsed — turning narrative evidence into structured data is a
// one-time interpretive act, not a repeatable algorithm (unlike the Keystone adapter, which
// parses real machine-generated JSON). Source: pronghorn-assessment/11-ai-orchestration-
// comparison.md, read in full for this epic. Only overall.security_gate_passed has real
// evidence in that document — everything else this document doesn't speak to stays null.
import type { EvalRunResult } from '../../domain/eval-run-result';
import type { TierBRecord } from './types';

const SOURCE_DOC = 'pronghorn-assessment/11-ai-orchestration-comparison.md';

function unmeasuredResult(harnessId: string, securityGatePassed: boolean): EvalRunResult {
  return {
    harness_id: harnessId,
    spec_id: 'tier-b-retrospective',
    timestamp: '2026-01-01T00:00:00.000Z',
    stages: {},
    requirement_coverage: null,
    overall: {
      build_passed: null,
      security_gate_passed: securityGatePassed,
      deployed: null,
      post_deploy_verified: null,
      cycle_time_s: null,
      total_iterations: null,
    },
  };
}

export const TIER_B_RECORDS: TierBRecord[] = [
  {
    sourceDoc: SOURCE_DOC,
    result: unmeasuredResult('goa-software-factory', false),
    evidence: {
      'overall.security_gate_passed':
        'Cross-cutting comparison table, "Security review" row: "Aspirational only — Blue/Red ' +
        'disconnected, human-invoked, one-shot, never wired into the pipeline." Corroborated in ' +
        'the goa-software-factory section: "Security Validation... soft gate only — its ' +
        'validator ALWAYS exits 0... FAILs surface as ADVISORY severity, not as a build blocker."',
    },
  },
  {
    sourceDoc: SOURCE_DOC,
    result: unmeasuredResult('factory-encore', false),
    evidence: {
      'overall.security_gate_passed':
        'Cross-cutting comparison table, "Security review" row: "Downgraded further — no ' +
        'Blue/Red at all, 26 grep-able invariants + optional reviewer." Corroborated in the ' +
        'factory-encore section: "No Blue/Red split exists at all... an optional reviewer agent ' +
        '(Phase G, explicitly marked optional)."',
    },
  },
  {
    sourceDoc: SOURCE_DOC,
    result: unmeasuredResult('AIDE-VELOCITY-HARNESS', true),
    evidence: {
      'overall.security_gate_passed':
        'Cross-cutting comparison table, "Security review" row: "Real, mandatory, gate-blocking ' +
        '/blueteam+/redteam at v5 gate (14 ASVS chapters + 57 CAS rules)." Corroborated in the ' +
        'AIDE-VELOCITY-HARNESS section: "/blueteam walks all 14 ASVS Level 2 chapters plus 57 GoA ' +
        'CAS compliance rules... both are invoked as part of v5-development\'s mandatory gate — ' +
        'genuinely wired in, unlike goa-software-factory\'s disconnected version."',
    },
  },
];
