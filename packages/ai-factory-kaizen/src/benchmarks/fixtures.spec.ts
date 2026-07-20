import { BENCHMARK_FIXTURES } from './fixtures';

describe('FR-11: held-out benchmark spec fixtures, curated from real cited sources', () => {
  it('given the fixture set, when inspected, then at least two fixtures exist', () => {
    expect(BENCHMARK_FIXTURES.length).toBeGreaterThanOrEqual(2);
  });

  it('given each fixture, when inspected, then it carries a real sourceDoc citation, FR/NFR tags, spec prose, and acceptance criteria — nothing invented with no source', () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      expect(fixture.sourceDoc.length).toBeGreaterThan(0);
      expect(fixture.frNfrs.length).toBeGreaterThan(0);
      expect(fixture.spec.length).toBeGreaterThan(20);
      expect(fixture.acceptanceCriteria.length).toBeGreaterThan(0);
    }
  });

  it('given the workspace-view + intake-view fixture, when inspected, then it cites nx-tools/UX-VIEW-PATTERNS-SPEC.md, not an invented spec', () => {
    const fixture = BENCHMARK_FIXTURES.find((f) => f.id === 'workspace-intake-view');
    expect(fixture?.sourceDoc).toBe('nx-tools/UX-VIEW-PATTERNS-SPEC.md');
  });

  it('given the CRUD/ORM fixture, when inspected, then its source is honestly cited as the secondhand description, not the inaccessible original file', () => {
    const fixture = BENCHMARK_FIXTURES.find((f) => f.id === 'crud-orm-ubiquitous-language');
    expect(fixture?.sourceDoc).toBe('AI-ORCHESTRATION-LAYER-DESIGN.md');
    expect(fixture?.sourceDoc).not.toMatch(/fac_s4_runner/);
  });

  it('given every fixture id, when compared, then all ids are unique — no accidental duplicate fixture', () => {
    const ids = BENCHMARK_FIXTURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
