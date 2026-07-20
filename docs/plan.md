# Plan

Living document: module/class shape, derived from `docs/vocabulary.md`, kept to the current
epic's stated scope (Article 5 — KISS/anti-abstraction). Broader intent belongs in a code
comment, not in code built ahead of need. A later epic's refactor is its own justified entry
here, not folded silently into an unrelated epic.

## Epic 1 — walking skeleton

Module shape derived from `docs/vocabulary.md`, sized to this epic's stated FR-1/FR-5/FR-7 only.
No adapter code yet (Keystone adapter is epic 2) — deliberately, per Article 5: nothing built
ahead of the epic that actually needs it.

```
packages/ai-factory-kaizen/src/
  domain/
    eval-run-result.ts   # EvalRunResult, ContractCategory, StageResult, RequirementCoverage,
                          #   OverallResult types + validateEvalRunResult() (FR-1)
    par-threshold.ts      # ParThreshold, ScoreReportEntry types (FR-7)
  scoring/
    metrics.ts            # computeMetrics(EvalRunResult) -> derived metrics (FR-5)
    score.ts               # scoreAgainstThresholds(EvalRunResult, ParThreshold[]) -> ScoreReportEntry[] (FR-7)
```

**No new route file** — `GET /health` already exists in the generated `main.ts` via the ADSP
SDK's `initializeService()`/`healthCheck()`, which checks real platform dependencies (directory,
tenant, access, configuration, event). This is the walking skeleton's deploy proof; building a
second, weaker stub endpoint would be exactly the kind of duplicated substance this project
itself is meant to detect in other harnesses.

`example.ts`/`example.spec.ts`/`events.ts` from the generator scaffold are removed (and their
wiring in `main.ts`) — they're the generator's own placeholder resource, not this epic's code,
and no epic yet needs an authenticated API surface.

## Epic 2 — Keystone adapter, live

```
packages/ai-factory-kaizen/src/adapters/keystone/
  types.ts    # KeystoneCapabilityResult, KeystoneCoverageResult — the raw shapes (FR-2)
  score.ts     # runCapabilityScore(builtRoot, taskPath) -> KeystoneCapabilityResult; shells out
               #   to `score.mjs --root <dir> --task <path> --json` via execFile (array args,
               #   never a template string) — the scoring half only, per FR-2's scope finding
  map.ts       # mapKeystoneResult(KeystoneCapabilityResult, KeystoneCoverageResult) -> EvalRunResult
```

No invocation code for the *build* half (fresh harness copy/`/init`/`/build`/builder subagent) —
that's a real agent-in-the-loop operation, not something to fake with a subprocess call, and it's
a separate, explicitly-authorized step per this epic's Spec discussion, not part of this module.

## Epic 2b — dogfood self-adapter

```
packages/ai-factory-kaizen/src/adapters/dogfood/
  load.ts    # loadDogfoodRun(epicId, telemetryDir) -> EvalRunResult; reads + validates,
             #   fails loud on a corrupt file rather than returning a partial result
packages/ai-factory-kaizen/src/report/
  build-report.ts     # buildReport(EvalRunResult[], generatedAt) -> Report (FR-10, minimal)
  generate-dogfood-report.ts   # a small runnable script (`npx tsx <path>`, not an Nx target —
                                #   no CI/scheduling need yet) that loads epic 1 + epic 2's real
                                #   telemetry via DogfoodAdapter, builds the report, and writes
                                #   docs/reports/dogfood-self-eval.json
```

No markdown output yet (NFR-4 allows either) — JSON matches `EvalRunResult`'s own native format
and nothing has demonstrated a need for markdown specifically; add it if that changes (Article 5).
No trend/history persistence across generations — that's FR-9, epic 4, not duplicated here.

## Epic 3 — Tier B retrospective adapter

```
packages/ai-factory-kaizen/src/domain/
  eval-run-result.ts   # AMENDED: RequirementCoverage and overall.total_iterations become
                        #   nullable — completing FR-1's own two-tier scope, not new scope
packages/ai-factory-kaizen/src/adapters/tier-b/
  types.ts    # TierBRecord: { result, evidence, sourceDoc }
  records.ts   # the three curated TierBRecords (goa-software-factory, factory-encore,
               #   AIDE-VELOCITY-HARNESS), hand-transcribed from the comparison document with a
               #   quoted citation per populated field — not generated/parsed from prose, since
               #   turning narrative evidence into structured data is a one-time interpretive
               #   act, not a repeatable algorithm (unlike Keystone's adapter, which parses
               #   real machine-generated JSON)
```

No report integration yet — folding Tier A and Tier B together into one report is epic 6's
explicit job ("tying Tier A and Tier B together," FR-11), not duplicated here.
