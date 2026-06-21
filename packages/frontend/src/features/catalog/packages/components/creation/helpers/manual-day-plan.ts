import type { SimulatorAnswers } from '@/features/content/day-blueprints/components/simulator/useSimulatorAnswers';
import { clampLocationCount, DEFAULT_LOCATION_COUNT } from './location-helpers';

export type EventDayRole = NonNullable<
  NonNullable<SimulatorAnswers['basics']['eventDayDetails']>[number]['role']
>;

export interface ManualDayActivitySuggestion {
  key: string;
  name: string;
  color: string;
  durationMinutes: number;
}

export interface ManualDayMomentSuggestion {
  key: string;
  name: string;
  durationSeconds?: number;
  isKeyMoment?: boolean;
}

export interface ManualDayPlanMoment extends ManualDayMomentSuggestion {
  selected: boolean;
}

export interface ManualDayPlanActivity extends ManualDayActivitySuggestion {
  selected: boolean;
  moments: ManualDayPlanMoment[];
}

export interface ManualDayPlanDay {
  name: string;
  order_index: number;
  role?: EventDayRole;
  customName?: string;
  locationCount: number;
  activities: ManualDayPlanActivity[];
}

export interface ManualDayPlan {
  eventDays: number;
  days: ManualDayPlanDay[];
}

export interface ManualDaySlotInput {
  role?: EventDayRole;
  customName?: string;
  isCustom?: boolean;
  locationCount?: number;
  selectedActivityKeys: string[];
  selectedMomentKeysByActivity: Record<string, string[]>;
}

export const EVENT_DAY_ROLE_OPTIONS: Array<{
  value: EventDayRole;
  label: string;
  description: string;
  detail: string;
}> = [
  {
    value: 'welcome',
    label: 'Welcome drinks',
    description: 'Arrivals, drinks, and mingling',
    detail: 'Guests arrive and settle in — welcome drinks, candid arrivals, and venue detail shots.',
  },
  {
    value: 'rehearsal',
    label: 'Rehearsal day',
    description: 'Run-through before the main event',
    detail: 'Practice run for ceremony flow, timing, and family positioning.',
  },
  {
    value: 'wedding',
    label: 'Wedding day',
    description: 'Ceremony, portraits, and reception',
    detail: 'The main celebration — prep, ceremony, portraits, reception, and send-off.',
  },
  {
    value: 'cultural',
    label: 'Cultural ceremony',
    description: 'Traditional or religious celebration',
    detail: 'Traditions, rituals, and family-led segments for heritage-led events.',
  },
  {
    value: 'after-party',
    label: 'After party',
    description: 'Late-night celebration',
    detail: 'Evening continuation after the formal reception — dancing and low-light coverage.',
  },
  {
    value: 'brunch',
    label: 'Brunch',
    description: 'Morning-after gathering',
    detail: 'Relaxed wrap-up — casual portraits, group goodbyes, and venue pack-down.',
  },
];

