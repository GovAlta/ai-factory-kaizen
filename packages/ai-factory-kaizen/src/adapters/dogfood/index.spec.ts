import { DogfoodAdapter } from './index';

describe('FR-1: DogfoodAdapter is a real, findable symbol', () => {
  it('given the adapter, when inspected, then it exposes the loader', () => {
    expect(typeof DogfoodAdapter.loadDogfoodRun).toBe('function');
  });
});
