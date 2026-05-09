'use client';

import React from 'react';
import {
  Box,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colors } from '@/shared/theme';
import type {
  DayBlueprintDay,
  DayBlueprintVersionDetail,
} from '../../types';
import type { SimulatorCompleteness } from '../../api/simulator';
import type { SimulatorAnswers } from './useSimulatorAnswers';

const FIELD_SX = {
  width: '100%',
  '& .MuiInputBase-root': {
    bgcolor: alpha(colors.card, 0.74),
    borderRadius: '12px',
    boxShadow: `inset 0 1px 0 ${alpha('#fff', 0.03)}`,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(colors.accent, 0.26),
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(colors.accentLight, 0.48),
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.accent,
    borderWidth: 1,
  },
  '& .MuiInputBase-input': { color: colors.text, fontSize: '0.85rem', textAlign: 'center' },
  '& .MuiInputBase-inputMultiline': { textAlign: 'left' },
  '& .MuiInputLabel-root': { color: alpha(colors.muted, 0.82) },
};

const EVENT_DAY_OPTIONS = [1, 2, 3] as const;

const MAIN_ACTIVITY_OPTIONS = [
  'Prep',
  'First look',
  'Ceremony',
  'Portraits',
  'Cocktail hour',
  'Reception',
  'Speeches',
  'First dance',
  'Evening party',
  'Exit',
] as const;

const EVENT_DAY_ROLE_OPTIONS: Array<{
  value: NonNullable<NonNullable<SimulatorAnswers['basics']['eventDayDetails']>[number]['role']>;
  label: string;
}> = [
  { value: 'welcome', label: 'Welcome drinks' },
  { value: 'rehearsal', label: 'Rehearsal day' },
  { value: 'wedding', label: 'Wedding day' },
  { value: 'cultural', label: 'Cultural ceremony' },
  { value: 'after-party', label: 'After party' },
  { value: 'brunch', label: 'Brunch' },
];

const chipSx = (selected: boolean) => ({
  bgcolor: selected ? colors.accent : 'rgba(148,163,184,0.08)',
  color: selected ? '#0f172a' : alpha(colors.text, 0.82),
  borderColor: selected ? colors.accent : 'rgba(148,163,184,0.16)',
  fontWeight: selected ? 800 : 600,
  borderRadius: 1.25,
  height: 32,
  '&:hover': {
    bgcolor: selected ? colors.accent : 'rgba(148,163,184,0.12)',
    borderColor: selected ? colors.accent : 'rgba(148,163,184,0.25)',
  },
});

interface StepProps {
  answers: SimulatorAnswers;
  patchBasics: (v: Partial<SimulatorAnswers['basics']>) => void;
  patchPeople: (v: Partial<SimulatorAnswers['people']>) => void;
  patchLocations: (v: Partial<SimulatorAnswers['locations']>) => void;
  day: DayBlueprintDay | null;
  version: DayBlueprintVersionDetail | null;
  completeness: SimulatorCompleteness | null;
}

// ─── Step renderers ──────────────────────────────────────────────

export function StepEventDays(props: StepProps) {
  const { answers, patchBasics } = props;
  return (
    <SimulatorQuestion
      question="How many event days should this template simulate?"
      hint="Use this for one-day weddings, wedding weekends, or multi-day structures."
    >
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
        {EVENT_DAY_OPTIONS.map((days) => {
          const selected = answers.basics.eventDays === days;
          return (
            <Chip
              key={days}
              label={`${days} day${days === 1 ? '' : 's'}`}
              clickable
              onClick={() => patchBasics({ eventDays: days })}
              variant={selected ? 'filled' : 'outlined'}
              sx={chipSx(selected)}
            />
          );
        })}
      </Stack>
    </SimulatorQuestion>
  );
}

export function StepEventDayDetail({ dayNumber, ...props }: StepProps & { dayNumber: number }) {
  const { answers, patchBasics } = props;
  const selectedRole = answers.basics.eventDayDetails?.[dayNumber]?.role;
  return (
    <SimulatorQuestion
      question={`What is Event Day ${dayNumber} for?`}
      hint="Design each day as a reusable part of the template, not a real dated itinerary."
    >
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
        {EVENT_DAY_ROLE_OPTIONS.map((option) => {
          const selected = selectedRole === option.value;
          return (
            <Chip
              key={option.value}
              label={option.label}
              clickable
              onClick={() => patchBasics({
                eventDayDetails: {
                  ...(answers.basics.eventDayDetails ?? {}),
                  [dayNumber]: {
                    ...(answers.basics.eventDayDetails?.[dayNumber] ?? {}),
                    role: option.value,
                  },
                },
              })}
              variant={selected ? 'filled' : 'outlined'}
              sx={chipSx(selected)}
            />
          );
        })}
      </Stack>
    </SimulatorQuestion>
  );
}

export function StepActivities(props: StepProps) {
  const { answers, patchBasics } = props;
  const selectedActivities = answers.basics.mainActivities ?? [];
  return (
    <SimulatorQuestion
      question="Which activities belong in the main wedding day?"
      hint="Pick the reusable activity blocks the AI should build before it fills in moments."
    >
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
        {MAIN_ACTIVITY_OPTIONS.map((activity) => {
          const selected = selectedActivities.includes(activity);
          return (
            <Chip
              key={activity}
              label={activity}
              clickable
              onClick={() => patchBasics({ mainActivities: toggleListValue(selectedActivities, activity) })}
              variant={selected ? 'filled' : 'outlined'}
              sx={chipSx(selected)}
            />
          );
        })}
      </Stack>
    </SimulatorQuestion>
  );
}

export function StepGuestCount(props: StepProps) {
  const { answers, patchBasics } = props;
  return (
    <SimulatorQuestion
      question="Roughly how many guests should the AI account for?"
      hint="A rough planning number is enough; this is not a scale category."
    >
      <TextField
        type="number"
        size="small"
        value={answers.basics.guestCount ?? ''}
        onChange={(event) => {
          const next = event.target.value === '' ? undefined : Number(event.target.value);
          patchBasics({ guestCount: Number.isFinite(next as number) ? (next as number) : undefined });
        }}
        inputProps={{ min: 0, max: 1000 }}
        placeholder="120"
        sx={{ ...FIELD_SX, width: 140 }}
      />
    </SimulatorQuestion>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────

export function SimulatorQuestion({
  question,
  hint,
  children,
}: {
  question: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 0.5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography sx={{ color: colors.text, fontSize: '1rem', fontWeight: 800, letterSpacing: 0, mb: hint ? 0.45 : 1.25 }}>
        {question}
      </Typography>
      {hint && (
        <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5, mb: 1.5 }}>{hint}</Typography>
      )}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {children}
      </Box>
    </Box>
  );
}

function toggleListValue(currentValues: string[], value: string): string[] {
  return currentValues.includes(value)
    ? currentValues.filter((currentValue) => currentValue !== value)
    : [...currentValues, value];
}
