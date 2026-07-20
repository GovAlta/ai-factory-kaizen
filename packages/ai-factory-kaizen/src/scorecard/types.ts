// FR-8: never blended into EvalRunResult or any delivery-function score — a separate type,
// reported separately, per FR-8's own wording.
import type { PanelResult } from '../judge-panel/types';

export type Concern = 'context' | 'constraints' | 'verification' | 'recovery' | 'feedback';

export interface ProcessAdapterSeparation {
  verified: boolean;
  enforced: boolean;
  evidence: string[];
}

export interface MaintainabilityScorecard {
  // All five required, not Partial — FR-8's own scenario assumes a complete scorecard judges
  // every one of Keystone's five stated concerns, never a silently-incomplete subset.
  concerns: Record<Concern, PanelResult>;
  processAdapterSeparation: ProcessAdapterSeparation;
}
