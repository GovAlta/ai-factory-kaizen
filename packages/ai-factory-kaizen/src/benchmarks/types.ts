// FR-11: a held-out spec a harness could be asked to build to. sourceDoc is a real citation,
// matching TierBRecord's provenance discipline (epic 3) — a fixture's origin is auditable, not
// asserted. frNfrs/acceptanceCriteria use a TASK- prefix, deliberately distinct from this
// project's own FR-1..FR-11 — these are the benchmark task's requirements, not ai-factory-kaizen's.
export interface BenchmarkSpecFixture {
  id: string;
  title: string;
  sourceDoc: string;
  frNfrs: string[];
  spec: string;
  acceptanceCriteria: string[];
}
