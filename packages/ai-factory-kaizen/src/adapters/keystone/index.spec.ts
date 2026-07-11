import { KeystoneAdapter } from './index';

describe('FR-2: KeystoneAdapter is a single, real symbol, not two unrelated functions', () => {
  it('given the adapter, when inspected, then it exposes both the scorer and the mapper', () => {
    expect(typeof KeystoneAdapter.runCapabilityScore).toBe('function');
    expect(typeof KeystoneAdapter.mapKeystoneResult).toBe('function');
  });
});
