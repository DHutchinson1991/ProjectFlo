import { BadRequestException } from '@nestjs/common';
import { type DensityLibrary } from './day-designer-density.types';
import {
  buildSkeleton,
  collectOutlineValidationFailures,
  normalizeOutlineDurations,
  sanitizeRitualOnlyCeremonyOutline,
  validateOutline,
} from './day-blueprint-outline.rules';

describe('buildSkeleton', () => {
  it('uses default_duration_minutes with the DEFAULT library and respects scoping', () => {
    const skeleton = buildSkeleton(
      [
        { id: 1, name: 'Generic Long Block', default_duration_minutes: 60 },
        { id: 2, name: 'Generic Short Block', default_duration_minutes: 5 },
        { id: 3, name: 'Generic Massive Block', default_duration_minutes: 240 },
      ],
      null,
    );
    expect(skeleton).toEqual([
      expect.objectContaining({ activityId: 1, momentCount: 12, targetDurationSeconds: 3600 }),
      expect.objectContaining({ activityId: 2, momentCount: 3, targetDurationSeconds: 300 }),
      expect.objectContaining({ activityId: 3, momentCount: 16, targetDurationSeconds: 14400 }),
    ]);
  });

  it('scopes to a single activity when scopedActivityId is set', () => {
    const skeleton = buildSkeleton(
      [
        { id: 1, name: 'A', default_duration_minutes: 30 },
        { id: 2, name: 'B', default_duration_minutes: 30 },
      ],
      2,
    );
    expect(skeleton).toHaveLength(1);
    expect(skeleton[0].activityId).toBe(2);
  });

  it('uses an injected estimator that consults the density library by name', () => {
    const library: DensityLibrary = {
      rules: [{ pattern: 'ceremony', secondsPerMoment: 90, minMoments: 8, maxMoments: 20 }],
      default: { secondsPerMoment: 600, minMoments: 3, maxMoments: 6 },
    };
    const estimator = jest.fn((dur, name) => {
      const rule = library.rules.find((r) => name.toLowerCase().includes(r.pattern)) ?? library.default;
      return Math.max(rule.minMoments, Math.min(rule.maxMoments, Math.ceil(dur / rule.secondsPerMoment)));
    });
    const skeleton = buildSkeleton(
      [
        { id: 1, name: 'Catholic Ceremony', default_duration_minutes: 60 },
        { id: 2, name: 'Cocktails', default_duration_minutes: 60 },
      ],
      null,
      library,
      estimator,
    );
    expect(skeleton[0].momentCount).toBe(20);
    expect(skeleton[1].momentCount).toBe(6);
    expect(estimator).toHaveBeenCalledTimes(2);
  });

  it('honours the per-activity target_moment_count override', () => {
    const skeleton = buildSkeleton(
      [
        { id: 1, name: 'Generic Block', default_duration_minutes: 60, target_moment_count: 7 },
        { id: 2, name: 'Generic Block', default_duration_minutes: 60, target_moment_count: null },
      ],
      null,
    );
    expect(skeleton[0].momentCount).toBe(7);
    expect(skeleton[1].momentCount).toBe(12);
  });

  it('copies trimmed non-empty description onto skeleton slots and omits when blank', () => {
    const skeleton = buildSkeleton(
      [
        { id: 1, name: 'Ceremony', default_duration_minutes: 15, description: '  Ritual only  ' },
        { id: 2, name: 'B', default_duration_minutes: 15, description: null },
        { id: 3, name: 'C', default_duration_minutes: 15, description: '   ' },
      ],
      null,
    );
    expect(skeleton[0].description).toBe('Ritual only');
    expect(skeleton[1].description).toBeUndefined();
    expect(skeleton[2].description).toBeUndefined();
  });
});

