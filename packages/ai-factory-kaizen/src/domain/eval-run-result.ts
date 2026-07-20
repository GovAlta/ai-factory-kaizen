// FR-1: a common, harness-agnostic result schema keyed on universal contract categories,
// not per-harness stage names (Keystone's phase1-8, factory-encore's 01-06, etc.).
//
// Review is deliberately not a contract category — it's the one judgment stage kept outside
// this closed schema (see EVALUATION-FRAMEWORK.md's judge-panel containment rule, and
// docs/vocabulary.md).

export type ContractCategory =
  | 'build/test'
  | 'security'
  | 'deployment'
  | 'post_deploy_verification';

const CONTRACT_CATEGORIES: readonly ContractCategory[] = [
  'build/test',
  'security',
  'deployment',
  'post_deploy_verification',
];

export interface Findings {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface StageResult {
  attempted: number;
  passed: boolean;
  iterations: number;
  duration_s: number;
  findings: Findings;
}

export interface RequirementCoverage {
  total: number;
  traced_to_code: number;
  traced_to_test: number;
}

export interface OverallResult {
  build_passed: boolean | null;
  security_gate_passed: boolean | null;
  deployed: boolean | null;
  post_deploy_verified: boolean | null;
  cycle_time_s: number | null;
  // null means "unmeasured," same rationale as requirement_coverage above (epic 3 amendment).
  total_iterations: number | null;
}

export interface EvalRunResult {
  harness_id: string;
  spec_id: string;
  timestamp: string;
  stages: Partial<Record<ContractCategory, StageResult>>;
  // null means "unmeasured" (e.g. a Tier B retrospective harness this document has no coverage
  // evidence for) — distinct from { total: 0, ... }, which means "measured, and zero found"
  // (epic 3's schema amendment; docs/requirements.md).
  requirement_coverage: RequirementCoverage | null;
  overall: OverallResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateEvalRunResult(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ['value is not an object'] };
  }

  const errors: string[] = [];

  // Three fixed fields checked directly, not via a loop over a dynamic key — avoids the
  // bracket-notation object-injection lint warning a loop triggers here, and reads just as
  // clearly for a set this small (Article 5: no abstraction the size doesn't warrant).
  if (typeof value.harness_id !== 'string' || value.harness_id === '') {
    errors.push('missing or invalid required field: harness_id');
  }
  if (typeof value.spec_id !== 'string' || value.spec_id === '') {
    errors.push('missing or invalid required field: spec_id');
  }
  if (typeof value.timestamp !== 'string' || value.timestamp === '') {
    errors.push('missing or invalid required field: timestamp');
  }

  if (!isRecord(value.stages)) {
    errors.push('missing or invalid field: stages');
  } else {
    for (const key of Object.keys(value.stages)) {
      if (!CONTRACT_CATEGORIES.includes(key as ContractCategory)) {
        errors.push(
          `unrecognized stage category: ${key} (expected one of ${CONTRACT_CATEGORIES.join(', ')})`,
        );
      }
    }
  }

  // null is a valid value here ("unmeasured") — reject only if it's neither null nor an object
  // (covers both "absent entirely" and "present as the wrong type").
  if (value.requirement_coverage !== null && !isRecord(value.requirement_coverage)) {
    errors.push('missing or invalid field: requirement_coverage');
  }

  if (!isRecord(value.overall)) {
    errors.push('missing or invalid field: overall');
  }

  return { valid: errors.length === 0, errors };
}
