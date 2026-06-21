export interface MomentActionRecord {
  subject_role_id?: number;
  action_text: string;
  emphasis?: string | null;
  subject_role?: { id?: number; role_name: string };
}

export interface MomentSubjectContextSource {
  actions?: MomentActionRecord[];
  subject_actions?: Record<string, string | { action: string | null; focal: string } | null> | null;
}

export function resolveMomentSubjectContext(
  moment: MomentSubjectContextSource | null,
  subject: { name: string; role_template?: { role_name?: string | null } | null } | null,
): { action: string | null; focal: string | null } | null {
  if (!moment || !subject) return null;

  const roleKeys = [subject.role_template?.role_name, subject.name]
    .filter((value): value is string => Boolean(value && value.trim()));

  if (moment.actions && moment.actions.length > 0) {
    for (const key of roleKeys) {
      const normalized = key.trim().toLowerCase();
      const match = moment.actions.find(
        (row) => row.subject_role?.role_name?.trim().toLowerCase() === normalized,
      );
      if (match) {
        return { action: match.action_text, focal: null };
      }
    }
  }

  if (!moment.subject_actions) return null;
  for (const subjectKey of roleKeys) {
    const entry = moment.subject_actions[subjectKey];
    if (entry === undefined || entry === null) continue;
    return {
      action: typeof entry === 'string' ? entry : entry.action,
      focal: typeof entry === 'string' ? null : entry.focal,
    };
  }
  return null;
}

export function isSubjectPresentInMoment(
  moment: MomentSubjectContextSource | null,
  subjectName: string,
  roleName?: string | null,
): boolean {
  if (!moment) return true;

  if (moment.actions && moment.actions.length > 0) {
    const keys = [roleName, subjectName]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim().toLowerCase());
    return moment.actions.some((row) =>
      keys.includes(row.subject_role?.role_name?.trim().toLowerCase() ?? ''),
    );
  }

  if (!moment.subject_actions) return true;
  const entry = moment.subject_actions[subjectName];
  return entry !== null;
}
