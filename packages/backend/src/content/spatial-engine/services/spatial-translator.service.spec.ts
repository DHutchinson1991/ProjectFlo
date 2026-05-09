import { SpatialTranslatorService } from './spatial-translator.service';

describe('SpatialTranslatorService', () => {
  it('treats narrow FOV cameras as tighter framing at the same distance', () => {
    const service = new SpatialTranslatorService();
    const subjects = [
      {
        name: 'Bride',
        x: 500,
        y: 150,
        isGroup: false,
      },
    ];

    const wideFrame = service.translate(
      { x: 500, y: 500, rotation: 0, fovDegrees: 60 },
      subjects,
    );
    const narrowFrame = service.translate(
      { x: 500, y: 500, rotation: 0, fovDegrees: 30 },
      subjects,
    );

    expect(wideFrame.inferredShotType).toBe('ESTABLISHING_SHOT');
    expect(narrowFrame.inferredShotType).toBe('MEDIUM_SHOT');
  });
});