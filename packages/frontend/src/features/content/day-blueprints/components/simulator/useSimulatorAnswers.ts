import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { DayBlueprintVersionDetail } from '../../types';

export type SimulatorStepId =
  | 'basics'
  | 'people'
  | 'locations'
  | 'generate';

export interface SimulatorAnswers {
  basics: {
    weddingType?: 'outdoor' | 'church' | 'civil' | 'destination' | 'other';
    eventDays?: number;
    eventDayDetails?: Record<number, {
      role?: 'welcome' | 'rehearsal' | 'wedding' | 'cultural' | 'after-party' | 'brunch';
    }>;
    mainActivities?: string[];
    guestCount?: number;
  };
  people: {
    primaryPartnerLabel?: string; // e.g. "Bride"
    secondPartnerLabel?: string; // e.g. "Groom"
    bridalPartySize?: number;
  };
  locations: Record<string, unknown>;
}

const EMPTY: SimulatorAnswers = {
  basics: {},
  people: {},
  locations: {},
};

type Action =
  | { type: 'reset'; answers?: Partial<SimulatorAnswers> }
  | { type: 'patchBasics'; value: Partial<SimulatorAnswers['basics']> }
  | { type: 'patchPeople'; value: Partial<SimulatorAnswers['people']> }
  | { type: 'patchLocations'; value: Partial<SimulatorAnswers['locations']> };

function reducer(state: SimulatorAnswers, action: Action): SimulatorAnswers {
  switch (action.type) {
    case 'reset':
      return { ...EMPTY, ...(action.answers ?? {}) };
    case 'patchBasics':
      return { ...state, basics: { ...state.basics, ...action.value } };
    case 'patchPeople':
      return { ...state, people: { ...state.people, ...action.value } };
    case 'patchLocations':
      return { ...state, locations: { ...state.locations, ...action.value } };
    default:
      return state;
  }
}

/**
 * Wizard answer state for The Simulator. Local-only; the page behind
 * the drawer is the source of truth for structural data, while these
 * answers hold the user's stated intent so we can:
 *   1. Render the right defaults next to questions.
 *   2. Forward only user-chosen details to the Refine endpoint.
 */
export function useSimulatorAnswers(version: DayBlueprintVersionDetail | null) {
  const [answers, dispatch] = useReducer(reducer, EMPTY);

  // Keep the store scoped to the current version even though sandbox answers are local-only.
  useEffect(() => {
    if (!version) return;
    dispatch({ type: 'reset' });
  }, [version?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchBasics = useCallback((value: Partial<SimulatorAnswers['basics']>) => {
    dispatch({ type: 'patchBasics', value });
  }, []);
  const patchPeople = useCallback((value: Partial<SimulatorAnswers['people']>) => {
    dispatch({ type: 'patchPeople', value });
  }, []);
  const patchLocations = useCallback((value: Partial<SimulatorAnswers['locations']>) => {
    dispatch({ type: 'patchLocations', value });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  /**
  * Produces a flat list of confirmed user-chosen details to send to
  * the refine endpoint. Excludes unanswered fields and deterministic
  * system defaults.
   */
  const assumptions = useMemo(() => buildAssumptions(answers), [answers]);

  return {
    answers,
    assumptions,
    patchBasics,
    patchPeople,
    patchLocations,
    reset,
  };
}

function buildAssumptions(a: SimulatorAnswers): string[] {
  const out: string[] = [];
  if (a.basics.weddingType) out.push(`Wedding type: ${a.basics.weddingType}.`);
  if (a.basics.eventDays) out.push(`Template should simulate ${a.basics.eventDays} event day${a.basics.eventDays === 1 ? '' : 's'}.`);
  const eventDayDetails = Object.entries(a.basics.eventDayDetails ?? {})
    .filter(([, value]) => value.role)
    .map(([dayNumber, value]) => `Day ${dayNumber}: ${value.role}`);
  if (eventDayDetails.length > 0) out.push(`Event day design: ${eventDayDetails.join('; ')}.`);
  if (a.basics.mainActivities?.length) out.push(`Main wedding day activities: ${a.basics.mainActivities.join(', ')}.`);
  if (a.basics.guestCount) out.push(`Approximately ${a.basics.guestCount} guests are attending.`);

  if (a.people.primaryPartnerLabel) out.push(`Primary reusable partner role: ${a.people.primaryPartnerLabel}.`);
  if (a.people.secondPartnerLabel) out.push(`Second reusable partner role: ${a.people.secondPartnerLabel}.`);

  return out;
}
