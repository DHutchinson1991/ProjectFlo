/**
 * Day Designer "moment density" library — controls how many moments the AI
 * generator carves a single activity into when sizing its skeleton. Per-name
 * rules win over the library default; an explicit per-activity override on
 * the activity row wins over both.
 *
 * The active library is always {@link DEFAULT_DENSITY_LIBRARY} (product defaults).
 */

export interface DensityRule {
  /** Case-insensitive substring matched against the activity's name. */
  pattern: string;
  /** Average number of seconds of activity time that map to one moment. */
  secondsPerMoment: number;
  /** Lower clamp on the resulting moment count (after dividing duration). */
  minMoments: number;
  /** Upper clamp on the resulting moment count (after dividing duration). */
  maxMoments: number;
}

export interface DensityLibraryDefault {
  secondsPerMoment: number;
  minMoments: number;
  maxMoments: number;
}

export interface DensityLibrary {
  rules: DensityRule[];
  default: DensityLibraryDefault;
}

/** Hard absolute ceiling for any per-activity override — stops a typo in the
 *  UI from blowing up the prefixItems schema. */
export const ABSOLUTE_MAX_MOMENTS = 24;

/**
 * Sensible out-of-the-box library tuned for UK weddings.
 *
 * Pacing intent (seconds per moment):
 *   ~160s = ceremony (UK civil-style depth: ~17 beats in a 45m block; capped at maxMoments)
 *   240s = mid-dense               (speeches, portraits)
 *   300s = standard default for unmatched names
 *   360-480s = light / narrative    (prep, reception, evening party)
 */
export const DEFAULT_DENSITY_LIBRARY: DensityLibrary = {
  rules: [
    { pattern: 'ceremony', secondsPerMoment: 160, minMoments: 8, maxMoments: 20 },
    { pattern: 'first dance', secondsPerMoment: 60, minMoments: 4, maxMoments: 8 },
    { pattern: 'speech', secondsPerMoment: 240, minMoments: 4, maxMoments: 12 },
    { pattern: 'portrait', secondsPerMoment: 240, minMoments: 4, maxMoments: 12 },
    { pattern: 'prep', secondsPerMoment: 360, minMoments: 4, maxMoments: 10 },
    { pattern: 'reception', secondsPerMoment: 420, minMoments: 4, maxMoments: 12 },
    { pattern: 'evening party', secondsPerMoment: 480, minMoments: 4, maxMoments: 12 },
  ],
  default: { secondsPerMoment: 300, minMoments: 3, maxMoments: 16 },
};
