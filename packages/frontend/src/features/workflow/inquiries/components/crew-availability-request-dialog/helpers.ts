import type { InquiryCrewAvailabilityRow } from '@/features/workflow/inquiries/types';
import type { TaskAutoGenerationPreviewTask } from '@/features/catalog/task-library/types';
import { ADMIN_PHASES } from './types';
import type { TaskSummary } from './types';

export function buildTaskSummary(
  rows: InquiryCrewAvailabilityRow[],
  crewName: string,
  previewTasks: TaskAutoGenerationPreviewTask[],
): TaskSummary | null {
  const roleNames = new Set(
    rows
      .flatMap((r) => [r.job_role?.display_name, r.job_role?.name, r.label])
      .filter((n): n is string => Boolean(n)),
  );
  const normName = crewName.trim().toLowerCase();

  const tasks = previewTasks.filter((t) => {
    if (ADMIN_PHASES.has(t.phase)) return false;
    if (t.assigned_to_name && t.assigned_to_name.trim().toLowerCase() === normName) return true;
    if (t.role_name && roleNames.has(t.role_name)) return true;
    return false;
  });

  if (tasks.length === 0) return null;

  const sum = (phase: string[]) =>
    tasks.filter((t) => phase.includes(t.phase)).reduce((s, t) => s + (t.total_hours ?? 0), 0);

  return {
    before: sum(['Creative_Development', 'Pre_Production']),
    onday: sum(['Production']),
    after: sum(['Post_Production', 'Delivery']),
    totalCost: tasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0),
  };
}

export function buildCostByRole(
  previewTasks: TaskAutoGenerationPreviewTask[],
): Map<string, number> {
  const costByRole = new Map<string, number>();
  for (const t of previewTasks) {
    if (!ADMIN_PHASES.has(t.phase) && t.role_name && (t.estimated_cost ?? 0) > 0) {
      costByRole.set(t.role_name, (costByRole.get(t.role_name) ?? 0) + (t.estimated_cost ?? 0));
    }
  }
  return costByRole;
}

export function buildTaskHoursByRole(
  rows: InquiryCrewAvailabilityRow[],
  crewName: string,
  previewTasks: TaskAutoGenerationPreviewTask[],
): Map<string, { before: number; onday: number; after: number }> {
  const PHASE_TO_GROUP: Partial<Record<string, 'before' | 'onday' | 'after'>> = {
    Creative_Development: 'before',
    Pre_Production: 'before',
    Production: 'onday',
    Post_Production: 'after',
    Delivery: 'after',
  };
  const normName = crewName.trim().toLowerCase();
  const roleNames = new Set(
    rows
      .flatMap((r) => [r.job_role?.display_name, r.job_role?.name, r.label])
      .filter((n): n is string => Boolean(n)),
  );
  const taskHoursByRole = new Map<string, { before: number; onday: number; after: number }>();
  for (const t of previewTasks) {
    if (ADMIN_PHASES.has(t.phase)) continue;
    const matches =
      (t.assigned_to_name && t.assigned_to_name.trim().toLowerCase() === normName) ||
      (t.role_name && roleNames.has(t.role_name));
    if (!matches) continue;
    const key = t.role_name ?? 'General';
    if (!taskHoursByRole.has(key)) taskHoursByRole.set(key, { before: 0, onday: 0, after: 0 });
    const group = PHASE_TO_GROUP[t.phase];
    if (group) taskHoursByRole.get(key)![group] += t.total_hours ?? 0;
  }
  return taskHoursByRole;
}

export const fmtHours = (h: number) => (h > 0 ? `${h}h` : null);
