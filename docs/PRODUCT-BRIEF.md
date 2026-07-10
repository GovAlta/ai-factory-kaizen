# Product Brief: Harness Evaluation Framework

**Status**: draft, intended as intake input for a multi-stage AI-first delivery workflow (dogfood
run). Open items are marked `[NEEDS CLARIFICATION]` rather than resolved by assumption, per the
convention already established as good practice in this research (Keystone's `phase1` blocks on
exactly this marker rather than inventing an answer).

## Why this, why now

The factory being designed needs its core delivery function checked against comparable existing
systems before further design work compounds on an unverified assumption of adequacy. Parity with
existing harnesses is acceptable if paired with a clear, evidenced improvement elsewhere
(maintainability, avoided duplication); neither claim can be made credibly without a real evaluation
mechanism. This brief scopes that mechanism as its own deliverable — not a one-off comparison, but
the first real instance of the efficacy-measurement loop the factory itself will need on an ongoing
basis. Full design rationale lives in [`EVALUATION-FRAMEWORK.md`](./EVALUATION-FRAMEWORK.md); this
brief restates it as buildable requirements.

## Goals

- Produce a credible, evidence-based comparison of a target harness's core delivery function against
  Keystone (live execution) and against `goa-software-factory`, `factory-encore`, and
  AIDE-VELOCITY-HARNESS (structural, from documented evidence).
- Bootstrap a reusable, ongoing measurement loop — not a single comparison run.

## Non-goals

- Not a CI/CD platform, and not a replacement for Keystone's own `eval-capability` skill — this
  framework *invokes* that skill via an adapter, it doesn't reimplement it.
- Not an attempt to gain live execution access to Pronghorn's or AIDE's actual harnesses — those are
  external systems; this framework works from documented evidence for those two.
- Not a visual dashboard product on first delivery — the report is versioned JSON/markdown by
  default (see NFR-4); a richer UI is explicitly deferred pending a demonstrated need.

## Users

- Whoever is deciding whether to proceed with the new factory's design, using this framework's
  output as the evidence base for that decision.
- Future maintainers of the new factory, who inherit this as their ongoing efficacy-measurement tool.

## Functional Requirements

- **FR-1**: The system SHALL define a common, harness-agnostic result schema (`EvalRunResult`) keyed
  on universal contract categories (build/test, security, requirement coverage, deployment,
  post-deploy verification) rather than per-harness stage names.
- **FR-2**: The system SHALL provide an instrumentation adapter for Keystone that invokes its
  existing `eval-capability` skill and maps its native output onto the common schema.
- **FR-3**: The system SHALL provide an instrumentation adapter for the target (new) factory, built
  alongside the factory itself, emitting an `EvalRunResult` for each benchmark run.
- **FR-4**: The system SHALL support populating `EvalRunResult` retrospectively for
  `goa-software-factory`, `factory-encore`, and AIDE-VELOCITY-HARNESS from the documented evidence in
  `pronghorn-assessment/11-ai-orchestration-comparison.md`, using the same schema as live-run data.
- **FR-5**: The system SHALL compute, deterministically, from `EvalRunResult` data: build/test
  correctness, requirement-coverage percentage, security findings by severity, cycle time,
  iteration/rework count, and post-deploy functional-verification status.
- **FR-6**: The system SHALL support an optional judge-panel mechanism for qualitative dimensions
  (e.g. code idiom, UX quality) that pure mechanical checks can't resolve, requiring multiple
  independent judges and a deterministic tally — never a single self-graded verdict feeding directly
  into the pass/fail decision.
- **FR-7**: The system SHALL score a run against explicit "par" thresholds, stated numerically before
  the run, and report pass/fail per threshold, not a single blended score.
- **FR-8**: The system SHALL maintain a maintainability/improvement scorecard, computed and reported
  separately from the delivery-function score, based on: Keystone's five stated concerns (Context,
  Constraints, Verification, Recovery, Feedback), process/adapter-separation cleanliness (verified,
  not claimed), and whether the process/adapter contract is enforced or merely a convention.
