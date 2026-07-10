# AI Factory Kaizen — Constitution

Highest authority for how this repo builds itself. Where any skill or gate conflicts with an
article here, this file wins.

## 1. Spec-driven, ambiguity-blocking

Every FR/NFR gets a Given/When/Then scenario before code exists. An unresolved ambiguity is
marked inline as `[NEEDS CLARIFICATION: <specific question>]` and blocks — the epic does not
advance to Build while one remains. Never guess a value that should have been asked.

## 2. Ownership of quality

Correctness is proven by the person (or agent) who wrote the code, via their own tests —
never deferred to Review, and never a bare self-report. `verify`/`coverage` are the deterministic
proof; `Review` is scoped to what those two structurally cannot check (see Article 6).

## 3. BDD, coverage, pull-quality-left

A Given/When/Then scenario is written per FR/NFR at Spec time, before implementation. Build is
test-first against that scenario (red → green), plus a fast lint/typecheck/affected-test pass
before moving to the next slice. `coverage` checks that every FR-n/NFR-n resolves to an
automated, *passing* scenario — not merely that a test file exists.

## 4. Model-driven design

`docs/vocabulary.md` is the canonical, cumulative domain vocabulary. Discovering or extending it
comes *before* deciding module/class shape in `docs/plan.md` — structure follows the domain, not
an arbitrary technical layering. Renaming an established term is a `[NEEDS CLARIFICATION]`, not a
silent edit.

## 5. KISS / anti-abstraction

The smallest design that satisfies the *current epic's* stated FR/NFR — nothing built ahead of a
demonstrated need. Broader intent belongs in a comment, not in code. If a later epic reveals a
design needs to change, that refactor is its own justified epic (with its own Spec stating why),
never smuggled into an unrelated epic and never blocked on principle either.

## 6. Determinism owns safety and correctness; judgment owns craft

`verify`, `coverage`, and `security-review` are deterministic scripts against real artifacts —
never a model's own claim of "done." `Review` is the one judgment gate, and it is scoped
narrowly: domain-vocabulary drift, unjustified complexity relative to the current epic, and
report/CLI clarity. Even there, the isolated reviewer's verdict lands in a structured findings
file and is tallied deterministically — a judgment call is never the pass/fail decision itself.

## 7. Security is mandatory, gate-blocking, and never advisory

Kept as its own gate on purpose — folding it into general/advisory review is exactly how
`factory-encore` regressed from a real security-team split to grep-able invariants. Blocks on any
CRITICAL/HIGH finding, no exceptions.

## 8. Epics are the unit of iteration

Each epic runs Spec → Build → Review → Security → Ship end to end and ends in a redeployed
sandbox instance. Post-deploy verification is real: a designated smoke subset of the epic's own
BDD scenarios re-run against the live sandbox URL, not a separate mechanism.

## 9. Restraint

Every skill and gate here must move one of five concerns — Context, Constraints, Verification,
Recovery, Feedback — or it doesn't belong. This harness is deliberately smaller than Keystone's:
no Tier 0 guard script, no inventory/generator machinery, no color teams or extra deploy
adapters. Add any of those back only when a real, demonstrated need shows up, not preemptively.

## 10. This harness instruments its own runs, in the product's own schema

Every epic's `verify`/`coverage`/`security-review` results are recorded to
`.claude/telemetry/<epic-id>.json` in the exact `EvalRunResult` shape defined in
`EVALUATION-FRAMEWORK.md` (`harness_id: "ai-factory-kaizen-dogfood"`) — moving the Feedback
concern (Article 9) for this harness's own construction, and giving the scoring engine real test
data the moment it exists, not synthetic fixtures. `Review` is deliberately excluded from this
recording, mirroring the schema's own boundary: it's the one judgment stage kept outside the
closed schema, and blurring that here would corrupt the analogy this instrumentation exists to
provide.
