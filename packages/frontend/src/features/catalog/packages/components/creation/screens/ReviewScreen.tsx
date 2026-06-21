'use client';

import React from 'react';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import ReviewStep from '../steps/ReviewStep';

interface ReviewScreenProps {
  state: WizardState;
  data: WizardData;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

/** Screen 4 — Name, summary, and create in one cohesive review step. */
export default function ReviewScreen({ state, data, derived, handlers }: ReviewScreenProps) {
  return <ReviewStep state={state} data={data} derived={derived} handlers={handlers} />;
}
