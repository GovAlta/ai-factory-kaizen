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
  `stages.deployment`, `stages.post_deploy_verification` are correctly left `attempted: 0` — an
  honest reflection that `eval-capability` doesn't exercise those stages at all, not a mapping bug
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
