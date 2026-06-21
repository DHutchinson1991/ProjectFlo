import type { CreateDayBlueprintInput } from '@/features/content/day-blueprints/types';
import type { SimulatorAnswers } from '@/features/content/day-blueprints/components/simulator/useSimulatorAnswers';
import { PACKAGE_PLANNING_GUEST_COUNT } from '../components/creation/helpers/wizard-helpers';

const DEFAULT_DAY_START_TIME = '12:00';
const DEFAULT_DAY_DURATION_HOURS = 10;

const ACTIVITY_DURATION_DEFAULTS: Record<string, number> = {
  prep: 60,
  'first look': 25,
  ceremony: 45,
  portraits: 30,
  'cocktail hour': 60,
  reception: 120,
  speeches: 30,
  'first dance': 10,
  'evening party': 90,
  exit: 10,
};

function parseClockMinutes(value?: string): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return (hours * 60) + minutes;
}

function toClockTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min((24 * 60) - 1, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getDefaultActivityDurationMinutes(name: string): number {
  const normalized = name.trim().toLowerCase();
  return ACTIVITY_DURATION_DEFAULTS[normalized] ?? 45;
}

function deriveDurationBand(durationMinutes: number) {
  const clamped = Math.max(5, Math.round(durationMinutes));
  return {
    default_duration_minutes: clamped,
    duration_min_minutes: Math.max(5, clamped - 10),
    duration_max_minutes: clamped + 10,
  };
}

export function buildKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildAiBriefCreateInput(params: {
  eventCategory: string;
  displayName: string;
  description?: string;
  answers: SimulatorAnswers;
  isWeddingType: boolean;
  /** Package wizard: skip activity hints; use planning guest default. */
  forPackageWizard?: boolean;
}): CreateDayBlueprintInput {
  const { eventCategory, displayName, description, answers, isWeddingType, forPackageWizard } = params;
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

  const initialEventDayRoles = Object.entries(answers.basics.eventDayDetails ?? {}).reduce<Record<string, string>>(
    (acc, [dayNumber, detail]) => {
      if (detail?.role) acc[dayNumber] = detail.role;
      return acc;
    },
    {},
  );

  const initialActivities = forPackageWizard
    ? []
    : (answers.basics.mainActivities ?? [])
        .map((activity) => activity.trim())
        .filter((activity) => activity.length > 0);

  const eventDayCount = Math.max(1, answers.basics.eventDays ?? 1);
  const dayStartMinutes = parseClockMinutes(DEFAULT_DAY_START_TIME) ?? (12 * 60);

  const initialDayTimings = Array.from({ length: eventDayCount }, (_, index) => ({
    day_number: index + 1,
    default_start_time: DEFAULT_DAY_START_TIME,
    default_duration_hours: DEFAULT_DAY_DURATION_HOURS,
  }));

  let rollingMinutes = dayStartMinutes;
  const initialActivityTimings = initialActivities.map((name) => {
    const defaultDurationMinutes = getDefaultActivityDurationMinutes(name);
    const timing = {
      name,
      default_start_time: toClockTime(rollingMinutes),
      ...deriveDurationBand(defaultDurationMinutes),
    };
    rollingMinutes += defaultDurationMinutes;
    return timing;
  });

  const partnerDefaults = isWeddingType
    ? { primary_partner_label: 'Bride', second_partner_label: 'Groom' }
    : { primary_partner_label: 'Partner 1', second_partner_label: 'Partner 2' };

  return {
    key: buildKey(`${displayName}-${stamp}`),
    display_name: displayName.trim().slice(0, 160),
    event_category: eventCategory,
    description: description?.trim() || undefined,
    variant_tags: forPackageWizard
      ? { blank_authoring: true, package_wizard_ephemeral: true }
      : { blank_authoring: true },
    ...(forPackageWizard ? { is_active: false } : {}),
    initial_guest_count: forPackageWizard
      ? PACKAGE_PLANNING_GUEST_COUNT
      : answers.basics.guestCount,
    initial_event_days: answers.basics.eventDays,
    initial_event_day_roles:
      Object.keys(initialEventDayRoles).length > 0 ? initialEventDayRoles : undefined,
    initial_activities: initialActivities.length > 0 ? initialActivities : undefined,
    initial_day_timings: initialDayTimings.length > 0 ? initialDayTimings : undefined,
    initial_activity_timings:
      initialActivityTimings.length > 0 ? initialActivityTimings : undefined,
    ...partnerDefaults,
  };
}
