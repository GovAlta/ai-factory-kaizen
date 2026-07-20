// FR-11: hand-curated, cited fixtures — distilling a design doc into a held-out spec is a
// one-time interpretive act, the same reasoning TierBRecord's curation used (epic 3).
import type { BenchmarkSpecFixture } from './types';

export const BENCHMARK_FIXTURES: BenchmarkSpecFixture[] = [
  {
    id: 'workspace-intake-view',
    title: 'Workspace view + intake view combination',
    sourceDoc: 'nx-tools/UX-VIEW-PATTERNS-SPEC.md',
    frNfrs: ['TASK-FR-1', 'TASK-FR-2', 'TASK-FR-3', 'TASK-FR-4', 'TASK-FR-5', 'TASK-FR-6'],
    spec:
      'An internal workspace (staff-facing list) and a public intake (multi-step submission) view, ' +
      'per the source document\'s own distilled patterns. TASK-FR-1: the workspace list SHALL use ' +
      'server-driven pagination (page/limit params) via a real pagination component, never a ' +
      'hand-rolled Prev/Next. TASK-FR-2: the workspace list SHALL support explicit column-sort as ' +
      'query params (sortBy/sortDir) — the source document found "nobody solved this" across all ' +
      'three real products studied, so this is a deliberate requirement, not an inherited gap. ' +
      'TASK-FR-3: row actions SHALL be gated by a per-row canX(status) predicate, with a ' +
      'mutating-guard disabling the button while its own action is in flight. TASK-FR-4: intake ' +
      'per-step validation SHALL actually block the Next button (not a purely visual "required" ' +
      'marker — a confirmed real gap in one studied product) and SHALL render a goa-error-summary ' +
      'at the top of each step. TASK-FR-5: intake SHALL include a required, distinct read-only ' +
      'review step before final submit, with per-section Edit links and a declaration checkbox. ' +
      'TASK-FR-6: intake SHALL always show a confirmation page with a reference number after ' +
      'submission — the source document found one product contradicted itself on this and resolved ' +
      'it to "always show it."',
    acceptanceCriteria: [
      'the workspace list\'s pagination component receives page/limit props from the server response, not a client-side counter',
      'the workspace list\'s column headers wire sortBy/sortDir on click, not left static',
      'each row action button is disabled while a mutation for that same row is in flight',
      'the intake wizard\'s Next button is disabled when a required field fails validation, not merely styled as invalid',
      'a goa-error-summary element is present at the top of every intake step',
      'a distinct, read-only review step exists before the submit action, separate from the input steps',
      'the confirmation view is reached on every successful submission path, with no code path that skips it',
    ],
  },
  {
    id: 'crud-orm-ubiquitous-language',
    title: 'Small CRUD service exercising the ORM/ubiquitous-language question',
    sourceDoc: 'AI-ORCHESTRATION-LAYER-DESIGN.md',
    frNfrs: ['TASK-FR-1', 'TASK-FR-2'],
    spec:
      'A small CRUD service testing whether an adapter eliminates the SQL-column-drift class of ' +
      'check structurally, rather than needing a detector for it — the "correctness by ' +
      'construction" framing the source document uses for the FAC-S4-019 finding (`fac_s4_runner.py` ' +
      'itself is not accessible in this environment; this fixture is built from the source ' +
      'document\'s own secondhand description of it, cited honestly, not presented as a primary-' +
      'source read). TASK-FR-1: all queries SHALL reference the canonical schema through a typed ' +
      'query builder (e.g. Drizzle\'s db.select().from(schema.x).where(eq(schema.x.y, ...))), never ' +
      'a raw SQL string literal naming a column. TASK-FR-2: renaming a column in the schema SHALL ' +
      'surface as a TypeScript compile error in every place that referenced it, not as a silent ' +
      'runtime drift a regex-based detector would otherwise be needed to catch.',
    acceptanceCriteria: [
      'no generated service file contains a raw SQL string literal naming a table column',
      'every query in generated service code references a schema property through the typed query builder, not a string',
      'deliberately renaming a column in the schema definition causes a TypeScript compile error in every file that referenced the old name',
    ],
  },
];
