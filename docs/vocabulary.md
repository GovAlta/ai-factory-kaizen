# Vocabulary

Canonical, cumulative domain terms (Article 4 — model-driven design). Extended per epic, never
rewritten. Renaming an established term is a `[NEEDS CLARIFICATION]` in `docs/requirements.md`,
not a silent edit here.

Each term below should, once implemented, correspond to exactly one typed representation in
code (a type, enum, or const) that `docs/requirements.md`'s scenarios and the implementation both
reference structurally — so a mismatch is a compile/lint error, not something `coverage.mjs` has
to detect after the fact (the FAC-S4-019 lesson from `AI-ORCHESTRATION-LAYER-DESIGN.md`).

## Epic 1

- **EvalRunResult** — the closed-schema record of one harness's run against one benchmark spec.
  Fields: `harness_id`, `spec_id`, `timestamp`, `stages`, `requirement_coverage`, `overall`.
- **Contract category** — one of the four fixed keys under `stages`: `build/test`, `security`,
  `deployment`, `post_deploy_verification`. Chosen because each has a real deterministic
  pass/fail; judgment dimensions (e.g. this harness's own `Review`) are never a contract category.
- **StageResult** — the per-category shape: `{ attempted, passed, iterations, duration_s,
  findings: { critical, high, medium, low } }`.
- **RequirementCoverage** — `{ total, traced_to_code, traced_to_test }`. Not a `StageResult`
  shape — coverage has no severity-graded findings, only a count-based trace.
- **OverallResult** — `{ build_passed, security_gate_passed, deployed, post_deploy_verified,
  cycle_time_s, total_iterations }` — the roll-up view of one run.
- **ParThreshold** — a named, numeric pass/fail criterion evaluated against a metric derived
  from an `EvalRunResult` (e.g. `minRequirementCoveragePercent`). Distinct from a blended score:
  each threshold reports its own pass/fail, never averaged together.
- **ScoreReport** — the output of scoring an `EvalRunResult` against a set of `ParThreshold`s: a
  list of `{ threshold, actual, limit, passed }`, one entry per threshold.
- **DerivedMetrics** — the deterministic per-run metrics FR-5 computes from an `EvalRunResult`:
  `{ buildTestPassed, requirementCoveragePercent, securityFindingsBySeverity, cycleTimeSeconds,
  totalIterations, postDeployVerified }`. What `ParThreshold.actual` reads from — a `ScoreReport`
  is always scored against `DerivedMetrics`, never against the raw `EvalRunResult` directly.
