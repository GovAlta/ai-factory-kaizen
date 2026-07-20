// FR-8: a real, deterministic scan of this project's own adapters/* modules — "verified
// concretely, not claimed." Checks whether adapter code imports EvalRunResult from domain/
// (shared substance, TypeScript-enforced) rather than locally redefining that shape
// (duplicated substance — the exact failure mode this criterion exists to catch).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProcessAdapterSeparation } from './types';

// Requires "=" (a type alias) or "{" (an interface body) immediately after the name — excludes
// a type-only *import specifier* like "import { type EvalRunResult } from ...", which contains
// the bare substring "type EvalRunResult" but is not a declaration at all. Caught by running
// this scan against this project's own adapters/dogfood/load.ts, which uses exactly that import
// shape (see process-adapter-separation.spec.ts's regression test).
const LOCAL_REDEFINITION_RE = /\binterface\s+EvalRunResult\s*\{|\btype\s+EvalRunResult\s*=/;

// Line-based rather than one regex spanning the import braces — simpler than a single complex
// pattern, and avoids the unbounded-repetition shape a "spans-the-whole-import" regex has.
function importsEvalRunResultFromDomain(content: string): boolean {
  return content
    .split('\n')
    .some((line) => line.includes('import') && line.includes('EvalRunResult') && line.includes('domain/eval-run-result'));
}

// adaptersDir/*/*.ts — a single level under each adapter subdirectory, matching this project's
// real structure (adapters/keystone/*.ts, adapters/tier-b/*.ts, adapters/dogfood/*.ts, none of
// which nest further). Not a general recursive tree walker — docs/plan.md scopes this scan to
// exactly this shape, and a deeper walker would be more machinery than that need warrants.
function listTsFiles(adaptersDir: string): string[] {
  const files: string[] = [];
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  for (const adapterName of readdirSync(adaptersDir)) {
    const adapterDir = resolve(adaptersDir, adapterName);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!statSync(adapterDir).isDirectory()) continue;
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    for (const entry of readdirSync(adapterDir)) {
      if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
        files.push(resolve(adapterDir, entry));
      }
    }
  }
  return files;
}

export function checkProcessAdapterSeparation(adaptersDir: string): ProcessAdapterSeparation {
  const files = listTsFiles(adaptersDir);
  const evidence: string[] = [];
  let sawDomainImport = false;
  let sawLocalRedefinition = false;

  for (const file of files) {
    const relPath = file.slice(adaptersDir.length + 1);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = readFileSync(file, 'utf8');
    if (LOCAL_REDEFINITION_RE.test(content)) {
      sawLocalRedefinition = true;
      evidence.push(`${relPath}: locally redefines EvalRunResult instead of importing it from domain/`);
    } else if (importsEvalRunResultFromDomain(content)) {
      sawDomainImport = true;
      evidence.push(`${relPath}: imports EvalRunResult from domain/ (shared substance, TypeScript-enforced)`);
    }
  }

  const verified = files.length > 0 && sawDomainImport && !sawLocalRedefinition;
  if (files.length === 0) evidence.push('no adapter files found to scan');

  return { verified, enforced: verified, evidence };
}
