import {
  angleToPointDeg,
  computeFraming,
  inferShotTypeFromFocalSubjects,
  inferShotTypeWithHysteresis,
  resolveFocalSubjectIds,
  rotationTowardPointsDeg,
  subjectsFitInFov,
  shotTypeAbbrev,
  type FramingSubject,
} from '@projectflo/shared';

describe('shot-framing focal contract', () => {
  const subjects: FramingSubject[] = [
    { id: 1, x: 500, y: 400, name: 'Bride' },
    { id: 2, x: 200, y: 700, name: 'Guests', isGuestLike: true },
  ];

  it('uses focal non-guest subjects for shot classification', () => {
    const byId = new Map(subjects.map((s) => [s.id, s]));
    const focal = resolveFocalSubjectIds([2, 1], byId);
    expect(focal).toEqual([1]);

    const shot = inferShotTypeFromFocalSubjects(
      { x: 500, y: 520, fovDegrees: 60 },
      [subjects[0]],
    );
    expect(shot).toBe('CLOSE_UP');
  });

  it('linked mode persists geometric shot as resolved shot', () => {
    const result = computeFraming({
      camera: { x: 500, y: 520, rotation: 0, fovDegrees: 60 },
      subjects,
      subjectIds: [1, 2],
      currentShotType: 'MEDIUM_SHOT',
    });
    expect(result.shotCoupling).toBe('linked');
    expect(result.shouldPersistShot).toBe(true);
    expect(result.resolvedShot).toBe('CLOSE_UP');
    expect(result.focalSubjectIds).toEqual([1]);
  });

  it('pinned mode keeps editorial shot type', () => {
    const result = computeFraming({
      camera: { x: 500, y: 520, rotation: 0, fovDegrees: 60 },
      subjects,
      subjectIds: [1, 2],
      currentShotType: 'REACTION_SHOT',
    });
    expect(result.shotCoupling).toBe('pinned');
    expect(result.shouldPersistShot).toBe(false);
    expect(result.resolvedShot).toBe('REACTION_SHOT');
  });

  it('abbreviates shot badges for floor plan UI', () => {
    expect(shotTypeAbbrev('MEDIUM_SHOT')).toBe('MS');
    expect(shotTypeAbbrev('CLOSE_UP')).toBe('CU');
  });

  it('hysteresis holds wider shot until exit threshold is crossed', () => {
    // ~210 FOV-scaled distance: naive MS, but from MS need >225 to widen to WS
    expect(inferShotTypeWithHysteresis([210], 60, 'MEDIUM_SHOT')).toBe('MEDIUM_SHOT');
    expect(inferShotTypeWithHysteresis([230], 60, 'MEDIUM_SHOT')).toBe('WIDE_SHOT');
  });

  it('explicit PINNED coupling overrides geometric defaults', () => {
    const result = computeFraming({
      camera: { x: 500, y: 520, rotation: 0, fovDegrees: 60 },
      subjects,
      subjectIds: [1, 2],
      currentShotType: 'MEDIUM_SHOT',
      shotCoupling: 'PINNED',
    });
    expect(result.shotCoupling).toBe('pinned');
    expect(result.shouldPersistShot).toBe(false);
    expect(result.resolvedShot).toBe('MEDIUM_SHOT');
  });

  it('uses north-up angle convention (0° faces up)', () => {
    expect(angleToPointDeg(500, 500, 500, 400)).toBe(0);
    expect(angleToPointDeg(500, 500, 600, 500)).toBe(90);
    expect(rotationTowardPointsDeg(500, 520, [{ x: 500, y: 400 }])).toBe(0);
  });

  it('detects subjects outside the camera FOV cone', () => {
    const fits = subjectsFitInFov(
      { x: 500, y: 520, rotation: 0, fovDegrees: 60 },
      [{ x: 500, y: 400 }],
    );
    const misses = subjectsFitInFov(
      { x: 500, y: 520, rotation: 180, fovDegrees: 60 },
      [{ x: 500, y: 400 }],
    );
    expect(fits).toBe(true);
    expect(misses).toBe(false);
  });
});