export const ROLE_ACTIVITY_SUGGESTIONS: Record<EventDayRole, ManualDayActivitySuggestion[]> = {
  welcome: [
    { key: 'welcome-arrivals', name: 'Guest arrivals', color: '#818cf8', durationMinutes: 60 },
    { key: 'welcome-drinks', name: 'Welcome drinks', color: '#10b981', durationMinutes: 90 },
    { key: 'welcome-candid', name: 'Candid mingling', color: '#f59e0b', durationMinutes: 45 },
    { key: 'welcome-details', name: 'Venue details', color: '#64748b', durationMinutes: 30 },
  ],
  rehearsal: [
    { key: 'rehearsal-walkthrough', name: 'Ceremony walkthrough', color: '#818cf8', durationMinutes: 60 },
    { key: 'rehearsal-family', name: 'Family positioning', color: '#ec4899', durationMinutes: 45 },
    { key: 'rehearsal-dinner', name: 'Rehearsal dinner', color: '#10b981', durationMinutes: 120 },
  ],
  wedding: [
    { key: 'wedding-bridal-prep', name: 'Bridal prep', color: '#ec4899', durationMinutes: 120 },
    { key: 'wedding-groom-prep', name: 'Groom prep', color: '#3b82f6', durationMinutes: 90 },
    { key: 'wedding-first-look', name: 'First look', color: '#f59e0b', durationMinutes: 30 },
    { key: 'wedding-ceremony', name: 'Ceremony', color: '#818cf8', durationMinutes: 60 },
    { key: 'wedding-portraits', name: 'Couple portraits', color: '#a855f7', durationMinutes: 45 },
    { key: 'wedding-reception', name: 'Reception', color: '#10b981', durationMinutes: 180 },
    { key: 'wedding-sendoff', name: 'Send-off', color: '#64748b', durationMinutes: 30 },
  ],
  cultural: [
    { key: 'cultural-prep', name: 'Traditional prep', color: '#ec4899', durationMinutes: 90 },
    { key: 'cultural-ceremony', name: 'Ceremony rituals', color: '#818cf8', durationMinutes: 90 },
    { key: 'cultural-family', name: 'Family portraits', color: '#f59e0b', durationMinutes: 45 },
    { key: 'cultural-reception', name: 'Celebration reception', color: '#10b981', durationMinutes: 120 },
  ],
  'after-party': [
    { key: 'afterparty-dancing', name: 'Dancing', color: '#a855f7', durationMinutes: 120 },
    { key: 'afterparty-bar', name: 'Bar & candid', color: '#f59e0b', durationMinutes: 90 },
    { key: 'afterparty-sendoff', name: 'Late send-off', color: '#64748b', durationMinutes: 30 },
  ],
  brunch: [
    { key: 'brunch-gathering', name: 'Morning gathering', color: '#10b981', durationMinutes: 90 },
    { key: 'brunch-portraits', name: 'Group portraits', color: '#818cf8', durationMinutes: 45 },
    { key: 'brunch-goodbyes', name: 'Guest goodbyes', color: '#64748b', durationMinutes: 30 },
  ],
};

export const CUSTOM_DAY_ACTIVITY_SUGGESTIONS: ManualDayActivitySuggestion[] = [
  { key: 'custom-main', name: 'Main coverage block', color: '#818cf8', durationMinutes: 120 },
  { key: 'custom-detail', name: 'Detail & B-roll', color: '#64748b', durationMinutes: 45 },
  { key: 'custom-portraits', name: 'Portraits', color: '#ec4899', durationMinutes: 60 },
];

const DEFAULT_MOMENT_SUGGESTIONS: ManualDayMomentSuggestion[] = [
  { key: 'opening', name: 'Opening coverage', durationSeconds: 120 },
  { key: 'main-beat', name: 'Main beat', durationSeconds: 180, isKeyMoment: true },
  { key: 'details', name: 'Detail shots', durationSeconds: 90 },
];

