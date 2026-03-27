/**
 * @projectflo/shared — Hours summation helpers
 *
 * Small pure utilities for summing hours from task arrays.
 * Eliminates the repeated inline `.reduce(...)` patterns scattered
 * across frontend components.
 */

/**
 * Sum `effort_hours` across task-library items.
 * Handles Prisma Decimal (string) and number inputs.
 */
export function sumEffortHours(
  tasks: ReadonlyArray<{ effort_hours?: number | string | null }>,
): number {
  return tasks.reduce(
    (sum, t) => sum + (t.effort_hours != null ? Number(t.effort_hours) : 0),
    0,
  );
}

/**
 * Sum `estimated_hours` across active / project / inquiry tasks.
 */
export function sumEstimatedHours(
  tasks: ReadonlyArray<{ estimated_hours?: number | null }>,
): number {
  return tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
}

/**
 * Sum `total_hours` across auto-generation preview rows.
 */
export function sumTotalHours(
  tasks: ReadonlyArray<{ total_hours?: number | null }>,
): number {
  return tasks.reduce((sum, t) => sum + (t.total_hours || 0), 0);
}
