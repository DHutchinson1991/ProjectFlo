'use client';

import React from 'react';
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocationSlotPicker from './LocationSlotPicker';

export interface DayBuilderItem {
  id: number | string;
  dayNumber: number;
  name: string;
  assigned?: boolean;
  locationCount: number;
}

export type DayBuilderNavigation = 'carousel' | 'accordion';

interface DayBuilderProps {
  accent: string;
  days: DayBuilderItem[];
  navigation: DayBuilderNavigation;
  onLocationCountChange: (dayId: number | string, count: number) => void;
  renderDayContent: (day: DayBuilderItem) => React.ReactNode;
  /** Carousel: chips / day-count selector above navigation */
  header?: React.ReactNode;
  activeDayId?: number | string;
  onActiveDayChange?: (dayId: number | string) => void;
  expandedDayIds?: Set<number | string>;
  onToggleDayExpand?: (dayId: number | string) => void;
  locationPickerCompact?: boolean;
  showLocationPicker?: boolean;
}

function LocationSlotSummary({ count }: { count: number }) {
  return (
    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 1.5, lineHeight: 1.45 }}>
      {count} location slot{count === 1 ? '' : 's'} for this day
    </Typography>
  );
}

function dayPanelShellSx(accent: string, assigned: boolean) {
  return {
    flex: 1,
    minWidth: 0,
    minHeight: 420,
    p: 2.5,
    borderRadius: 2,
    border: '1px solid rgba(148,163,184,0.15)',
    bgcolor: 'rgba(15,20,25,0.95)',
    overflow: 'hidden',
    '@keyframes dayPanelIn': {
      from: { opacity: 0.5, transform: 'translateX(6px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
    },
    animation: 'dayPanelIn 0.22s ease',
  } as const;
}

function DayPanelHeader({
  dayNumber,
  name,
  assigned,
  accent,
}: {
  dayNumber: number;
  name: string;
  assigned?: boolean;
  accent: string;
}) {
  return (
    <>
      <Typography
        sx={{
          color: '#64748b',
          fontSize: '0.62rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.45px',
          mb: 0.35,
        }}
      >
        Event day {dayNumber}
      </Typography>
      <Typography
        sx={{
          color: assigned !== false ? accent : '#94a3b8',
          fontWeight: 700,
          fontSize: '0.95rem',
          mb: 1.25,
        }}
      >
        {name}
      </Typography>
    </>
  );
}

function CarouselDayBuilder({
  accent,
  days,
  header,
  activeDayId,
  onActiveDayChange,
  onLocationCountChange,
  renderDayContent,
  locationPickerCompact,
  showLocationPicker = true,
}: DayBuilderProps) {
  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0];
  const activeIndex = days.findIndex((d) => d.id === activeDay?.id);

  if (!activeDay || !onActiveDayChange) return null;

  const goPrev = () => {
    const prev = days[Math.max(0, activeIndex - 1)];
    if (prev) onActiveDayChange(prev.id);
  };
  const goNext = () => {
    const next = days[Math.min(days.length - 1, activeIndex + 1)];
    if (next) onActiveDayChange(next.id);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {header}

      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1.25 }}>
        <IconButton
          onClick={goPrev}
          disabled={activeIndex <= 0}
          aria-label="Previous event day"
          sx={{
            alignSelf: 'center',
            flexShrink: 0,
            color: activeIndex <= 0 ? '#475569' : accent,
            border: '1px solid rgba(148,163,184,0.15)',
            bgcolor: 'rgba(255,255,255,0.02)',
            '&:hover': { bgcolor: `${accent}12`, borderColor: accent },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box key={activeDay.id} sx={dayPanelShellSx(accent, activeDay.assigned !== false)}>
          <DayPanelHeader
            dayNumber={activeDay.dayNumber}
            name={activeDay.name}
            assigned={activeDay.assigned}
            accent={accent}
          />
          {renderDayContent(activeDay)}
          {showLocationPicker ? (
            <LocationSlotPicker
              value={activeDay.locationCount}
              onChange={(count) => onLocationCountChange(activeDay.id, count)}
              accent={accent}
              compact={locationPickerCompact}
            />
          ) : (
            <LocationSlotSummary count={activeDay.locationCount} />
          )}
        </Box>

        <IconButton
          onClick={goNext}
          disabled={activeIndex >= days.length - 1}
          aria-label="Next event day"
          sx={{
            alignSelf: 'center',
            flexShrink: 0,
            color: activeIndex >= days.length - 1 ? '#475569' : accent,
            border: '1px solid rgba(148,163,184,0.15)',
            bgcolor: 'rgba(255,255,255,0.02)',
            '&:hover': { bgcolor: `${accent}12`, borderColor: accent },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {days.length > 1 && (
        <Typography sx={{ color: '#64748b', fontSize: '0.68rem', textAlign: 'center', mt: 1.25 }}>
          Day {activeDay.dayNumber} of {days.length}
          {activeDay.assigned === false ? ' — not assigned yet' : ''}
        </Typography>
      )}
    </Box>
  );
}

function AccordionDayBuilder({
  accent,
  days,
  expandedDayIds,
  onToggleDayExpand,
  onLocationCountChange,
  renderDayContent,
  locationPickerCompact,
  showLocationPicker = true,
}: DayBuilderProps) {
  const isSingleDay = days.length <= 1;

  return (
    <Stack spacing={1.5}>
      {days.map((day) => {
        const expanded = isSingleDay || (expandedDayIds?.has(day.id) ?? false);
        const activityContent = (
          <>
            {renderDayContent(day)}
            {showLocationPicker ? (
              <LocationSlotPicker
                value={day.locationCount}
                onChange={(count) => onLocationCountChange(day.id, count)}
                accent={accent}
                compact={locationPickerCompact ?? true}
              />
            ) : (
              <LocationSlotSummary count={day.locationCount} />
            )}
          </>
        );

        if (isSingleDay) {
          return (
            <Box
              key={day.id}
              sx={{
                ...dayPanelShellSx(accent, true),
                minHeight: 'auto',
                p: 2,
              }}
            >
              <DayPanelHeader
                dayNumber={day.dayNumber}
                name={day.name}
                assigned={day.assigned}
                accent={accent}
              />
              {activityContent}
            </Box>
          );
        }

        return (
          <Box
            key={day.id}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(148,163,184,0.12)',
              bgcolor: 'rgba(15,20,25,0.6)',
              overflow: 'hidden',
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => onToggleDayExpand?.(day.id)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1.1,
                bgcolor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: expanded ? '1px solid rgba(148,163,184,0.1)' : 'none',
                textAlign: 'left',
                '&:hover': { opacity: 0.9 },
              }}
            >
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: '1.1rem',
                  color: '#64748b',
                  flexShrink: 0,
                  transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.18s',
                }}
              />
              <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 600, flexShrink: 0 }}>
                Day {day.dayNumber}
              </Typography>
              <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', flex: 1, minWidth: 0 }}>
                {day.name}
              </Typography>
            </Box>
            <Collapse in={expanded}>
              <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>{activityContent}</Box>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function DayBuilder(props: DayBuilderProps) {
  if (props.navigation === 'carousel') {
    return <CarouselDayBuilder {...props} />;
  }
  return <AccordionDayBuilder {...props} />;
}
