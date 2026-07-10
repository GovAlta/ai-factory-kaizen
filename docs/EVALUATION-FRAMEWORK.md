# Evaluation Framework: is the new factory's core delivery function comparable?

**Goal**: before designing the new factory in depth, establish a credible, evidence-based way to
check whether its core delivery function is at least on par with the harnesses already researched
(Pronghorn's `goa-software-factory`/`factory-encore`, Keystone, AIDE-VELOCITY-HARNESS) — with an
explicit allowance that parity on delivery performance is sufficient *if* the new factory is a
clear improvement on other stated dimensions (maintainability, avoided duplication, etc.), rather
than requiring outright superiority on every axis.

**A constraint that shapes the whole design**: Pronghorn's and AIDE's harnesses are external org
systems — there is no way to run them live against a held-out spec. Keystone is different: it's
local, and it already has an `eval-capability` skill built for exactly this purpose (*"build a
held-out spec into an app and score it through the deterministic gates"*). The framework has to be
honest about this asymmetry rather than pretend a uniform live benchmark is possible across all
four.

---

## Two-tier comparison

**Tier A — live, executable comparison against Keystone specifically.** Run the same held-out spec
through both Keystone's `eval-capability` and the new factory, score both through one shared rubric
(below). This is the only one of the four systems where a genuine empirical baseline is obtainable.

**Tier B — structural/qualitative comparison against all four**, using the dimensions already
tabulated in [`pronghorn-assessment/11-ai-orchestration-comparison.md`](./pronghorn-assessment/11-ai-orchestration-comparison.md)
(gate mechanism, security review, safety guard, efficacy measurement, autonomy, requirements
intake, experiment lane) as a checklist: for each row, does the new factory meet, exceed, or fall
short of what's already documented for each system? This gives an evidence-grounded profile even
for the two systems that can't be live-benchmarked.

---

## Mechanics: how the eval framework itself is built

**It must live outside every harness it evaluates, including the new one.** An eval framework
embedded inside the new factory's own codebase risks the same "grading its own homework" problem
already ruled out at the gate level (see `AI-ORCHESTRATION-LAYER-DESIGN.md` principle #2) — just
moved up a layer. It needs to live in its own independent location, not inside the new factory's
repo and not inside Keystone's `.claude/eval/`, so it can later evaluate a fifth harness without
duplication and can't be tuned to favor whichever harness it happens to be bundled with.

**The architecture is the same closed-contract/open-strategy pattern already established for the
workflow itself, applied one level up**: a small, fixed **common metrics schema** (closed,
harness-agnostic) plus a thin **instrumentation adapter** per harness (open, harness-specific) that
translates that harness's own native artifacts into the shared schema. This directly mirrors
`factory-encore`'s `verification.schema.yaml`/`adapter-manifest` pattern and Keystone's own
`Finding`/`Result` types, reapplied to measurement instead of code generation.

**The schema keys off universal contract categories, not stage names** — stage names vary
(Keystone's `phase1`–`8`, `factory-encore`'s `01`–`06`, whatever the new factory calls its own
stages), but the underlying contracts established in the workflow design don't: build/test,
security, requirement coverage, deployment, post-deploy verification. A minimal shape:

```
EvalRunResult {
  harness_id, spec_id, timestamp
  stages: { <contract_category>: { attempted, passed, iterations, duration_s,
                                     findings: {critical, high, medium, low} } }
  requirement_coverage: { total, traced_to_code, traced_to_test }
  overall: { build_passed, security_gate_passed, deployed, post_deploy_verified,
             cycle_time_s, total_iterations }
}
```

Each harness's adapter maps its own specific stages onto these categories, however many or few it
actually has — this is what keeps the comparison fair despite genuinely different internal shapes.

**The instrumentation adapter, per harness**:
- **Keystone**: nearly free to build — `eval-capability` already does almost exactly this. The
  adapter's job shrinks to invoking that skill and mapping its native output onto the common schema,
  not building a new observation mechanism from scratch.
- **The new factory**: build the adapter alongside the factory itself, from day one — this is where
  design principle #5 (build efficacy measurement in from day one) actually gets bootstrapped, not a
  separate effort layered on afterward.
- **`goa-software-factory`, `factory-encore`, AIDE-VELOCITY-HARNESS (Tier B)**: the same schema still
  applies, populated retrospectively from the documented evidence in `11-ai-orchestration-comparison.md`
  rather than a live run — e.g. `goa-software-factory.overall.security_gate_passed = false`,
  annotated "disconnected, human-invoked, one-shot, never wired into the pipeline." This keeps Tier A
  and Tier B structurally comparable even though Tier B's data comes from evidence, not execution.

---

## Nature of the eval framework: deterministic core, one contained exception, dashboard as a view

**The core — aggregation, scoring, trend-tracking, the pass/fail decision — is deterministic code,
not LLM judgment.** Same principle already established for the workflow's own gates (design doc
principle #2), applied to the measurement layer itself: don't let a subjective judgment decide
whether a run counts as "par." This isn't argued for by analogy alone — Keystone's own
implementation confirms it directly: `eval` is explicitly deterministic golden-trace and benchmark
self-testing, with its own documentation stating it is *"not a model-capability benchmark"*;
`self-audit` grades the harness against its five stated concerns and reports PASS/GAPS/BLOAT off
`inventory.json` — mechanical computation, not an LLM re-judging how a run felt. Everywhere a system
in this research got its measurement layer right, it was via deterministic computation over
structured artifacts.

**One legitimate exception, with its own containment discipline.** Some dimensions genuinely resist
pure mechanical measurement — is generated code idiomatic, does a UI read well, is this good UX (the
same unowned dimension flagged at the very start of this assessment, in the ownership model's own
UX-design gap). Keystone already has the right shape for this as a separate skill: `panel` —
*"Judge panel: N independent verifiers score a change; deterministic tally."* The judging can be
LLM-based; the aggregation across judges is not. The containment rule: any LLM-assisted verdict must
land in the same structured schema as every other metric (a numeric score plus cited evidence, from
*multiple* independent judges), reconciled deterministically — never a single self-graded verdict
feeding straight into the pass/fail decision. Same "don't grade your own homework" boundary as
principle #2, drawn one layer further out to cover qualitative dimensions rather than excluding them.

**The dashboard is a presentation layer over the closed schema, not part of the measurement logic —
and doesn't need a real UI from day one.** Keystone's own version of this is a plain JSON trend
file, `self-audit-baseline.json`, not a web dashboard. Matching the "don't build ahead of a real
requirement" discipline already applied elsewhere (the Key Vault/managed-Redis reasoning in
`pronghorn-assessment/09-recommendations.md`), the right default is a versioned JSON/markdown report
— matching the `field-report` pattern — that grows into a richer visualization only once there's a
demonstrated need (multiple stakeholders needing an at-a-glance trend view across many runs), not
before.

**Clarification on the architecture above**: both halves — the per-harness instrumentation adapters
*and* the shared scoring/dashboard engine — are deterministic code. The distinction between them
isn't "deterministic vs. not," it's "who owns and varies it" (adapters are per-harness and
swappable; the scoring engine is shared and closed) — the same open/closed split already established
for the workflow itself.

---

## Core delivery-function metrics (the "par" dimension)

Operationalizing "core delivery function" against the seven-stage flow already distilled:

- **Correctness** — build passes, held-out acceptance tests pass (Keystone's own `eval-capability` measure).
- **Requirement coverage** — fraction of FR/NFRs traceable to code *and* test (Keystone's `coverage.mjs`, AIDE's `check-fr-coverage.mjs`).
- **Security posture** — zero CRITICAL/HIGH findings from a real, gate-blocking review, not an optional or disconnected one.
- **Cycle time** — wall-clock and/or agent-turns from spec to verified, deployed solution.
- **Rework/iteration count** — build-review loops or gate failures before reaching a pass, as a friction proxy.
- **Post-deploy functional correctness** — does the *deployed* solution actually work when exercised.
  **None of the four systems researched measure this at all** — the one gap found across all of
  them. Including it means the new factory's evaluation is more rigorous than any existing baseline
  by construction, not merely at par.

## Maintainability/improvement dimensions (the "sufficient if better elsewhere" escape valve)

Scored separately from delivery function, never blended into one number. Reuse Keystone's own
`self-audit` structure directly rather than inventing something new — it already grades a harness
against five stated concerns: **Context, Constraints, Verification, Recovery, Feedback.** Add two
criteria specific to what this research surfaced:

- **Process/adapter separation cleanliness** — verified concretely (no duplicated substance between
  tech-agnostic process and stack-specific adapter), not just claimed.
- **Duplicated-effort risk avoided** — whether the process/adapter contract is an enforced, checked
  schema or just a convention, since a convention is exactly what let Keystone and
  AIDE-VELOCITY-HARNESS converge independently on similar designs with zero code relationship.

## Benchmark suite composition

2–3 held-out specs modeled on patterns already analyzed in depth in this research, not arbitrary
new ones:
- A workspace-view + intake-view combination, already fully specified in
  [`nx-tools/UX-VIEW-PATTERNS-SPEC.md`](./nx-tools/UX-VIEW-PATTERNS-SPEC.md).
- A small CRUD service exercising the ORM/ubiquitous-language question from the `fac_s4_runner.py`
  discussion — a good test of whether the new factory's adapter eliminates that class of check
  structurally rather than needing to detect it.

Using cases already understood in depth means there's a real basis for judging output quality, not
just pass/fail.

## The decision rule — stated before running anything

Mirroring Keystone's own `recovery-differential` bounded-experiment pattern (a stated decision rule,
a recorded outcome, a `reopenIf` condition): before the first comparison run, state numerically what
"par" means (e.g., ≥90% FR/NFR coverage, 0 CRITICAL/HIGH findings, cycle time within a stated margin
of Keystone's baseline) and what "sufficient improvement elsewhere" means as a specific, named claim
(e.g., "closes the duplicated-effort risk Keystone/AIDE didn't," not a vague "more maintainable").
Decide against that stated rule, not after the fact.

**This benchmark suite, run repeatedly as the factory evolves, is not a separate one-off effort** —
it's the first real instance of the efficacy-measurement loop already established as design
principle #5 in `AI-ORCHESTRATION-LAYER-DESIGN.md`. This is how that loop gets bootstrapped, not
something built alongside it.
