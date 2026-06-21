import {
  collectCeremonyProcessionalRoleDiagnostics,
  validateExpansion,
} from './day-blueprint-expansion.rules';

describe('validateExpansion', () => {
  it('throws when any moment has no subject_actions', () => {
    expect(() =>
      validateExpansion(
        'Ceremony',
        { moments: [{ subject_actions: [] }, { subject_actions: [{ subject_role: 'Bride', action_text: 'X' }] }] },
        ['Bride'],
      ),
    ).toThrow(/missing subject_actions/);
  });

  it('throws when a subject_role is not on the roster', () => {
    expect(() =>
      validateExpansion(
        'Ceremony',
        { moments: [{ subject_actions: [{ subject_role: 'UnknownRole', action_text: 'X' }] }] },
        ['Bride'],
      ),
    ).toThrow(/not on the roster/);
  });
});

describe('collectCeremonyProcessionalRoleDiagnostics', () => {
  it('flags groom-side entry inside bride-focused entrance moments', () => {
    const diagnostics = collectCeremonyProcessionalRoleDiagnostics('Ceremony', [
      {
        name: "Processional: Bride's Entrance",
        subject_actions: [
          { subject_role: 'Bride', action_text: 'walking down the aisle' },
          { subject_role: 'Groom', action_text: 'enters from the doorway' },
          { subject_role: 'Groomsmen', action_text: 'walking in behind groom' },
        ],
      },
    ]);

    expect(diagnostics.some((item) => item.issueCode === 'unexpected_groom_side_entry')).toBe(true);
  });

  it('flags groom-side party entry in bridal-party-focused moments', () => {
    const diagnostics = collectCeremonyProcessionalRoleDiagnostics('Ceremony', [
      {
        name: 'Processional: Bridal Party Entry',
        subject_actions: [
          { subject_role: 'Bridesmaids', action_text: 'walking toward the altar' },
          { subject_role: 'Groomsmen', action_text: 'entering in formation' },
        ],
      },
    ]);

    expect(
      diagnostics.some((item) => item.issueCode === 'unexpected_groom_side_in_bridal_party'),
    ).toBe(true);
  });

  it('flags bride-focused entrance moments that omit groom anchor presence', () => {
    const diagnostics = collectCeremonyProcessionalRoleDiagnostics('Ceremony', [
      {
        name: "Processional: Bride's Entrance",
        subject_actions: [
          { subject_role: 'Bride', action_text: 'walking down the aisle' },
          { subject_role: 'Flower Girl', action_text: 'sprinkling petals down the aisle' },
        ],
      },
    ]);

    expect(
      diagnostics.some((item) => item.issueCode === 'missing_groom_anchor_in_bride_entrance'),
    ).toBe(true);
  });

  it('does not flag shared wedding-party entry moments', () => {
    const diagnostics = collectCeremonyProcessionalRoleDiagnostics('Ceremony', [
      {
        name: 'Processional: Wedding Party Entry',
        subject_actions: [
          { subject_role: 'Bridesmaids', action_text: 'walking in pairs' },
          { subject_role: 'Groomsmen', action_text: 'walking in pairs' },
        ],
      },
    ]);

    expect(diagnostics).toEqual([]);
  });
});
