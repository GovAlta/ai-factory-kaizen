# Requirements

Living document, cumulative across epics. Each FR/NFR carries a Given/When/Then scenario,
written before its implementation (Article 1, Article 3 of `.claude/constitution.md`).
An unresolved ambiguity is marked `[NEEDS CLARIFICATION: <question>]` inline and blocks the
owning epic's Build stage until answered.

Source of record for FR/NFR ids: `EVAL-FRAMEWORK-PRODUCT-BRIEF.md` (see `EVALUATION-FRAMEWORK.md`
for full rationale). Ids below are populated per-epic as each epic's Spec step resolves them —
nothing is pre-filled here to keep that resolution live and real, not decided in advance.

## Epic 1 — walking skeleton

### FR-1 — common, harness-agnostic EvalRunResult schema

The system SHALL define a common, harness-agnostic result schema (`EvalRunResult`) keyed on
universal contract categories (`build/test`, `security`, `requirement coverage`, `deployment`,
`post-deploy verification`) rather than per-harness stage names.

- **Given** a harness's run data expressed in the `EvalRunResult` shape
- **When** the schema is inspected
- **Then** it exposes exactly four `stages` categories (`build/test`, `security`, `deployment`,
  `post_deploy_verification`) plus a separate top-level `requirement_coverage` field — regardless
  of what stage names the source harness itself used
- **Then** a value missing a required field, or using an unrecognized stage category name, is
  rejected by validation

### FR-5 — deterministic metrics from EvalRunResult

The system SHALL compute, deterministically, from `EvalRunResult` data: build/test correctness,
requirement-coverage percentage, security findings by severity, cycle time, iteration/rework
count, and post-deploy functional-verification status.

- **Given** a populated `EvalRunResult`
- **When** scored by the metrics function
- **Then** it returns `buildTestPassed`, `requirementCoveragePercent`, `securityFindingsBySeverity`,
  `cycleTimeSeconds`, `totalIterations`, and `postDeployVerified`
- **Given** the same `EvalRunResult` scored twice
- **When** compared
- **Then** the two results are identical — no randomness, no hidden state

### FR-7 — score against explicit par thresholds, never blended

The system SHALL score a run against explicit "par" thresholds, stated numerically before the
run, and report pass/fail per threshold, not a single blended score.

`[NEEDS CLARIFICATION: the actual numeric par-threshold values — deferred to epic 2, decided
immediately before the first live Tier A comparison run against Keystone, per this document's
own decision-rule pattern. Epic 1 builds the scoring mechanism generically, accepting a set of
named thresholds as a parameter, fully testable with example values now.]`

- **Given** an `EvalRunResult` and a named set of numeric thresholds (e.g.
  `minRequirementCoveragePercent`, `maxCriticalFindings`, `maxHighFindings`,
  `maxCycleTimeSeconds`)
- **When** scored against those thresholds
- **Then** the result is a list of `{ threshold, actual, limit, passed }` entries — never
  collapsed into one blended score
- **Given** a threshold set with zero entries
- **When** scored
- **Then** the result is an empty list, not an error and not a default pass

### Post-deploy smoke scenario (epic 1's own Ship stage)

- **Given** the service deployed to the sandbox
- **When** `GET /health` is called against the live sandbox URL
- **Then** it responds `200` with the ADSP SDK's platform health-check JSON (`directory`,
  `tenant`, `access`, `configuration`, `event` booleans) — already provided by
  `initializeService()` in the generated scaffold, not new code. This is the walking skeleton's
  proof that deploy → post-deploy verification is real, not simulated, from epic 1 onward, and
  it's a more meaningful check than a bare `{status:"ok"}` stub would have been: it proves the
  deployed pod can actually reach ADSP platform services from inside OpenShift.

## Epic 2 — Keystone adapter, live

### FR-2 — instrumentation adapter for Keystone

The system SHALL provide an instrumentation adapter for Keystone that invokes its existing
`eval-capability` skill and maps its native output onto the common schema.