- **FR-9**: The system SHALL persist `EvalRunResult` and scorecard data over time, versioned, to
  support trend comparison across runs — not just a single snapshot.
- **FR-10**: The system SHALL produce a human-readable comparison report per run.
- **FR-11**: The system SHALL support at least 2–3 held-out benchmark specs: a workspace-view +
  intake-view combination (per `nx-tools/UX-VIEW-PATTERNS-SPEC.md`) and a small CRUD service
  exercising the ORM/ubiquitous-language question (per the `fac_s4_runner.py` discussion).

## Non-Functional Requirements

- **NFR-1**: The framework's core (schema, scoring engine, report generator) SHALL be implemented as
  an artifact independent of, and not embedded within, any harness it evaluates — including the
  target factory itself.
- **NFR-2**: All deterministic scoring logic SHALL be reproducible — identical `EvalRunResult` inputs
  SHALL produce identical scoring output; no hidden randomness or LLM calls in the aggregation path.
- **NFR-3**: The framework SHALL be extensible to an additional (fifth+) harness by adding a new
  adapter only — no change to the common schema or scoring engine required.
- **NFR-4**: The report format SHALL default to versioned JSON/markdown; a richer visualization is
  out of scope for initial delivery (see Non-goals).
- **NFR-5**: The judge-panel mechanism (FR-6), when invoked, SHALL record every individual judge's
  verdict and the reconciliation logic's output separately, so a disputed tally can be audited back
  to its inputs.

## Success criteria

- Tier A: the framework runs at least one benchmark spec through Keystone's `eval-capability` and
  through the target factory, producing a scored `EvalRunResult` and comparison report for both.
- Tier B: `EvalRunResult` records exist for `goa-software-factory`, `factory-encore`, and
  AIDE-VELOCITY-HARNESS, populated from documented evidence, in the same schema as Tier A.
- The par-threshold values (FR-7) and the maintainability-scorecard criteria (FR-8) are stated
  numerically/explicitly *before* the first comparison run, not derived after seeing the results.

## Constraints

- `goa-software-factory`, `factory-encore`, and AIDE-VELOCITY-HARNESS are not available for live
  execution; Tier B is necessarily evidence-based, not run-based, and should not be represented as
  equivalent-confidence data to Tier A in any report.
- Keystone's `eval-capability` skill is the integration point for Tier A; changes to that skill's
  output format upstream would require updating this framework's Keystone adapter.

## Open items — `[NEEDS CLARIFICATION]`

- `[NEEDS CLARIFICATION: implementation language/runtime]` — no target stack specified yet for the
  framework itself (the scoring engine, adapters, report generator).
- `[NEEDS CLARIFICATION: repository placement]` — a new standalone repo vs. a subdirectory of an
  existing one; NFR-1 requires it be decoupled from any harness it evaluates, which constrains but
  doesn't fully determine placement.
- `[NEEDS CLARIFICATION: exact par-threshold values]` — FR-7/Success-criteria require these stated
  numerically before the first run; placeholder ranges were suggested in `EVALUATION-FRAMEWORK.md`
  (e.g. "≥90% FR/NFR coverage") but not finalized.
- `[NEEDS CLARIFICATION: judge-panel model/provider]` — FR-6's judge panel needs at least two
  independent judges; whether these are separate model calls, separate prompts against the same
  model, or something else is undecided.

## References

- [`EVALUATION-FRAMEWORK.md`](./EVALUATION-FRAMEWORK.md) — full design rationale and mechanics.
- [`AI-ORCHESTRATION-LAYER-DESIGN.md`](./AI-ORCHESTRATION-LAYER-DESIGN.md) — the closed-contract/
  open-strategy architecture this framework's schema/adapter split mirrors.
- [`pronghorn-assessment/11-ai-orchestration-comparison.md`](./pronghorn-assessment/11-ai-orchestration-comparison.md) —
  source evidence for Tier B.
- [`nx-tools/UX-VIEW-PATTERNS-SPEC.md`](./nx-tools/UX-VIEW-PATTERNS-SPEC.md) — source for the
  workspace/intake benchmark spec (FR-11).