export const ACTIVITY_MOMENT_SUGGESTIONS: Record<string, ManualDayMomentSuggestion[]> = {
  'welcome-arrivals': [
    { key: 'venue-arrival', name: 'Venue arrival', durationSeconds: 120 },
    { key: 'guest-greeting', name: 'Guest greetings', durationSeconds: 180, isKeyMoment: true },
    { key: 'candid-arrivals', name: 'Candid arrivals', durationSeconds: 120 },
  ],
  'welcome-drinks': [
    { key: 'drinks-pour', name: 'Drinks service', durationSeconds: 120 },
    { key: 'toasts-mingling', name: 'Toasts & mingling', durationSeconds: 240, isKeyMoment: true },
  ],
  'welcome-candid': [
    { key: 'group-conversations', name: 'Group conversations', durationSeconds: 180 },
    { key: 'reaction-shots', name: 'Reaction shots', durationSeconds: 120, isKeyMoment: true },
  ],
  'welcome-details': [
    { key: 'venue-details', name: 'Venue details', durationSeconds: 90 },
    { key: 'table-settings', name: 'Table settings', durationSeconds: 60 },
  ],
  'rehearsal-walkthrough': [
    { key: 'processional-run', name: 'Processional run-through', durationSeconds: 180, isKeyMoment: true },
    { key: 'cue-check', name: 'Cue check', durationSeconds: 120 },
    { key: 'recessional-run', name: 'Recessional run-through', durationSeconds: 120 },
  ],
  'rehearsal-family': [
    { key: 'family-positioning', name: 'Family positioning', durationSeconds: 180, isKeyMoment: true },
    { key: 'group-instructions', name: 'Group instructions', durationSeconds: 90 },
  ],
  'rehearsal-dinner': [
    { key: 'welcome-speeches', name: 'Welcome speeches', durationSeconds: 240, isKeyMoment: true },
    { key: 'dinner-coverage', name: 'Dinner coverage', durationSeconds: 360 },
    { key: 'toasts', name: 'Toasts', durationSeconds: 180, isKeyMoment: true },
  ],
  'wedding-bridal-prep': [
    { key: 'hair-makeup', name: 'Hair & make-up details', durationSeconds: 180 },
    { key: 'dress-details', name: 'Dress details shot', durationSeconds: 120, isKeyMoment: true },
    { key: 'getting-dressed', name: 'Bride getting into dress', durationSeconds: 180, isKeyMoment: true },
    { key: 'father-look', name: 'First look with escort', durationSeconds: 120 },
    { key: 'accessories', name: 'Bouquet & accessories', durationSeconds: 60 },
  ],
  'wedding-groom-prep': [
    { key: 'groom-details', name: 'Groom & groomsmen details', durationSeconds: 90 },
    { key: 'groom-ready', name: 'Groom ready shot', durationSeconds: 90, isKeyMoment: true },
    { key: 'group-ready', name: 'Groomsmen group shot', durationSeconds: 60 },
  ],
  'wedding-first-look': [
    { key: 'first-look-reveal', name: 'First look reveal', durationSeconds: 120, isKeyMoment: true },
    { key: 'reactions', name: 'Emotional reactions', durationSeconds: 90, isKeyMoment: true },
  ],
  'wedding-ceremony': [
    { key: 'processional', name: 'Wedding party processional', durationSeconds: 180, isKeyMoment: true },
    { key: 'bride-processional', name: "Bride's processional", durationSeconds: 240, isKeyMoment: true },
    { key: 'vows', name: 'Exchange of vows', durationSeconds: 300, isKeyMoment: true },
    { key: 'rings', name: 'Exchange of rings', durationSeconds: 180, isKeyMoment: true },
    { key: 'first-kiss', name: 'First kiss', durationSeconds: 60, isKeyMoment: true },
    { key: 'signing', name: 'Signing', durationSeconds: 300, isKeyMoment: true },
    { key: 'recessional', name: 'Recessional', durationSeconds: 150, isKeyMoment: true },
  ],
  'wedding-portraits': [
    { key: 'couple-portraits', name: 'Couple portraits', durationSeconds: 240, isKeyMoment: true },
    { key: 'family-groups', name: 'Family groups', durationSeconds: 180 },
    { key: 'wedding-party', name: 'Wedding party', durationSeconds: 120 },
  ],
  'wedding-reception': [
    { key: 'grand-entrance', name: 'Grand entrance', durationSeconds: 120, isKeyMoment: true },
    { key: 'speeches', name: 'Speeches', durationSeconds: 480, isKeyMoment: true },
    { key: 'first-dance', name: 'First dance', durationSeconds: 240, isKeyMoment: true },
    { key: 'parent-dances', name: 'Parent dances', durationSeconds: 180 },
    { key: 'cake-cutting', name: 'Cake cutting', durationSeconds: 120, isKeyMoment: true },
    { key: 'open-dancing', name: 'Open dancing', durationSeconds: 600 },
  ],
  'wedding-sendoff': [
    { key: 'farewell-line', name: 'Farewell line', durationSeconds: 120 },
    { key: 'send-off', name: 'Send-off', durationSeconds: 120, isKeyMoment: true },
  ],
  'cultural-prep': [
    { key: 'traditional-prep', name: 'Traditional prep', durationSeconds: 180, isKeyMoment: true },
    { key: 'family-blessings', name: 'Family blessings', durationSeconds: 120 },
  ],
  'cultural-ceremony': [
    { key: 'opening-ritual', name: 'Opening ritual', durationSeconds: 180, isKeyMoment: true },
    { key: 'main-ritual', name: 'Main ceremony ritual', durationSeconds: 360, isKeyMoment: true },
    { key: 'closing-ritual', name: 'Closing ritual', durationSeconds: 120, isKeyMoment: true },
  ],
  'cultural-family': [
    { key: 'family-portraits', name: 'Family portraits', durationSeconds: 180, isKeyMoment: true },
    { key: 'elders-blessing', name: 'Elders blessing', durationSeconds: 120 },
  ],
  'cultural-reception': [
    { key: 'celebration-entry', name: 'Celebration entry', durationSeconds: 120, isKeyMoment: true },
    { key: 'performances', name: 'Performances', durationSeconds: 360 },
    { key: 'feast', name: 'Feast coverage', durationSeconds: 240 },
  ],
  'afterparty-dancing': [
    { key: 'dance-floor', name: 'Dance floor', durationSeconds: 360, isKeyMoment: true },
    { key: 'crowd-energy', name: 'Crowd energy', durationSeconds: 240 },
  ],
  'afterparty-bar': [
    { key: 'bar-candid', name: 'Bar candid', durationSeconds: 180 },
    { key: 'late-night-groups', name: 'Late-night groups', durationSeconds: 180, isKeyMoment: true },
  ],
  'afterparty-sendoff': [
    { key: 'late-sendoff', name: 'Late send-off', durationSeconds: 120, isKeyMoment: true },
  ],
  'brunch-gathering': [
    { key: 'morning-arrivals', name: 'Morning arrivals', durationSeconds: 120 },
    { key: 'brunch-table', name: 'Brunch table', durationSeconds: 180, isKeyMoment: true },
  ],
  'brunch-portraits': [
    { key: 'group-portraits', name: 'Group portraits', durationSeconds: 180, isKeyMoment: true },
    { key: 'couple-morning', name: 'Couple morning shot', durationSeconds: 90 },
  ],
  'brunch-goodbyes': [
    { key: 'guest-goodbyes', name: 'Guest goodbyes', durationSeconds: 120, isKeyMoment: true },
    { key: 'pack-down', name: 'Venue pack-down', durationSeconds: 90 },
  ],
  'custom-main': [
    { key: 'main-opening', name: 'Opening coverage', durationSeconds: 180 },
    { key: 'main-beat', name: 'Main beat', durationSeconds: 300, isKeyMoment: true },
    { key: 'main-wrap', name: 'Wrap-up', durationSeconds: 120 },
  ],
  'custom-detail': [
    { key: 'detail-shots', name: 'Detail shots', durationSeconds: 120 },
    { key: 'b-roll', name: 'B-roll', durationSeconds: 90 },
  ],
  'custom-portraits': [
    { key: 'portrait-set', name: 'Portrait set', durationSeconds: 240, isKeyMoment: true },
    { key: 'candid-portraits', name: 'Candid portraits', durationSeconds: 120 },
  ],
};

