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

## Epic 4 — report generator + trend persistence

```
packages/ai-factory-kaizen/src/report/
  build-report.ts     # AMENDED: buildReport(inputs: RunInput[], generatedAt) — RunInput pairs
                       #   an EvalRunResult with its confidence ('live' | 'retrospective');
                       #   RunReport gains a confidence field (FR-10 completion)
  history.ts            # appendToHistory(report, historyPath) -> Report[] (FR-9); append-only,
                        #   no dedup (Article 5 — that judgment isn't this epic's stated scope)
  generate-dogfood-report.ts   # AMENDED: includes dogfood telemetry (confidence: 'live') AND
                                #   the three Tier B records (confidence: 'retrospective') in
                                #   the same report, then appends it to history.json
```

Signature change to `buildReport` is a deliberate, justified amendment (epic 2b said this epic
would extend it, not a silent break) — `confidence` didn't exist as a concept until this epic's
own FR-10 scenario needed it.

## Epic 5 — judge-panel mechanism + maintainability scorecard

```
packages/ai-factory-kaizen/src/judge-panel/
  types.ts    # JudgeVerdict, PanelResult (FR-6)
  tally.ts     # tallyPanel(verdicts: JudgeVerdict[]) -> PanelResult; deterministic, rejects a
               #   panel of <2 verdicts, ties fail closed
packages/ai-factory-kaizen/src/scorecard/
  types.ts               # MaintainabilityScorecard, Concern, ProcessAdapterSeparation (FR-8)
  process-adapter-separation.ts   # checkProcessAdapterSeparation(adaptersDir) -> ProcessAdapterSeparation;
                                    #   scans adapters/*/*.ts for EvalRunResult import vs. local
                                    #   redefinition — a real scan of this repo, not a generic claim
```

No code dispatches judge subagents — that's an agent-in-the-loop operation exactly like the
Keystone adapter's build half (epic 2) and this harness's own `ship` skill's Review stage: the
tally is code, producing the verdicts is a live judgment call, done by whoever operates this at
the point they need it.
