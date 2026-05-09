import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Thrown when a downstream (film-side) flow is asked to run but the upstream
 * package planning data it depends on does not exist.
 *
 * Ownership rule: the package activity planner is the only system allowed to
 * create PackageActivityMoment rows, presence, and subject actions. Scene
 * preparation, film build, blocking, and frame rendering must fail fast rather
 * than silently regenerating, backfilling, or inferring missing data.
 *
 * Maps to HTTP 422 Unprocessable Entity — the request is well-formed but the
 * server refuses to act because a required precondition is not met.
 */
export class MissingPlanningDataError extends UnprocessableEntityException {
  constructor(
    readonly missing: string,
    readonly context: Record<string, unknown> = {},
  ) {
    super({
      message: `Missing required planning data: ${missing}`,
      missing,
      context,
      hint: 'Run package activity planning first. Film-side flows will not create or repair this data.',
    });
  }
}
