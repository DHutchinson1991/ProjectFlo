/**
 * Day Blueprint AI diff grammar.
 *
 * Deliberately narrow — each op targets one authoring table, uses the
 * blueprint row's own `id` (never free-text matching), and carries
 * only the columns the Day Designer AI is allowed to set. This keeps
 * the applier + guardrail evaluator trivially auditable and makes
 * malicious / hallucinated payloads structurally rejectable.
 *
 * Resource model:
 *   - moment: day_blueprint_moments
 *   - activity: day_blueprint_activities
 *   - moment_action: day_blueprint_moment_actions
 *   - moment_placement: day_blueprint_moment_placements
 *
 * Ops:
 *   - add: insert under a parent id
 *   - update: patch allowed fields on an existing row
 *   - remove: delete a row (will cascade per schema)
 *   - reorder: set `order_index` on a list of sibling rows
 *
 * Everything else (days, subject roles, space slots, location roles,
 * lock rules) is human-authored only for now. AI proposals that
 * reference them are rejected.
 */

export type DayBlueprintDiffResource =
  | 'moment'
  | 'activity'
  | 'moment_action'
  | 'moment_placement';

export interface DayBlueprintDiffOpAdd {
  op: 'add';
  resource: DayBlueprintDiffResource;
  parent_id: number;
  data: Record<string, unknown>;
}

export interface DayBlueprintDiffOpUpdate {
  op: 'update';
  resource: DayBlueprintDiffResource;
  id: number;
  patch: Record<string, unknown>;
}

export interface DayBlueprintDiffOpRemove {
  op: 'remove';
  resource: DayBlueprintDiffResource;
  id: number;
}

export interface DayBlueprintDiffOpReorder {
  op: 'reorder';
  resource: DayBlueprintDiffResource;
  /** Siblings in the desired order (id → order_index). */
  order: Array<{ id: number; order_index: number }>;
}

export type DayBlueprintDiffOp =
  | DayBlueprintDiffOpAdd
  | DayBlueprintDiffOpUpdate
  | DayBlueprintDiffOpRemove
  | DayBlueprintDiffOpReorder;

export interface DayBlueprintDiff {
  version: 1;
  ops: DayBlueprintDiffOp[];
}

export const KNOWN_DIFF_RESOURCES: readonly DayBlueprintDiffResource[] = [
  'moment',
  'activity',
  'moment_action',
  'moment_placement',
] as const;

/**
 * Only these columns are writable via a diff. Everything else is
 * rejected at validation time — this is what prevents an AI proposal
 * from flipping e.g. `lock_flags` or `criticality` on a locked
 * moment.
 */
export const DIFF_ALLOWED_FIELDS: Record<DayBlueprintDiffResource, {
  add: readonly string[];
  update: readonly string[];
}> = {
  moment: {
    add: ['name', 'description', 'duration_seconds', 'order_index', 'is_key_moment'],
    update: ['name', 'description', 'duration_seconds', 'order_index'],
  },
  activity: {
    add: [
      'name', 'description', 'icon', 'color',
      'default_start_time', 'default_duration_minutes',
      'duration_min_minutes', 'duration_max_minutes',
      'order_index',
    ],
    update: [
      'name', 'description', 'icon', 'color',
      'default_start_time', 'default_duration_minutes',
      'duration_min_minutes', 'duration_max_minutes',
      'order_index',
    ],
  },
  moment_action: {
    add: ['subject_role_id', 'action_text', 'emphasis', 'notes', 'order_index'],
    update: ['action_text', 'emphasis', 'notes', 'order_index'],
  },
  moment_placement: {
    add: [
      'day_blueprint_space_slot_id', 'subject_role_id',
      'position_hint', 'facing_hint', 'notes', 'order_index',
    ],
    update: ['position_hint', 'facing_hint', 'notes', 'order_index'],
  },
};
