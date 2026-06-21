import { isPreCeremonyFloorActivity, normalizeActivityNameForPreCeremonyCheck } from '@projectflo/shared';

describe('pre-ceremony floor activity (shared)', () => {
  it('isPreCeremonyFloorActivity: Pre-Ceremony & Guest Seating', () => {
    expect(isPreCeremonyFloorActivity({ name: 'Pre-Ceremony & Guest Seating' })).toBe(true);
  });

  it('isPreCeremonyFloorActivity: leading spaces + pre-ceremony', () => {
    expect(isPreCeremonyFloorActivity({ name: '  pre-ceremony reception' })).toBe(true);
  });

  it('isPreCeremonyFloorActivity: false for Ceremony', () => {
    expect(isPreCeremonyFloorActivity({ name: 'Ceremony' })).toBe(false);
  });

  it('isPreCeremonyFloorActivity: false for Catholic Ceremony', () => {
    expect(isPreCeremonyFloorActivity({ name: 'Catholic Ceremony' })).toBe(false);
  });

  it('isPreCeremonyFloorActivity: false for Anand Karaj Ceremony', () => {
    expect(isPreCeremonyFloorActivity({ name: 'Anand Karaj Ceremony' })).toBe(false);
  });

  it('isPreCeremonyFloorActivity: null/empty', () => {
    expect(isPreCeremonyFloorActivity(null)).toBe(false);
    expect(isPreCeremonyFloorActivity({ name: '' })).toBe(false);
  });

  it('normalizeActivityNameForPreCeremonyCheck', () => {
    expect(normalizeActivityNameForPreCeremonyCheck('Pre-Ceremony & Guest Seating')).toBe(
      'pre ceremony guest seating',
    );
  });
});
