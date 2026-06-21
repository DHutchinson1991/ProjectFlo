import { DayDesignerDensityService } from './day-designer-density.service';
import { ABSOLUTE_MAX_MOMENTS, DEFAULT_DENSITY_LIBRARY, type DensityLibrary } from './day-designer-density.types';

const CUSTOM_LIBRARY: DensityLibrary = {
  rules: [
    { pattern: 'Ceremony', secondsPerMoment: 90, minMoments: 6, maxMoments: 20 },
    { pattern: 'speech', secondsPerMoment: 240, minMoments: 4, maxMoments: 10 },
  ],
  default: { secondsPerMoment: 360, minMoments: 3, maxMoments: 8 },
};

describe('DayDesignerDensityService.getDensity', () => {
  it('always returns DEFAULT_DENSITY_LIBRARY', async () => {
    const service = new DayDesignerDensityService();
    const lib = await service.getDensity(7);
    expect(lib).toEqual(DEFAULT_DENSITY_LIBRARY);
    expect(lib).toBe(DEFAULT_DENSITY_LIBRARY);
  });
});

describe('DayDesignerDensityService.pickRule', () => {
  const service = new DayDesignerDensityService();

  it('matches case-insensitively on substring', () => {
    const rule = service.pickRule(CUSTOM_LIBRARY, 'Anand Karaj Ceremony');
    expect(rule.secondsPerMoment).toBe(90);
  });

  it('returns the library default when no rule matches', () => {
    const rule = service.pickRule(CUSTOM_LIBRARY, 'Drinks Reception');
    expect(rule.secondsPerMoment).toBe(360);
  });

  it('chooses the first matching rule when multiple could match', () => {
    const lib: DensityLibrary = {
      rules: [
        { pattern: 'reception', secondsPerMoment: 200, minMoments: 4, maxMoments: 10 },
        { pattern: 'evening reception', secondsPerMoment: 100, minMoments: 5, maxMoments: 12 },
      ],
      default: { secondsPerMoment: 300, minMoments: 3, maxMoments: 8 },
    };
    expect(service.pickRule(lib, 'Evening Reception').secondsPerMoment).toBe(200);
  });
});

describe('DayDesignerDensityService.estimateMomentCount', () => {
  const service = new DayDesignerDensityService();

  it('uses the override when > 0, clamped to ABSOLUTE_MAX_MOMENTS', () => {
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 3600, 'Ceremony', 7)).toBe(7);
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 3600, 'Ceremony', 999)).toBe(ABSOLUTE_MAX_MOMENTS);
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 3600, 'Ceremony', 0)).not.toBe(0); // override falls through
  });

  it('divides duration by the matched rule and clamps to its window', () => {
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 3600, 'Ceremony')).toBe(20);
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 1800, 'Father of the Bride speech')).toBe(8);
  });

  it('uses the library default when no rule matches', () => {
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 3600, 'Drinks Reception')).toBe(8);
  });

  it('returns at least the rule minMoments when duration is 0', () => {
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 0, 'Ceremony')).toBe(6);
    expect(service.estimateMomentCount(CUSTOM_LIBRARY, 0, 'Drinks Reception')).toBe(3);
  });
});
