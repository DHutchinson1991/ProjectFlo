import { ShotDecisionService } from './shot-decision.service';

describe('ShotDecisionService', () => {
  let service: ShotDecisionService;

  beforeEach(() => {
    service = new ShotDecisionService();
  });

  it('keeps the planned assignment shot type when spatial inference conflicts', () => {
    const decision = service.resolve({
      assignmentShotType: 'CLOSE_UP',
      coverageShotType: 'MEDIUM_SHOT',
      spatialShotType: 'ESTABLISHING_SHOT',
    });

    expect(decision).toMatchObject({
      resolvedShotType: 'CLOSE_UP',
      rawSpatialShotType: 'ESTABLISHING_SHOT',
      source: 'assignment',
      shouldPersistShotType: true,
    });
  });

  it('recovers the coverage plan when the stored shot type only mirrors spatial inference', () => {
    const decision = service.resolve({
      assignmentShotType: 'ESTABLISHING_SHOT',
      coverageShotType: 'WIDE_SHOT',
      spatialShotType: 'ESTABLISHING_SHOT',
    });

    expect(decision).toMatchObject({
      resolvedShotType: 'WIDE_SHOT',
      rawSpatialShotType: 'ESTABLISHING_SHOT',
      source: 'coverage',
      shouldPersistShotType: true,
    });
  });

  it('falls back to coverage planning when the assignment has no editorial shot type', () => {
    const decision = service.resolve({
      assignmentShotType: null,
      coverageShotType: 'WIDE_SHOT',
      spatialShotType: 'ESTABLISHING_SHOT',
    });

    expect(decision).toMatchObject({
      resolvedShotType: 'WIDE_SHOT',
      rawSpatialShotType: 'ESTABLISHING_SHOT',
      source: 'coverage',
      shouldPersistShotType: true,
    });
  });

  it('uses the spatial shot only when no editorial intent exists', () => {
    const decision = service.resolve({
      assignmentShotType: null,
      coverageShotType: null,
      spatialShotType: 'ESTABLISHING_SHOT',
    });

    expect(decision).toMatchObject({
      resolvedShotType: 'ESTABLISHING_SHOT',
      rawSpatialShotType: 'ESTABLISHING_SHOT',
      source: 'spatial',
      shouldPersistShotType: false,
    });
  });
});
