// AI run + proposal + diff types for the Day Designer feature.
// These mirror the backend `DayBlueprintAiRun`, `DayBlueprintAiProposal`
// and the `DayBlueprintDiff` v1 grammar used by the diff applier and
// guardrail evaluator. The UI reads these shapes for the AI panel,
// proposal review dialog, and preflight endpoint.

export type DayBlueprintAiRunStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type DayBlueprintAiRunKind = 'GENERATE' | 'REFINE' | 'VALIDATE';
export type DayBlueprintAiProposalStatus =
  | 'PROPOSED'
  | 'APPLIED'
  | 'REJECTED'
  | 'SUPERSEDED';

export type DayBlueprintDiffResource =
  | 'moment'
  | 'activity'
  | 'moment_action'
  | 'moment_placement';

export type DayBlueprintDiffOp =
  | { op: 'add'; resource: DayBlueprintDiffResource; parent_id: number; data: Record<string, unknown> }
  | { op: 'update'; resource: DayBlueprintDiffResource; id: number; patch: Record<string, unknown> }
  | { op: 'remove'; resource: DayBlueprintDiffResource; id: number }
  | { op: 'reorder'; resource: DayBlueprintDiffResource; order: Array<{ id: number; order_index: number }> };

export interface DayBlueprintDiff {
  version: 1;
  ops: DayBlueprintDiffOp[];
}

export interface DayBlueprintAiProposal {
  id: number;
  day_blueprint_ai_run_id: number;
  status: DayBlueprintAiProposalStatus;
  diff_json: DayBlueprintDiff;
  rationale_text?: string | null;
  applied_at?: string | null;
  applied_by_user_id?: number | null;
  created_at: string;
}

export interface DayBlueprintAiRun {
  id: number;
  day_blueprint_version_id: number;
  run_kind: DayBlueprintAiRunKind;
  status: DayBlueprintAiRunStatus;
  run_key?: string | null;
  prompt_summary?: string | null;
  error?: string | null;
  started_at: string;
  finished_at?: string | null;
  created_at: string;
  proposals?: DayBlueprintAiProposal[];
}

export interface DayBlueprintAiPreview {
  /** Ordered list of guardrail violations. Empty = safe to apply. */
  violations: string[];
}

export interface StartDayBlueprintAiRunInput {
  run_kind: DayBlueprintAiRunKind;
  prompt_summary?: string;
  run_key?: string;
}

export interface CreateDayBlueprintAiProposalInput {
  day_blueprint_ai_run_id: number;
  diff_json: DayBlueprintDiff;
  rationale_text?: string;
}

export interface ApplyDayBlueprintAiProposalInput {
  status?: DayBlueprintAiProposalStatus;
  applied_by_user_id?: number;
}
