// The single typed representation of docs/vocabulary.md's "DogfoodAdapter" term — matching the
// pattern established for KeystoneAdapter (adapters/keystone/index.ts) so both adapters are
// findable by their vocabulary name, not just by the function they happen to export.
import { loadDogfoodRun } from './load';

export const DogfoodAdapter = {
  loadDogfoodRun,
};
