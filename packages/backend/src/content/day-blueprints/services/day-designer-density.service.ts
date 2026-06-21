import { Injectable } from '@nestjs/common';
import {
  ABSOLUTE_MAX_MOMENTS,
  DEFAULT_DENSITY_LIBRARY,
  type DensityLibrary,
} from './day-designer-density.types';

/**
 * Moment-density math for the Day Designer AI skeleton builder. Brand-level
 * overrides were removed; generation always uses {@link DEFAULT_DENSITY_LIBRARY}.
 */
@Injectable()
export class DayDesignerDensityService {
  /** Product-default density library (ignores legacy `brand_settings` rows). */
  getDensity(_brandId: number): Promise<DensityLibrary> {
    return Promise.resolve(DEFAULT_DENSITY_LIBRARY);
  }

  /**
   * Pick the rule that matches `activityName` (first hit wins, case-insensitive
   * substring), or fall back to the library default.
   */
  pickRule(library: DensityLibrary, activityName: string): {
    secondsPerMoment: number;
    minMoments: number;
    maxMoments: number;
  } {
    const needle = activityName.trim().toLowerCase();
    const hit = library.rules.find((rule) => needle.includes(rule.pattern.trim().toLowerCase()));
    if (hit) {
      return {
        secondsPerMoment: hit.secondsPerMoment,
        minMoments: hit.minMoments,
        maxMoments: hit.maxMoments,
      };
    }
    return library.default;
  }

  /**
   * Final moment count an activity should be carved into.
   *  - If the activity has an explicit `target_moment_count` override > 0,
   *    use that (still clamped to `ABSOLUTE_MAX_MOMENTS`).
   *  - Otherwise pick the matching rule, divide duration / secondsPerMoment,
   *    and clamp to that rule's [min, max] window.
   *  - Activities with zero duration always get the rule's `minMoments` floor
   *    (or 3, whichever is larger) so the schema still has shape.
   */
  estimateMomentCount(
    library: DensityLibrary,
    durationSeconds: number,
    activityName: string,
    override?: number | null,
  ): number {
    if (override != null && override > 0) {
      return Math.max(1, Math.min(ABSOLUTE_MAX_MOMENTS, Math.floor(override)));
    }
    const rule = this.pickRule(library, activityName);
    if (durationSeconds <= 0) {
      return Math.max(rule.minMoments, 3);
    }
    const raw = Math.ceil(durationSeconds / rule.secondsPerMoment);
    return Math.max(rule.minMoments, Math.min(rule.maxMoments, raw));
  }
}
