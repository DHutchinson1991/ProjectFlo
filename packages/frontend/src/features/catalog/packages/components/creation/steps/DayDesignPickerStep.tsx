'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import type { WizardState, DayDesignPath } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';

interface DayDesignPickerStepProps {
  state: WizardState;
  derived: WizardDerived;
}

const PATH_OPTIONS: Array<{
  id: Exclude<DayDesignPath, null>;
  title: string;
  Icon: typeof LibraryBooksRoundedIcon;
}> = [
  { id: 'library', title: 'Library', Icon: LibraryBooksRoundedIcon },
  { id: 'create', title: 'Create', Icon: EditNoteRoundedIcon },
  { id: 'generate', title: 'Generate', Icon: AutoAwesomeRoundedIcon },
];

function pathCardSx(isDisabled: boolean, accent: string) {
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
    aspectRatio: '1',
    p: 2,
    borderRadius: 2.5,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    border: '2px solid rgba(148,163,184,0.16)',
    bgcolor: 'rgba(255,255,255,0.025)',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'all 0.18s ease',
    '&:hover': isDisabled
      ? {}
      : {
          borderColor: `${accent}70`,
          bgcolor: `${accent}0C`,
          transform: 'translateY(-3px)',
          boxShadow: `0 12px 32px rgba(0,0,0,0.3)`,
        },
  };
}

export default function DayDesignPickerStep({ state, derived }: DayDesignPickerStepProps) {
  const { selectedEventType, isDayDesignRunning, setDayDesignPath } = state;
  const { accent } = derived;

  if (!selectedEventType) return null;

  const handleSelect = (path: Exclude<DayDesignPath, null>) => {
    if (isDayDesignRunning) return;
    setDayDesignPath(path);
  };

  return (
    <Box>
      <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.95rem', mb: 0.5, textAlign: 'center' }}>
        How do you want to build the {selectedEventType.name.toLowerCase()} day?
      </Typography>
      <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mb: 3, lineHeight: 1.5, textAlign: 'center' }}>
        Choose a starting point — details come on the next screen.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
          gap: 1.5,
          maxWidth: 560,
          mx: 'auto',
        }}
      >
        {PATH_OPTIONS.map(({ id, title, Icon }) => (
          <Box
            key={id}
            onClick={() => handleSelect(id)}
            sx={pathCardSx(isDayDesignRunning, accent)}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${accent}14`,
                border: `1px solid ${accent}28`,
              }}
            >
              <Icon sx={{ fontSize: 28, color: accent }} />
            </Box>
            <Typography
              sx={{
                color: '#f1f5f9',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              {title}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
