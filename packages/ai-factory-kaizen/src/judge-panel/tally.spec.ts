import type { JudgeVerdict } from './types';
import { tallyPanel } from './tally';

const passVerdict = (judge: string): JudgeVerdict => ({ judge, verdict: 'pass', evidence: `${judge}: looks fine` });
const failVerdict = (judge: string): JudgeVerdict => ({ judge, verdict: 'fail', evidence: `${judge}: found an issue` });

describe('FR-6: judge-panel tally — deterministic, never a single self-graded verdict', () => {
  it('given a unanimous pass, when tallied, then the consensus is pass', () => {
    const result = tallyPanel([passVerdict('a'), passVerdict('b'), passVerdict('c')]);
    expect(result.consensus).toBe('pass');
    expect(result.verdicts).toHaveLength(3);
  });

  it('given a majority fail, when tallied, then the consensus is fail', () => {
    const result = tallyPanel([passVerdict('a'), failVerdict('b'), failVerdict('c')]);
    expect(result.consensus).toBe('fail');
  });

  it('given a tie, when tallied, then it fails closed — a tie never passes', () => {
    const result = tallyPanel([passVerdict('a'), failVerdict('b')]);
    expect(result.consensus).toBe('fail');
  });

  it('given fewer than two verdicts, when tallied, then it is rejected — a panel of one is not a panel', () => {
    expect(() => tallyPanel([passVerdict('a')])).toThrow(/at least two/i);
    expect(() => tallyPanel([])).toThrow(/at least two/i);
  });

  it('given the same verdicts tallied twice, when compared, then the result is identical — deterministic, no model call inside the tally', () => {
    const verdicts = [passVerdict('a'), passVerdict('b'), failVerdict('c')];
    expect(tallyPanel(verdicts)).toEqual(tallyPanel(verdicts));
  });
});
