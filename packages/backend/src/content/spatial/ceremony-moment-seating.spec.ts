import {
  buildCeremonyMotionTextForRole,
  inferCeremonyMomentSeated,
} from '@projectflo/shared';

describe('inferCeremonyMomentSeated', () => {
  it('marks pew-snapped parents as seated during observe moments', () => {
    const motionText = buildCeremonyMotionTextForRole({
      actionText: 'Observes the processional from her pew',
      momentName: 'Wedding Party Processional',
    });

    expect(
      inferCeremonyMomentSeated('Mother of Bride', motionText, { pewSnapped: true }),
    ).toBe(true);
  });

  it('keeps aisle/processional roles standing', () => {
    const motionText = buildCeremonyMotionTextForRole({
      actionText: 'Walks down the aisle with escort',
      momentName: 'Wedding Party Processional',
    });

    expect(inferCeremonyMomentSeated('Bride', motionText, { pewSnapped: false })).toBe(false);
  });

  it('defaults guest-like roles to seated unless movement is implied', () => {
    const seatedText = buildCeremonyMotionTextForRole({
      actionText: 'Settled and seated before the processional begins',
      momentName: 'Guests Arrive',
    });
    const movingText = buildCeremonyMotionTextForRole({
      actionText: 'Stand for the processional',
      momentName: 'Wedding Party Processional',
    });

    expect(inferCeremonyMomentSeated('Guests', seatedText)).toBe(true);
    expect(inferCeremonyMomentSeated('Guests', movingText)).toBe(false);
  });
});
