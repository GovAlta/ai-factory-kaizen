import { validateEvalRunResult } from '../../domain/eval-run-result';
import { TIER_B_RECORDS } from './records';

const EXPECTED_HARNESS_IDS = ['goa-software-factory', 'factory-encore', 'AIDE-VELOCITY-HARNESS'];

describe('FR-4: Tier B records, curated from real documented evidence', () => {
  it('given the three named harnesses, when curated, then a record exists for each', () => {
    expect(TIER_B_RECORDS.map((r) => r.result.harness_id).sort()).toEqual(
      [...EXPECTED_HARNESS_IDS].sort(),
    );
  });

  it('given each curated record, when validated, then it passes as a real EvalRunResult — same schema as live-run data', () => {
    for (const record of TIER_B_RECORDS) {
      expect(validateEvalRunResult(record.result)).toEqual({ valid: true, errors: [] });
    }
  });

  it('given this source document only has evidence for the security gate, when a record is inspected, then only overall.security_gate_passed is populated — everything else stays unmeasured, not guessed', () => {
    for (const record of TIER_B_RECORDS) {
      expect(record.result.overall.security_gate_passed).not.toBeNull();
      expect(record.result.requirement_coverage).toBeNull();
      expect(record.result.overall.build_passed).toBeNull();
      expect(record.result.overall.deployed).toBeNull();
      expect(record.result.overall.post_deploy_verified).toBeNull();
      expect(record.result.overall.cycle_time_s).toBeNull();
      expect(record.result.overall.total_iterations).toBeNull();
      expect(record.result.stages).toEqual({});
    }
  });

  it('given every populated field, when inspected, then it carries a quoted evidence citation — auditable back to the source', () => {
    for (const record of TIER_B_RECORDS) {
      expect(record.sourceDoc).toBe('pronghorn-assessment/11-ai-orchestration-comparison.md');
      expect(record.evidence['overall.security_gate_passed']).toBeTruthy();
      expect(record.evidence['overall.security_gate_passed'].length).toBeGreaterThan(20);
    }
  });

  it('given goa-software-factory and factory-encore, when inspected, then security_gate_passed is false — a disconnected/optional gate is not a real gate', () => {
    const goa = TIER_B_RECORDS.find((r) => r.result.harness_id === 'goa-software-factory');
    const encore = TIER_B_RECORDS.find((r) => r.result.harness_id === 'factory-encore');
    expect(goa?.result.overall.security_gate_passed).toBe(false);
    expect(encore?.result.overall.security_gate_passed).toBe(false);
  });

  it('given AIDE-VELOCITY-HARNESS, when inspected, then security_gate_passed is true — a real, mandatory, gate-blocking review', () => {
    const aide = TIER_B_RECORDS.find((r) => r.result.harness_id === 'AIDE-VELOCITY-HARNESS');
    expect(aide?.result.overall.security_gate_passed).toBe(true);
  });
});
