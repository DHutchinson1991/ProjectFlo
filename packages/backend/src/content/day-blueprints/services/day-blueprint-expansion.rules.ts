import { BadRequestException } from '@nestjs/common';
import { type ExpandedActivity } from './day-blueprint-ai.types';
import { normalizeRoleName } from './day-blueprint-ai.utils';

export interface CeremonyProcessionalRoleDiagnostic {
  momentIndex: number;
  momentName: string;
  issueCode:
    | 'missing_bride_focus'
    | 'missing_groom_anchor_in_bride_entrance'
    | 'unexpected_groom_side_entry'
    | 'unexpected_bride_side_entry'
    | 'unexpected_groom_side_in_bridal_party';
  detail: string;
  role?: string;
}

const PROCESSIONAL_MOMENT_RE = /\b(processional|procession|entrance|entry)\b/;
const ENTRY_ACTION_RE = /\b(walk|walking|walks|processional|procession|enter|enters|entering|entry|down the aisle|proceeds?)\b/;

export function validateExpansion(
  activityName: string,
  expansion: ExpandedActivity,
  availableRoles: string[],
): void {
  const failures: string[] = [];
  const roleLookup = new Set(availableRoles.map((role) => normalizeRoleName(role)));
  for (let i = 0; i < expansion.moments.length; i++) {
    const moment = expansion.moments[i];
    if (!moment.subject_actions || moment.subject_actions.length === 0) {
      failures.push(`moment ${i + 1}: missing subject_actions`);
      continue;
    }
    if (availableRoles.length > 0) {
      for (const action of moment.subject_actions) {
        if (!roleLookup.has(normalizeRoleName(action.subject_role))) {
          failures.push(`moment ${i + 1}: subject_role "${action.subject_role}" is not on the roster`);
        }
      }
    }
  }
  if (failures.length > 0) {
    throw new BadRequestException(`Expansion validation failed for ${activityName}: ${failures.join('; ')}`);
  }
}

export function collectCeremonyProcessionalRoleDiagnostics(
  activityName: string,
  moments: Array<{
    name?: string | null;
    subject_actions?: Array<{
      subject_role?: string | null;
      action_text?: string | null;
      notes?: string | null;
    }> | null;
  }>,
): CeremonyProcessionalRoleDiagnostic[] {
  if (!/\bceremony\b/.test(normalizeRoleName(activityName))) return [];
  const diagnostics: CeremonyProcessionalRoleDiagnostic[] = [];

  for (let momentIndex = 0; momentIndex < moments.length; momentIndex += 1) {
    const moment = moments[momentIndex];
    const momentName = (moment.name ?? '').trim();
    const normalizedMomentName = normalizeRoleName(momentName);
    if (!PROCESSIONAL_MOMENT_RE.test(normalizedMomentName)) continue;

    const actions = moment.subject_actions ?? [];
    const brideFocusedMoment = /\b(bride|bridal)\b/.test(normalizedMomentName);
    const groomFocusedMoment = /\bgroom\b/.test(normalizedMomentName);
    const bridesidePartyMoment = /\b(bridal party|bridesmaids?|maid of honor|matron of honor|flower girl)\b/.test(
      normalizedMomentName,
    );
    const weddingPartyMoment = /\bwedding party\b/.test(normalizedMomentName);

    const hasBridePresence = actions.some((action) => isBrideLeadRole(normalizeRoleName(action.subject_role ?? '')));
    const hasGroomPresence = actions.some((action) => isGroomLeadRole(normalizeRoleName(action.subject_role ?? '')));
    if (brideFocusedMoment && !hasBridePresence) {
      diagnostics.push({
        momentIndex,
        momentName,
        issueCode: 'missing_bride_focus',
        detail: 'Bride-focused processional moment is missing a Bride action.',
      });
    }
    if (brideFocusedMoment && !groomFocusedMoment && !hasGroomPresence) {
      diagnostics.push({
        momentIndex,
        momentName,
        issueCode: 'missing_groom_anchor_in_bride_entrance',
        detail: 'Bride-focused entrance moment is missing a Groom anchor action.',
      });
    }

    for (const action of actions) {
      const normalizedRole = normalizeRoleName(action.subject_role ?? '');
      const movementText = normalizeRoleName(`${action.action_text ?? ''} ${action.notes ?? ''}`);
      if (!ENTRY_ACTION_RE.test(movementText)) continue;

      if (brideFocusedMoment && !groomFocusedMoment && (isGroomLeadRole(normalizedRole) || isGroomsidePartyRole(normalizedRole))) {
        diagnostics.push({
          momentIndex,
          momentName,
          issueCode: 'unexpected_groom_side_entry',
          detail: 'Groom-side entry action appears in a bride-focused processional moment.',
          role: action.subject_role ?? undefined,
        });
      }

      if (groomFocusedMoment && !brideFocusedMoment && (isBrideLeadRole(normalizedRole) || isBridesidePartyRole(normalizedRole))) {
        diagnostics.push({
          momentIndex,
          momentName,
          issueCode: 'unexpected_bride_side_entry',
          detail: 'Bride-side entry action appears in a groom-focused processional moment.',
          role: action.subject_role ?? undefined,
        });
      }

      if (bridesidePartyMoment && !weddingPartyMoment && isGroomsidePartyRole(normalizedRole)) {
        diagnostics.push({
          momentIndex,
          momentName,
          issueCode: 'unexpected_groom_side_in_bridal_party',
          detail: 'Groom-side party entry action appears in a bridal-party-focused processional moment.',
          role: action.subject_role ?? undefined,
        });
      }
    }
  }

  return diagnostics;
}

function isBridesidePartyRole(role: string): boolean {
  return /\b(maid of honor|matron of honor|bridesmaid|bridesmaids|flower girl)\b/.test(role);
}

function isGroomsidePartyRole(role: string): boolean {
  return /\b(best man|groomsman|groomsmen|ring bearer|ringbearer)\b/.test(role);
}

function isBrideLeadRole(role: string): boolean {
  return /\bbride\b/.test(role) && !isBridesidePartyRole(role) && !/\b(father|mother|parent)s?\b/.test(role);
}

function isGroomLeadRole(role: string): boolean {
  return /\bgroom\b/.test(role) && !isGroomsidePartyRole(role) && !/\b(father|mother|parent)s?\b/.test(role);
}