describe('validateOutline', () => {
  const skeleton = [
    { activityId: 1, name: 'Prep Block', normalizedName: 'prep block', targetDurationSeconds: 1800, momentCount: 6 },
  ];

  it('throws when outline activity count is wrong', () => {
    expect(() => validateOutline({ activities: [] }, skeleton as never)).toThrow(BadRequestException);
  });

  it('throws when moment count is below the skeleton target', () => {
    expect(() =>
      validateOutline(
        {
          activities: [{ name: 'Prep Block', moments: [{ name: 'A', duration_seconds: 300 }] }],
        } as never,
        skeleton as never,
      ),
    ).toThrow(/expected exactly 6 moments, got 1/);
  });

  it('throws when sum of durations falls outside the +/-10% window', () => {
    const moments = Array.from({ length: 6 }, () => ({ name: 'X', duration_seconds: 60 }));
    expect(() => validateOutline({ activities: [{ name: 'Prep Block', moments }] } as never, skeleton as never))
      .toThrow(/durations sum to 360s/);
  });

  it('passes when count and sum are within tolerance', () => {
    const moments = Array.from({ length: 6 }, () => ({ name: 'X', duration_seconds: 300 }));
    expect(() => validateOutline({ activities: [{ name: 'Prep Block', moments }] } as never, skeleton as never)).not.toThrow();
  });

  it('collectOutlineValidationFailures matches validateOutline ritual-only Ceremony gaps', () => {
    const ceremonySkeleton = [
      {
        activityId: 2,
        name: 'Ceremony',
        normalizedName: 'ceremony',
        targetDurationSeconds: 2700,
        momentCount: 3,
      },
    ];
    const bad = {
      activities: [
        {
          name: 'Ceremony',
          moments: [
            { name: 'Recessional Too Early', duration_seconds: 300 },
            { name: 'Tail Junk', duration_seconds: 300 },
            { name: 'Farewell Glance', duration_seconds: 300 },
          ],
        },
      ],
    };
    const failures = collectOutlineValidationFailures(bad as never, ceremonySkeleton as never);
    expect(failures.length).toBeGreaterThan(0);
    expect(() => validateOutline(bad as never, ceremonySkeleton as never)).toThrow(BadRequestException);
    expect(() => validateOutline(bad as never, ceremonySkeleton as never)).toThrow(/Recessional|farewell glance/i);
  });

  it('sanitizeRitualOnlyCeremonyOutline fixes misplaced recessional, processional last title, and quiet reflection', () => {
    const ceremonySkeleton = [
      {
        activityId: 2,
        name: 'Ceremony',
        normalizedName: 'ceremony',
        targetDurationSeconds: 2700,
        momentCount: 17,
      },
    ];
    const moments = Array.from({ length: 17 }, (_, j) => {
      const duration_seconds = 150;
      if (j === 14) return { name: 'Moment of Quiet Reflection', duration_seconds };
      if (j === 15) return { name: 'Couple Recessional (mistimed)', duration_seconds };
      if (j === 16) return { name: 'Concluding Processional Exit', duration_seconds };
      return { name: `Ceremony beat ${j + 1}`, duration_seconds };
    });
    const outline = { activities: [{ name: 'Ceremony', moments }] };

    normalizeOutlineDurations(outline as never, ceremonySkeleton as never);
    sanitizeRitualOnlyCeremonyOutline(outline as never, ceremonySkeleton as never);

    expect(collectOutlineValidationFailures(outline as never, ceremonySkeleton as never)).toEqual([]);
    expect(() => validateOutline(outline as never, ceremonySkeleton as never)).not.toThrow();
    const names = outline.activities[0].moments.map((m) => m.name);
    expect(names.filter((n) => /\brecessional\b/i.test(n))).toHaveLength(1);
    expect(names.at(-1)).toMatch(/\brecessional\b/i);
  });

  it('rejects ritual-only Ceremony when recessional is not last or tail contains cocktail/photos', () => {
    const ceremonySkeleton = [
      {
        activityId: 2,
        name: 'Ceremony',
        normalizedName: 'ceremony',
        targetDurationSeconds: 2700,
        momentCount: 4,
      },
    ];
    const bad = {
      activities: [
        {
          name: 'Ceremony',
          moments: [
            { name: 'Seating', duration_seconds: 300 },
            { name: 'Recessional Start', duration_seconds: 300 },
            { name: 'Family Group Photos', duration_seconds: 300 },
            { name: 'Transition to Cocktail Hour', duration_seconds: 300 },
          ],
        },
      ],
    };
    expect(() => validateOutline(bad as never, ceremonySkeleton as never)).toThrow(
      /Recessional.*final|disallowed phrase|must be only in the final moment/i,
    );
  });
});

