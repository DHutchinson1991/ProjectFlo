'use client';

import React from 'react';
import DayDesignPickerStep from '../steps/DayDesignPickerStep';
import DayDesignLibraryStep from '../steps/DayDesignLibraryStep';
import DayDesignCreateStep from '../steps/DayDesignCreateStep';
import DayDesignGenerateStep from '../steps/DayDesignGenerateStep';
import ActivitiesStep from '../steps/ActivitiesStep';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';

interface DayDesignScreenProps {
  state: WizardState;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

/**
 * Screen 2 — Day design. Picker first, then a dedicated screen per path,
 * then blueprint activity review when applicable.
 */
export default function DayDesignScreen({ state, derived, handlers }: DayDesignScreenProps) {
  if (state.dayDesignPhase === 'review') {
    return <ActivitiesStep state={state} derived={derived} handlers={handlers} />;
  }

  switch (state.dayDesignPath) {
    case 'library':
      return <DayDesignLibraryStep state={state} derived={derived} />;
    case 'create':
      return <DayDesignCreateStep state={state} derived={derived} />;
    case 'generate':
      return <DayDesignGenerateStep state={state} derived={derived} />;
    default:
      return <DayDesignPickerStep state={state} derived={derived} />;
  }
}
