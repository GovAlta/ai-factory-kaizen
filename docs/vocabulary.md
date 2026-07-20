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

## Epic 2

- **KeystoneCapabilityResult** — the raw, real shape of Keystone's own
  `score.mjs --root <dir> --task <task.json> --json`: `{ task, score, checks: [{ desc, ok,
  skipped? }] }`. Fixed check order (Keystone's `scoreTask()` invariant, not a convention we
  impose): index 0 = verify, index 1 = coverage, then 0+ structural accept checks, then 0-1
  behavioral check.
- **KeystoneCoverageResult** — the raw, real shape of Keystone's own `coverage.mjs --json`:
  `{ gate, ok, blocking, counts: { CRITICAL, HIGH, MEDIUM, LOW, INFO }, findings, note, exit }`.
  Severity-graded findings, not a total/traced count shape — the total FR count is only present
  inside `note` as free text (`"traced <file> (<N> req)"`), a real limitation of the source data,
  not of our mapping.
- **KeystoneAdapter** — FR-2's instrumentation adapter. Scoped to the *scoring* half only
  (`score.mjs` against an already-built app) — the *build* half (fresh harness copy → `/init` →
  `/build` → a builder subagent) inherently needs an agent-in-the-loop and is a separate,
  explicitly-authorized operational step, not code this adapter runs itself.

## Epic 2b

- **DogfoodAdapter** — the identity-case adapter for this harness's own telemetry
  (`.claude/telemetry/<epic-id>.json`), already `EvalRunResult`-shaped (Article 10). A loader,
  not a mapper — there is no format to translate.
- **RunReport** — one run's entry in a `Report`: `{ harness_id, spec_id, timestamp, metrics:
  DerivedMetrics }`.
- **Report** — FR-10's minimal shape: `{ generatedAt, runs: RunReport[] }`. Deliberately does not
  yet persist history across generations — that's FR-9's job, epic 4, not duplicated here.

## Epic 3

- **RequirementCoverage (amended)** — now `{ total, traced_to_code, traced_to_test } | null`.
  `null` means "unmeasured," never conflated with `{ total: 0, ... }` ("measured, zero found").
  `overall.total_iterations` is amended the same way: `number | null`.
- **TierBRecord** — `{ result: EvalRunResult, evidence: Record<string, string>, sourceDoc:
  string }`. The retrospective counterpart to a live adapter's output: `result` uses the exact
  same `EvalRunResult` schema (FR-4's own wording), but every populated field carries a quoted
  citation in `evidence`, keyed by field path (e.g. `"overall.security_gate_passed"`), so a
  disputed value audits back to the source document rather than resting on an unstated judgment
  call.

## Epic 4

- **Confidence** — `'live' | 'retrospective'`, a new field on `RunReport`. `'live'` means real,
  observed telemetry — today that's only this harness's own dogfood runs, but the same value
  will also cover a real Tier A benchmark run once that's integrated (a later epic; not folded in
  yet, so today `'live'` in practice means dogfood only). `'retrospective'` means evidence-based
  (a `TierBRecord`). Directly operationalizes the product brief's own constraint that Tier B
  "should not be represented as equivalent-confidence data to Tier A in any report."
- **History** — the append-only log at `docs/reports/history.json`: an array of past `Report`
  generations, oldest first. Never overwritten, never deduplicated — FR-9's trend-persistence
  mechanism. Distinct from the single-snapshot `Report` file, which stays the latest view. See
  `docs/reports/README.md` for the reader-facing explanation of both files.
- **`Report.confidenceLegend`** — embedded directly in every generated report (not only in this
  doc), so a reader inspecting the JSON artifact cold, without the source tree, can still tell
  `'live'` from `'retrospective'` and knows a retrospective entry's timestamp is a placeholder,
  not a real observation instant (review finding, epic 4).
