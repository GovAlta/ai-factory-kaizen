// The single typed representation of docs/vocabulary.md's "KeystoneAdapter" term — grouping
// the scoring wrapper and the mapper as one named symbol, so the canonical term has a real
// compile-checkable home rather than two unrelated free-standing functions.
import { runCapabilityScore } from './score';
import { mapKeystoneResult } from './map';

export const KeystoneAdapter = {
  runCapabilityScore,
  mapKeystoneResult,
};

export type { KeystoneCapabilityResult, KeystoneCoverageResult, KeystoneCoverageFinding, KeystoneCapabilityCheck } from './types';
export type { MapMeta } from './map';
