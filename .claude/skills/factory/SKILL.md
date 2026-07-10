---
name: factory
description: Build one epic end-to-end (Spec then Build), then hand off to ship. Continuous — blocks only on [NEEDS CLARIFICATION] and failed gates, per Article 1 and 5 of the constitution.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Task
argument-hint: "<epic-id, e.g. epic-1-walking-skeleton>"
---

Run one epic from `.claude/epics.json` through Spec and Build. Read
`.claude/constitution.md` first — every step below is an application of one of its
articles, cited inline.

## Spec

0. `node .claude/lib/telemetry-cli.mjs start --epic <epic-id>` — starts this epic's own
   telemetry record, in the exact `EvalRunResult` shape from `EVALUATION-FRAMEWORK.md` (Article
   10). This is bookkeeping the *harness* keeps on itself, not part of the product being built.
1. Load the named epic's FR ids from `.claude/epics.json`. Read `docs/requirements.md`,
   `docs/vocabulary.md`, and `docs/plan.md` (all three are living, cumulative documents — extend
   them, don't rewrite from scratch).
2. Resolve this epic's FR/NFR slice into `docs/requirements.md`. Mark every ambiguity inline as
   `[NEEDS CLARIFICATION: <specific question>]` and **stop — ask the user directly** while any
   marker remains (Article 1). Do not guess.
3. Discover or extend the domain vocabulary in `docs/vocabulary.md` for concepts this epic
   introduces or touches, **before** deciding module/class shape (Article 4). If a term already
   in `vocabulary.md` would need to change meaning or name, that is itself a
   `[NEEDS CLARIFICATION]` — ask, don't rename silently.
4. Write one Given/When/Then scenario per FR/NFR in this epic's slice, appended to
   `docs/requirements.md` next to its id (Article 3).
5. Update `docs/plan.md`: module/class shape derived from `vocabulary.md`, sized to *this epic
   only* — smallest design that satisfies the stated FR/NFR, broader intent as a comment, not
   code (Article 5).
6. Commit: `git commit -m "spec(<epic-id>): requirements + vocabulary + plan"`.

## Build

1. Implement slice by slice. Each slice is test-first against its own Given/When/Then scenario
   (red → green) — the test proves correctness, not a self-report (Article 2, Article 6).
2. Before moving to the next slice, run a fast check (lint/typecheck/affected tests) — this is
   the pull-quality-left habit, an inline convention here, not a separate infrastructure tier
   (Article 3).
3. One commit per slice.
4. When every FR/NFR in this epic's slice has a passing scenario, invoke the `ship` skill.

## On [NEEDS CLARIFICATION]

Surface the exact question to the user and wait for their answer before writing anything further
for that FR/NFR. Update `.claude/epics.json`'s `openClarifications` list as items resolve.