export const MANUAL_DAY_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const MAX_MANUAL_DAY_COUNT = 7;

const EVENT_DAY_ROLE_LABELS = Object.fromEntries(
  EVENT_DAY_ROLE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EventDayRole, string>;

export function getActivitySuggestionsForSlot(
  slot: Pick<ManualDaySlotInput, 'role' | 'isCustom'>,
): ManualDayActivitySuggestion[] {
  if (slot.isCustom) return CUSTOM_DAY_ACTIVITY_SUGGESTIONS;
  if (slot.role) return ROLE_ACTIVITY_SUGGESTIONS[slot.role];
  return [];
}

export function defaultActivityKeysForSlot(
  slot: Pick<ManualDaySlotInput, 'role' | 'isCustom'>,
): string[] {
  return getActivitySuggestionsForSlot(slot).map((s) => s.key);
}

export function getMomentSuggestionsForActivity(
  activityKey: string,
): ManualDayMomentSuggestion[] {
  return ACTIVITY_MOMENT_SUGGESTIONS[activityKey] ?? DEFAULT_MOMENT_SUGGESTIONS;
}

export function defaultMomentKeysForActivity(activityKey: string): string[] {
  return getMomentSuggestionsForActivity(activityKey).map((moment) => moment.key);
}

export function buildDefaultMomentKeysByActivity(
  activityKeys: string[],
): Record<string, string[]> {
  return Object.fromEntries(
    activityKeys.map((key) => [key, defaultMomentKeysForActivity(key)]),
  );
}

export function buildManualDayPlan(
  eventDays: number,
  slots: Record<number, ManualDaySlotInput | undefined>,
  eventTypeName?: string,
): ManualDayPlan {
  const count = Math.max(1, Math.min(MAX_MANUAL_DAY_COUNT, eventDays));
  const days = Array.from({ length: count }, (_, index) => {
    const dayNumber = index + 1;
    const slot = slots[dayNumber];
    const role = slot?.isCustom ? undefined : slot?.role;
    const customName = slot?.isCustom ? slot.customName?.trim() : undefined;
    const suggestions = getActivitySuggestionsForSlot({
      role,
      isCustom: slot?.isCustom,
    });
    const selectedKeys = new Set(slot?.selectedActivityKeys ?? []);

    let name: string;
    if (customName) {
      name = customName;
    } else if (role && EVENT_DAY_ROLE_LABELS[role]) {
      name = EVENT_DAY_ROLE_LABELS[role];
    } else if (count === 1) {
      name = eventTypeName?.toLowerCase().includes('wedding') ? 'Wedding Day' : 'Main day';
    } else {
      name = `Day ${dayNumber}`;
    }

    const momentKeysByActivity = slot?.selectedMomentKeysByActivity ?? {};

    const activities: ManualDayPlanActivity[] = suggestions.map((suggestion) => {
      const momentSuggestions = getMomentSuggestionsForActivity(suggestion.key);
      const selectedMomentKeys = new Set(momentKeysByActivity[suggestion.key] ?? []);
      return {
        ...suggestion,
        selected: selectedKeys.has(suggestion.key),
        moments: momentSuggestions.map((moment) => ({
          ...moment,
          selected: selectedMomentKeys.has(moment.key),
        })),
      };
    });

    const locationCount = clampLocationCount(slot?.locationCount ?? DEFAULT_LOCATION_COUNT);

    return { name, order_index: index, role, customName, locationCount, activities };
  });
  return { eventDays: count, days };
}

export function isManualDayPlanComplete(plan: ManualDayPlan | null): boolean {
  if (!plan || plan.eventDays < 1 || plan.days.length !== plan.eventDays) return false;
  return plan.days.every((day) => {
    const hasType = Boolean(day.role) || Boolean(day.customName?.trim());
    const hasActivities = day.activities.some((activity) => activity.selected);
    return hasType && hasActivities;
  });
}

export function isDaySlotAssigned(slot: ManualDaySlotInput | undefined): boolean {
  if (!slot) return false;
  return Boolean(slot.role) || Boolean(slot.isCustom && slot.customName?.trim());
}

export interface ManualDayPlanEditorState {
  dayCount: number;
  activeDay: number;
  slots: Record<number, ManualDaySlotInput | undefined>;
  focusedActivityByDay: Record<number, string | null>;
}

/** Restore CreateDayPlanSection local editor state from committed wizard manualDayPlan. */
export function manualDayPlanToEditorState(plan: ManualDayPlan | null): ManualDayPlanEditorState {
  if (!plan || plan.eventDays < 1 || plan.days.length === 0) {
    return { dayCount: 1, activeDay: 1, slots: {}, focusedActivityByDay: {} };
  }

  const slots: Record<number, ManualDaySlotInput | undefined> = {};
  const focusedActivityByDay: Record<number, string | null> = {};

  plan.days.forEach((day, index) => {
    const dayNumber = index + 1;
    const selectedActivityKeys = day.activities.filter((activity) => activity.selected).map((activity) => activity.key);
    const selectedMomentKeysByActivity: Record<string, string[]> = {};
    day.activities.forEach((activity) => {
      if (activity.selected) {
        selectedMomentKeysByActivity[activity.key] = activity.moments
          .filter((moment) => moment.selected)
          .map((moment) => moment.key);
      }
    });

    const isCustom = Boolean(day.customName?.trim()) && !day.role;
    if (isCustom) {
      slots[dayNumber] = {
        isCustom: true,
        customName: day.customName,
        locationCount: day.locationCount,
        selectedActivityKeys,
        selectedMomentKeysByActivity,
      };
    } else if (day.role) {
      slots[dayNumber] = {
        role: day.role,
        isCustom: false,
        locationCount: day.locationCount,
        selectedActivityKeys,
        selectedMomentKeysByActivity,
      };
    }

    focusedActivityByDay[dayNumber] = selectedActivityKeys[0] ?? null;
  });

  return {
    dayCount: plan.eventDays,
    activeDay: 1,
    slots,
    focusedActivityByDay,
  };
}