**Scope finding, grounded in Keystone's actual source, not assumption**: `/eval-capability`'s
*build* half (fresh harness copy → `/init` → `/build` → dispatch a builder subagent) inherently
requires an agent-in-the-loop — no subprocess call automates a judgment step. The adapter's
honest scope is the *scoring* half: given an already-built app, shell out to Keystone's own
`score.mjs --root <dir> --task <task.json> --json` (deterministic, safe to automate) and map its
real output onto `EvalRunResult`. Triggering the build half is a separate, explicitly-authorized
operational step (this conversation's own agent running `/eval-capability <task-id>` inside a
Keystone session), not something this epic's code does programmatically.

- **Given** Keystone's real `score.mjs --json` output shape (`{ task, score, checks: [{desc, ok,
  skipped?}] }`, `checks[0]` = verify, `checks[1]` = coverage, then 0+ structural accept checks,
  then 0-1 behavioral check)
- **When** mapped by the adapter
- **Then** `stages['build/test']` reflects `checks[0]`, and `stages.security`,
  `stages.deployment`, `stages.post_deploy_verification` are correctly left absent (per FR-1's
  `Partial<Record<...>>` shape) — an honest reflection that `eval-capability` doesn't exercise
  those stages at all, not a mapping bug
- **Given** Keystone's real `coverage.mjs --json` output shape (severity-graded `findings`/`counts`,
  total FR count only present inside a `note` string like `"traced app/.ai/requirements.md (12
  req)"`)
- **When** mapped by the adapter
- **Then** `requirement_coverage.total` is extracted from that note via a documented, tested
  pattern — and if the note doesn't match the expected format, the adapter reports it as
  unavailable rather than guessing a number
- **Given** an already-built Keystone harness copy and a task id
- **When** the adapter's scorer function is invoked
- **Then** it shells out via `execFile` with an argument array — never a template string handed to
  `exec`/`execSync` — the exact risk `security-review`'s subprocess-injection check exists for

### Post-deploy smoke scenario (epic 2's own Ship stage)

- **Given** the walking-skeleton service already deployed to the sandbox
- **When** the redeploy for this epic completes
- **Then** `GET /health` still responds `200` against the live sandbox URL — this epic adds no
  new HTTP surface, so the smoke scenario is the same regression check as epic 1's, confirming
  the adapter's addition didn't break the deployed service

## Epic 2b — dogfood self-adapter (not in the original epic list — see `.claude/epics.json`)

### FR-1 / FR-5, exercised against real harness-native data

`.claude/telemetry/<epic-id>.json` is already `EvalRunResult`-shaped (Article 10) — the
"adapter" here is the identity case: a loader, not a mapper.

- **Given** a real telemetry file this harness already wrote for a shipped epic
- **When** loaded and validated
- **Then** it passes `validateEvalRunResult` (FR-1) with no translation — the cheapest possible
  proof the schema round-trips against a harness that writes to it natively
- **Given** a telemetry file that fails validation (corrupt or hand-edited incorrectly)
- **When** loaded
- **Then** loading fails loud with the validator's specific errors, not a silent partial result
- **Given** epic 1's and epic 2's real telemetry
- **When** each is scored by `computeMetrics` (FR-5)
- **Then** the resulting metrics are real numbers computed from genuine runs, not fixtures

### FR-10 (minimal first cut) — human-readable report per run

- **Given** one or more `EvalRunResult`s
- **When** a report is built
- **Then** it contains, per run, the harness id, spec id, timestamp, and its `DerivedMetrics` —
  and is written to `docs/reports/dogfood-self-eval.json` as a real committed JSON artifact.
  No version/history field yet — this report is overwritten on each generation, not appended;
  trend persistence across generations is a later epic's job (see `.claude/epics.json`), not
  claimed here
- **Given** zero runs
- **When** a report is built
- **Then** it produces a report with an empty `runs` list, not an error

### Post-deploy smoke scenario (epic 2b's own Ship stage)

- **Given** this epic adds no HTTP route and reads only committed, repo-local telemetry files
- **When** deciding whether to redeploy
- **Then** no redeploy is needed — there is nothing new for a live pod to serve differently;
  the report generator runs at dev/build time, not at runtime

## Epic 3 — Tier B retrospective adapter

### Schema amendment (before FR-4): `requirement_coverage` and `total_iterations` become nullable

