/**
 * Mirrors frontend moment-subject-context rules for blueprint action precedence.
 * Keep in sync with packages/frontend/.../utils/moment-subject-context.ts
 */

type MomentAction = {
  action_text: string;
  subject_role?: { role_name: string };
};

function resolveAction(
  moment: {
    actions?: MomentAction[];
    subject_actions?: Record<string, string | { action: string | null } | null> | null;
  } | null,
  roleName: string,
): string | null {
  if (!moment) return null;
  const normalized = roleName.trim().toLowerCase();
  const fromActions = moment.actions?.find(
    (row) => row.subject_role?.role_name?.trim().toLowerCase() === normalized,
  );
  if (fromActions) return fromActions.action_text;
  const legacy = moment.subject_actions?.[roleName];
  if (!legacy) return null;
  return typeof legacy === 'string' ? legacy : legacy.action;
}

describe('blueprint moment action precedence', () => {
  it('prefers package_activity_moment_actions shape over subject_actions JSON', () => {
    expect(
      resolveAction(
        {
          actions: [{ action_text: 'walks down aisle', subject_role: { role_name: 'Bride' } }],
          subject_actions: { Bride: 'stale json' },
        },
        'Bride',
      ),
    ).toBe('walks down aisle');
  });

  it('falls back to subject_actions when actions are absent', () => {
    expect(resolveAction({ subject_actions: { Groom: 'waits' } }, 'Groom')).toBe('waits');
  });
});
