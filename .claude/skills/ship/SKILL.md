---
name: ship
description: Run the gate battery (verify, coverage, review, security-review), block on CRITICAL/HIGH, print a Handoff Report for sign-off, then deploy the epic to the sandbox and smoke-test it live.
allowed-tools: Bash, Read, Task
argument-hint: "[--skip-deploy]"
---

Reused across epics and callable standalone for re-verification, independent of `factory`
(this is why `ship` is its own skill rather than a step inside `factory` — see the plan's
reuse rule).

## Gate battery (Tier 2-equivalent — all blocking)

Pass `--epic <epic-id>` to steps 1, 2, and 4 — each records its own result into
`.claude/telemetry/<epic-id>.json` via `telemetry.mjs`, in the same shape as `EvalRunResult`
(Article 10). **Review is deliberately not passed `--epic`** and never recorded there — it's the
one judgment stage `EVALUATION-FRAMEWORK.md` itself keeps outside that closed schema, and the
dogfood telemetry preserves that boundary rather than blurring it.

1. `node .claude/gates/verify/verify.mjs --epic <epic-id>` — build + test. Deterministic; exit
   code is the verdict (Article 6).
2. `node .claude/gates/coverage/coverage.mjs --epic <epic-id>` — every FR-n/NFR-n resolves to an
   automated, passing scenario (Article 3).
3. **Review**: dispatch one isolated reviewer subagent via `Task`, giving it *only* the diff
   since the epic's `spec` commit and these three criteria (Article 6) — never the implementer's
   own reasoning:
   - domain-vocabulary drift against `docs/vocabulary.md` (Article 4)
   - unjustified complexity relative to this epic's stated FR/NFR in `docs/plan.md` (Article 5)
   - report/CLI clarity, where relevant to this epic
   Have it write structured findings to `.claude/findings/review.json` (shape: see
   `review.mjs`'s header comment), then run `node .claude/gates/review/review.mjs` to tally.
4. `node .claude/gates/security-review/security-review.mjs --epic <epic-id>` — secrets,
   dependency audit, subprocess-injection. Mandatory, never advisory (Article 7).

Any CRITICAL/HIGH finding from steps 2–4, or a nonzero exit from step 1, **blocks** — fix and
re-run, don't proceed past a failed check.

## Handoff Report

Once the battery is green, print a short summary (what changed, gate results, any advisory-only
findings) and wait for the user's explicit sign-off before deploying — a human checkpoint on top
of the machine gate, not instead of it.

## Deploy + post-deploy verification

1. `npx nx run <project>:sandbox` (project name from `.claude/epics.json`). If `oc`/`gh`/`podman`
   preflight fails, report the exact fix the executor prints and stop — don't retry blindly.
   Record it: `node .claude/lib/telemetry-cli.mjs record-stage --epic <epic-id> --category deployment --passed <0|1> --duration <seconds>`.
2. Re-run this epic's designated smoke scenario(s) — the ones tagged as post-deploy in
   `docs/requirements.md` — against the live sandbox URL, not the local test env. This *is*
   post-deploy functional verification (Article 8); it's real from epic 1. Record it the same
   way, with `--category post_deploy_verification`.
3. `node .claude/lib/telemetry-cli.mjs finalize --epic <epic-id> --build-passed <0|1> --security-gate-passed <0|1> --deployed <0|1> --post-deploy-verified <0|1>` —
   closes out this epic's `EvalRunResult`-shaped record with `overall` and `cycle_time_s`
   (computed automatically from the `start` timestamp).
4. Update `.claude/epics.json`: mark the epic `status: "shipped"`.