Grounded in the actual source document (`pronghorn-assessment/11-ai-orchestration-comparison.md`),
not assumption: it is architectural/process prose, not run-outcome data. It gives real evidence
for exactly one field — `overall.security_gate_passed` — and no evidence at all for
`requirement_coverage`, `build_passed`, `deployed`, `post_deploy_verified`, `cycle_time_s`, or
`total_iterations`. Epic 1 shipped `requirement_coverage` and `total_iterations` as required,
non-nullable numbers, which forces a dishonest `0` ("zero requirements") where the truth is
"unmeasured." This is completing FR-1's own stated scope — the product brief always intended two
population tiers — not scope creep into an unrelated epic (Article 5).

- **Given** a harness with no requirement-coverage evidence at all
- **When** an `EvalRunResult` is constructed for it
- **Then** `requirement_coverage` is `null`, not `{ total: 0, ... }` — distinguishing "unmeasured"
  from "measured and found to be zero"
- **Given** existing epic 1/2 code that always supplied real `RequirementCoverage` objects
- **When** the schema changes
- **Then** `computeMetrics` and `scoreAgainstThresholds` handle a `null` `requirement_coverage`
  without throwing, and all previously-shipped tests still pass unmodified in their assertions

### FR-4 — Tier B retrospective population

The system SHALL support populating `EvalRunResult` retrospectively for `goa-software-factory`,
`factory-encore`, and AIDE-VELOCITY-HARNESS from the documented evidence in
`pronghorn-assessment/11-ai-orchestration-comparison.md`, using the same schema as live-run data.

- **Given** the comparison document's cross-cutting table and per-harness narrative
- **When** a `TierBRecord` is curated for each of the three harnesses
- **Then** `overall.security_gate_passed` is set from real, quoted evidence (`false` for
  `goa-software-factory` — "disconnected, human-invoked, one-shot, never wired into the pipeline";
  `false` for `factory-encore` — "no Blue/Red at all, 26 grep-able invariants + optional reviewer";
  `true` for AIDE-VELOCITY-HARNESS — "real, mandatory, gate-blocking /blueteam+/redteam... genuinely
  wired in"), and every other field this document has no evidence for stays `null`/absent —
  never guessed
- **Given** a `TierBRecord`
- **When** inspected
- **Then** it carries an `evidence` citation (the exact quoted passage) for every field it
  populates, and a `sourceDoc` pointer — so a disputed value can be audited back to its source
- **Given** a curated `TierBRecord`'s `result`
- **When** validated
- **Then** it passes `validateEvalRunResult` like any other `EvalRunResult` — same schema, per
  FR-4's own wording, not a parallel or looser shape

### Post-deploy smoke scenario (epic 3's own Ship stage)

- **Given** this epic adds curated data and a schema amendment, but no new HTTP route
- **When** deciding whether to redeploy
- **Then** no redeploy is needed — same reasoning as epic 2b

## Epic 4 — report generator + trend persistence

Extends epic 2b's minimal report, not a rewrite. Scoped to the report/trend *mechanism*; running
a fresh live Tier A benchmark and tying it to Tier B is a later epic's explicit job (see
`.claude/epics.json`) — not duplicated here.

### FR-10 (completing it) — distinguish confidence levels in the report

The product brief's own constraint: Tier B "should not be represented as equivalent-confidence
data to Tier A in any report." Epic 2b's `RunReport` had no field capturing this at all.

