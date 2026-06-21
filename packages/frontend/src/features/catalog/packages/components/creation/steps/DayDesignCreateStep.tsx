'use client';

import React from 'react';
import { Box } from '@mui/material';
import CreateDayPlanSection from '../components/CreateDayPlanSection';
import DayDesignSubstepHeader from '../components/DayDesignSubstepHeader';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';

interface DayDesignCreateStepProps {
  state: WizardState;
  derived: WizardDerived;
}

export default function DayDesignCreateStep({ state, derived }: DayDesignCreateStepProps) {
  const { accent } = derived;

  return (
    <Box>
      <DayDesignSubstepHeader
        accent={accent}
        title="Build your days"
        subtitle="Set how many event days you need, assign a type to each, and choose which starter activities to include."
      />
      <CreateDayPlanSection state={state} derived={derived} />
    </Box>
  );
}
