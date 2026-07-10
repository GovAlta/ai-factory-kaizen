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