- **Given** a dogfood run (this harness's own real telemetry) and a Tier B record (evidence-based)
- **When** both appear in the same report
- **Then** each `RunReport` carries `confidence: 'live' | 'retrospective'` — dogfood telemetry is
  `'live'` (real, observed), Tier B records are `'retrospective'` (evidence-based, per FR-4) —
  so a reader can never mistake one for the other

**Correction found by generating the real report against real Tier B data (not by inspection
alone)**: `DerivedMetrics.buildTestPassed` defaulted to `false` when no `build/test` stage was
present, misreporting all three Tier B harnesses as confirmed build failures — a claim the source
document never makes. Fixed to `null` ("unmeasured"), the same distinction already drawn for
`requirementCoveragePercent`/`totalIterations`, applied to the one field that had been missed.

- **Given** a run with no `build/test` stage at all
- **When** scored
- **Then** `buildTestPassed` is `null`, not `false`
- **Given** a run with a `build/test` stage that was attempted and genuinely failed
- **When** scored
- **Then** `buildTestPassed` is `false` — the distinction from `null` is real, not collapsed

### FR-9 — persist EvalRunResult and scorecard data over time, versioned

The system SHALL persist `EvalRunResult` and scorecard data over time, versioned, to support
trend comparison across runs — not just a single snapshot.

- **Given** a report generated today, and another generated after a later epic ships
- **When** history is inspected
- **Then** both generations are present in `docs/reports/history.json` — an append-only log, not
  an overwritten snapshot
- **Given** a fresh repo with no prior history file
- **When** a report is first generated
- **Then** history starts as an empty array and gains one entry, not an error
- **Given** the same report content generated twice in a row (no new runs shipped between)
- **When** appended
- **Then** both entries are still recorded — deduplication is not this epic's job; a reader can
  see "nothing changed between these two generations" as a real, informative trend signal

### Post-deploy smoke scenario (epic 4's own Ship stage)

- **Given** this epic touches only report generation and a history file, no new HTTP route
- **When** deciding whether to redeploy
- **Then** no redeploy is needed — same reasoning as epic 2b/3

## Epic 5 — judge-panel mechanism + maintainability scorecard

`[NEEDS CLARIFICATION: judge-panel model/provider — resolved here]`. This harness has already
run the exact mechanism FR-6 asks for, four epics running: an isolated reviewer subagent (fresh
context, diff + criteria only) whose structured verdict is tallied deterministically by
`review.mjs`, never a bare self-report. FR-6 generalizes that proven pattern from harness-internal
tooling into a reusable product capability. Model/provider is deliberately not pinned to one
vendor at the type level — a `JudgeVerdict` is provider-agnostic; *how* a verdict is produced
(which model, which prompt) is the caller's concern, matching FR-6's own "judging can be
LLM-based; the aggregation across judges is not."

### FR-6 — judge-panel mechanism for qualitative dimensions

The system SHALL support an optional judge-panel mechanism for qualitative dimensions that pure
mechanical checks can't resolve, requiring multiple independent judges and a deterministic tally
— never a single self-graded verdict feeding directly into the pass/fail decision.

- **Given** multiple independent judges' verdicts on the same subject
- **When** tallied
- **Then** the result is a deterministic function of all verdicts (e.g. majority) — the same
  input list always produces the same consensus, no model call inside the tally itself
- **Given** exactly one verdict
- **When** tallied
- **Then** it is rejected — `[NEEDS CLARIFICATION]`'s own "don't grade your own homework" logic
  requires *multiple* independent judges; a panel of one is not a panel
- **Given** a tied panel (e.g. 1 pass, 1 fail)
- **When** tallied
- **Then** the tie is resolved by a stated, documented rule (fail-closed: a tie does not pass),
  not left ambiguous

### FR-8 — maintainability scorecard, separate from the delivery-function score

The system SHALL maintain a maintainability/improvement scorecard, computed and reported
separately from the delivery-function score, based on: Keystone's five stated concerns (Context,
Constraints, Verification, Recovery, Feedback), process/adapter-separation cleanliness (verified,
not claimed), and whether the process/adapter contract is enforced or merely a convention.

- **Given** judge-panel verdicts for the five concerns (a judgment call, per FR-6)
- **When** a scorecard is assembled
- **Then** it never blends into `EvalRunResult`'s own score — a separate type, never merged into
  one number with delivery-function metrics
- **Given** this project's own `adapters/*` modules
- **When** process/adapter-separation cleanliness is checked
- **Then** it's a real, deterministic scan (do all adapters import `EvalRunResult` from
  `domain/`, or does any adapter locally redefine/duplicate that shape) — "verified concretely,"
  not a claimed/asserted boolean with no evidence
- **Given** the same scan
- **When** judging "enforced vs. convention"
- **Then** TypeScript's own compile-time type checking on the shared import *is* the enforcement
  mechanism here — a real answer specific to this codebase, not a generic yes/no

### Post-deploy smoke scenario (epic 5's own Ship stage)

- **Given** this epic adds judge-panel/scorecard types and a deterministic scan, no HTTP route
- **When** deciding whether to redeploy
- **Then** no redeploy is needed — same reasoning as epic 2b/3/4
