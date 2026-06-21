import { buildMomentSubjectSeeds, shouldIncludeFillerRole } from '../../../../prisma/seeds/moonrise-wedding-blueprint-templates.seed';

describe('buildMomentSubjectSeeds', () => {
  it('does not assign bride walk to Wedding Party Processional', () => {
    const seeds = buildMomentSubjectSeeds('Ceremony', 'Wedding Party Processional');
    const roles = seeds.map((s) => s.roleKey);
    expect(roles).not.toContain('bride');
    expect(roles).toContain('bridesmaids');
    expect(roles).toContain('groom');
  });

  it("assigns bride and escort to Bride's Processional", () => {
    const seeds = buildMomentSubjectSeeds('Ceremony', "Bride's Processional");
    const roles = seeds.map((s) => s.roleKey);
    expect(roles).toContain('bride');
    expect(roles).toContain('father_of_bride');
  });

  it('handles Catholic wedding party processional title', () => {
    const seeds = buildMomentSubjectSeeds(
      'Catholic Ceremony',
      'Processional — Wedding Party Entrance',
    );
    const roles = seeds.map((s) => s.roleKey);
    expect(roles).not.toContain('bride');
    expect(roles).toContain('bridesmaids');
  });

  it('keeps bridesmaids off guest arrival in pre-ceremony', () => {
    const seeds = buildMomentSubjectSeeds('Pre-Ceremony & Guest Seating', 'Guest Arrival & Mingling');
    const roles = seeds.map((s) => s.roleKey);
    expect(roles).toContain('guests');
    expect(roles).toContain('groomsmen');
    expect(roles).not.toContain('bridesmaids');
  });

  it('routes Processional to Darbar Hall for Anand Karaj', () => {
    const seeds = buildMomentSubjectSeeds('Anand Karaj Ceremony', 'Processional to Darbar Hall');
    const roles = seeds.map((s) => s.roleKey);
    expect(roles).toContain('bride');
    expect(roles).toContain('groom');
  });
});

describe('shouldIncludeFillerRole', () => {
  it('excludes bride from wedding party processional filler', () => {
    expect(
      shouldIncludeFillerRole('Ceremony', 'Wedding Party Processional', 'bride'),
    ).toBe(false);
  });

  it('includes bride for exchange of vows filler', () => {
    expect(
      shouldIncludeFillerRole('Ceremony', 'Exchange of Vows', 'bride'),
    ).toBe(true);
  });

  it('excludes bride from pre-ceremony guest arrival filler', () => {
    expect(
      shouldIncludeFillerRole('Pre-Ceremony & Guest Seating', 'Guest Arrival & Mingling', 'bride'),
    ).toBe(false);
  });

  it('includes groom at front during pre-ceremony final seating filler', () => {
    expect(
      shouldIncludeFillerRole('Pre-Ceremony & Guest Seating', 'Final Seating & Room Quiet', 'groom'),
    ).toBe(true);
  });
});