describe('normalizeOutlineDurations', () => {
  const skeleton = [
    { activityId: 1, name: 'Ceremony', normalizedName: 'ceremony', targetDurationSeconds: 2700, momentCount: 15 },
  ];

  it('rescales an over-budget outline so the sum matches the target exactly', () => {
    const moments = [300, 240, 360, 180, 150, 210, 390, 450, 180, 120, 240, 150, 180, 300, 260].map((d, idx) => ({
      name: idx === 14 ? 'Recessional' : 'M',
      duration_seconds: d,
    }));
    const outline = { activities: [{ name: 'Ceremony', moments }] };

    normalizeOutlineDurations(outline as never, skeleton as never);

    const sum = outline.activities[0].moments.reduce((acc, m) => acc + (m.duration_seconds ?? 0), 0);
    expect(sum).toBe(2700);
    expect(() => validateOutline(outline as never, skeleton as never)).not.toThrow();
    for (const moment of outline.activities[0].moments) {
      expect(moment.duration_seconds).toBeGreaterThanOrEqual(30);
      expect(moment.duration_seconds).toBeLessThanOrEqual(1200);
    }
  });

  it('rescales an under-budget outline so the sum matches the target exactly', () => {
    const moments = Array.from({ length: 15 }, (_, idx) => ({
      name: idx === 14 ? 'Recessional' : 'M',
      duration_seconds: 60,
    }));
    const outline = { activities: [{ name: 'Ceremony', moments }] };

    normalizeOutlineDurations(outline as never, skeleton as never);

    const sum = outline.activities[0].moments.reduce((acc, m) => acc + (m.duration_seconds ?? 0), 0);
    expect(sum).toBe(2700);
  });

  it('preserves relative pacing — the originally longest moment stays the longest', () => {
    const moments = [
      { name: 'short', duration_seconds: 100 },
      { name: 'climax', duration_seconds: 1000 },
      { name: 'mid', duration_seconds: 300 },
    ];
    const tight = [{ activityId: 9, name: 'X', normalizedName: 'x', targetDurationSeconds: 1800, momentCount: 3 }];
    const outline = { activities: [{ name: 'X', moments }] };

    normalizeOutlineDurations(outline as never, tight as never);

    const seconds = outline.activities[0].moments.map((m) => m.duration_seconds ?? 0);
    expect(seconds.reduce((a, b) => a + b, 0)).toBe(1800);
    expect(Math.max(...seconds)).toBe(seconds[1]);
  });

  it('falls back to an even split when every moment duration is zero', () => {
    const moments = Array.from({ length: 3 }, () => ({ name: 'M', duration_seconds: 0 }));
    const tight = [{ activityId: 9, name: 'X', normalizedName: 'x', targetDurationSeconds: 900, momentCount: 3 }];
    const outline = { activities: [{ name: 'X', moments }] };

    normalizeOutlineDurations(outline as never, tight as never);

    const sum = outline.activities[0].moments.reduce((acc, m) => acc + (m.duration_seconds ?? 0), 0);
    expect(sum).toBe(900);
  });

  it('does nothing when the activity has no duration target', () => {
    const moments = [{ name: 'A', duration_seconds: 90 }];
    const noTarget = [{ activityId: 9, name: 'X', normalizedName: 'x', targetDurationSeconds: 0, momentCount: 1 }];
    const outline = { activities: [{ name: 'X', moments }] };

    normalizeOutlineDurations(outline as never, noTarget as never);

    expect(outline.activities[0].moments[0].duration_seconds).toBe(90);
  });
});
