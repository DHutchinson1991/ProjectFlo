/** Thrown / propagated when the user cancels package AI planning via POST cancel. */
export const PLANNING_CANCELLED_BY_USER_MESSAGE = 'CANCELLED_BY_USER';

export function assertPlanningNotAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new Error(PLANNING_CANCELLED_BY_USER_MESSAGE);
  }
}

export function isPlanningCancelledError(err: unknown): boolean {
  return err instanceof Error && err.message === PLANNING_CANCELLED_BY_USER_MESSAGE;
}
