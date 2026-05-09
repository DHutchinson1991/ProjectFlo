'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import { ACTIVITY_COLORS, parseTimeToMinutes, formatMinutes } from './activity-schedule-helpers';

export interface PackageTimelineDay {
  id: number;
  name: string;
  activityCount?: number;
}

export interface PackageTimelineActivity {
  id: number;
  name: string;
  color?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  orderIndex?: number | null;
  sceneCount?: number;
}

export interface PackageTimelineProps {
  days: PackageTimelineDay[];
  activities: PackageTimelineActivity[];
  activeDayId: number | null;
  selectedActivityId?: number | null;
  loading?: boolean;
  showAddDay?: boolean;
  emptyDaysTitle?: string;
  emptyDaysSubtitle?: string;
  emptyTimelineTitle?: string;
  emptyTimelineSubtitle?: string;
  onSelectDay: (dayId: number) => void;
  onSelectActivity?: (activityId: number) => void;
  onAddDay?: (event: React.MouseEvent<HTMLElement>) => void;
  onRemoveDay?: (dayId: number) => void;
  onMoveDay?: (fromDayId: number, toDayId: number) => void;
  onActivityTimeChange?: (activityId: number, startTime: string, endTime: string) => void;
}



function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}



function formatTimeDisplay(time: string | null | undefined): string {
  if (!time) return '';
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return time;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
}

function activityDuration(activity: PackageTimelineActivity): number {
  if (activity.startTime && activity.endTime) {
    const start = parseTimeToMinutes(activity.startTime);
    const end = parseTimeToMinutes(activity.endTime);
    if (start !== null && end !== null && end > start) return end - start;
  }
  return activity.durationMinutes && activity.durationMinutes > 0 ? activity.durationMinutes : 60;
}

function assignLanes(activities: PackageTimelineActivity[]): Map<number, number> {
  const lanes = new Map<number, number>();
  const laneEnds: number[] = [];
  const timed = activities
    .filter((activity) => parseTimeToMinutes(activity.startTime) !== null)
    .sort((left, right) => parseTimeToMinutes(left.startTime)! - parseTimeToMinutes(right.startTime)!);

  for (const activity of timed) {
    const start = parseTimeToMinutes(activity.startTime)!;
    const end = start + activityDuration(activity);
    let placed = false;

    for (let index = 0; index < laneEnds.length; index += 1) {
      if (start >= laneEnds[index]) {
        lanes.set(activity.id, index);
        laneEnds[index] = end;
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.set(activity.id, laneEnds.length);
      laneEnds.push(end);
    }
  }

  return lanes;
}

export function PackageTimeline({
  days,
  activities,
  activeDayId,
  selectedActivityId,
  loading = false,
  showAddDay = true,
  emptyDaysTitle = 'No event days configured',
  emptyDaysSubtitle = 'Add event days to build your schedule',
  emptyTimelineTitle = 'No scheduled activity times yet',
  emptyTimelineSubtitle = 'Set default start times on activities to render the package-style timeline view',
  onSelectDay,
  onSelectActivity,
  onAddDay,
  onRemoveDay,
  onMoveDay,
  onActivityTimeChange,
}: PackageTimelineProps) {
  const lanesRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    activityId: number;
    mode: 'move' | 'resize-left' | 'resize-right';
    origStartMin: number;
    origEndMin: number;
    startX: number;
  } | null>(null);
  const didDragMove = useRef(false);
  const [dragPreview, setDragPreview] = useState<{ activityId: number; startMin: number; endMin: number } | null>(null);
  const dragPreviewRef = useRef<typeof dragPreview>(null);
  const [dragDayId, setDragDayId] = useState<number | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<number | null>(null);

  const sortedActivities = useMemo(() => [...activities].sort((left, right) => {
    const leftStart = parseTimeToMinutes(left.startTime);
    const rightStart = parseTimeToMinutes(right.startTime);
    if (leftStart !== null && rightStart !== null) return leftStart - rightStart;
    if (leftStart !== null) return -1;
    if (rightStart !== null) return 1;
    return (left.orderIndex ?? 0) - (right.orderIndex ?? 0);
  }), [activities]);

  const timedActivities = useMemo(
    () => sortedActivities.filter((activity) => parseTimeToMinutes(activity.startTime) !== null),
    [sortedActivities],
  );

  const timelineRange = useMemo(() => {
    if (timedActivities.length === 0) return { startHour: 6, endHour: 20 };

    let low = Infinity;
    let high = -Infinity;
    for (const activity of timedActivities) {
      const start = parseTimeToMinutes(activity.startTime);
      if (start === null) continue;
      const end = start + activityDuration(activity);
      low = Math.min(low, start);
      high = Math.max(high, end);
    }

    const startHour = Math.max(0, Math.floor(low / 60));
    const endHour = Math.min(24, Math.ceil(high / 60) + 1);
    return { startHour, endHour: Math.max(endHour, startHour + 4) };
  }, [timedActivities]);

  const totalMinutes = (timelineRange.endHour - timelineRange.startHour) * 60;
  const hourMarkers = useMemo(
    () => Array.from({ length: timelineRange.endHour - timelineRange.startHour + 1 }, (_, index) => timelineRange.startHour + index),
    [timelineRange],
  );
  const getPos = useCallback((minutes: number) => {
    const offset = minutes - timelineRange.startHour * 60;
    return Math.max(0, Math.min(100, (offset / totalMinutes) * 100));
  }, [timelineRange, totalMinutes]);
  const getWidth = (duration: number) => Math.max(2, Math.min(100, (duration / totalMinutes) * 100));

  const activityLanes = useMemo(() => assignLanes(sortedActivities), [sortedActivities]);
  const laneCount = useMemo(() => {
    if (activityLanes.size === 0) return 1;
    return Math.max(...Array.from(activityLanes.values())) + 1;
  }, [activityLanes]);

  const snap = (minutes: number) => Math.round(minutes / 15) * 15;
  const pixelsToMinutes = useCallback((pixels: number) => {
    if (!lanesRef.current) return 0;
    const width = lanesRef.current.getBoundingClientRect().width;
    if (width <= 0) return 0;
    return (pixels / width) * totalMinutes;
  }, [totalMinutes]);

  const handleBarMouseDown = useCallback((
    event: React.MouseEvent,
    activityId: number,
    mode: 'move' | 'resize-left' | 'resize-right',
    startMin: number,
    endMin: number,
  ) => {
    if (!onActivityTimeChange) return;
    event.preventDefault();
    event.stopPropagation();
    didDragMove.current = false;
    dragInfo.current = { activityId, mode, origStartMin: startMin, origEndMin: endMin, startX: event.clientX };
    const initial = { activityId, startMin, endMin };
    setDragPreview(initial);
    dragPreviewRef.current = initial;
  }, [onActivityTimeChange]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const info = dragInfo.current;
      if (!info) return;

      const deltaMinutes = pixelsToMinutes(event.clientX - info.startX);
      if (Math.abs(event.clientX - info.startX) > 3) didDragMove.current = true;

      let nextStart = info.origStartMin;
      let nextEnd = info.origEndMin;
      if (info.mode === 'move') {
        const duration = info.origEndMin - info.origStartMin;
        nextStart = snap(info.origStartMin + deltaMinutes);
        nextStart = Math.max(timelineRange.startHour * 60, Math.min(timelineRange.endHour * 60 - duration, nextStart));
        nextEnd = nextStart + duration;
      } else if (info.mode === 'resize-left') {
        nextStart = snap(info.origStartMin + deltaMinutes);
        nextStart = Math.max(timelineRange.startHour * 60, Math.min(info.origEndMin - 15, nextStart));
      } else {
        nextEnd = snap(info.origEndMin + deltaMinutes);
        nextEnd = Math.max(info.origStartMin + 15, Math.min(timelineRange.endHour * 60, nextEnd));
      }

      const next = { activityId: info.activityId, startMin: nextStart, endMin: nextEnd };
      setDragPreview(next);
      dragPreviewRef.current = next;
    };

    const handleMouseUp = () => {
      const info = dragInfo.current;
      const preview = dragPreviewRef.current;
      if (info && preview && onActivityTimeChange && didDragMove.current) {
        if (preview.startMin !== info.origStartMin || preview.endMin !== info.origEndMin) {
          onActivityTimeChange(info.activityId, minutesToTime(preview.startMin), minutesToTime(preview.endMin));
        }
      }
      dragInfo.current = null;
      setDragPreview(null);
      dragPreviewRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onActivityTimeChange, pixelsToMinutes, timelineRange]);

  const handleBarClick = useCallback((event: React.MouseEvent, activityId: number) => {
    if (didDragMove.current) {
      didDragMove.current = false;
      return;
    }
    event.stopPropagation();
    onSelectActivity?.(activityId);
  }, [onSelectActivity]);

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', minHeight: 32 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.3px', zIndex: 1, flexShrink: 0 }}>
            Timeline
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', ml: 2 }}>
            {days.map((day, dayIndex) => {
              const isActive = activeDayId === day.id;
              const isDragOver = dragOverDayId === day.id && dragDayId !== day.id;
              return (
                <Box
                  key={day.id}
                  draggable={Boolean(onMoveDay)}
                  onDragStart={() => setDragDayId(day.id)}
                  onDragEnd={() => { setDragDayId(null); setDragOverDayId(null); }}
                  onDragOver={(event) => { if (onMoveDay) { event.preventDefault(); setDragOverDayId(day.id); } }}
                  onDragLeave={() => setDragOverDayId(null)}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragDayId !== null && dragDayId !== day.id) onMoveDay?.(dragDayId, day.id);
                    setDragDayId(null);
                    setDragOverDayId(null);
                  }}
                  onClick={() => onSelectDay(day.id)}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1.25, py: 0.5, borderRadius: 1.5,
                    cursor: onMoveDay ? 'grab' : 'pointer', transition: 'all 0.15s ease',
                    bgcolor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: isActive
                      ? '1px solid rgba(255, 255, 255, 0.2)'
                      : isDragOver
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid rgba(255,255,255,0.06)',
                    opacity: dragDayId === day.id ? 0.5 : 1,
                    transform: isDragOver ? 'scale(1.02)' : 'none',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      '& .day-del': { opacity: 1 },
                    },
                    '&:active': { cursor: onMoveDay ? 'grabbing' : 'pointer' },
                  }}
                >
                  <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 800, color: isActive ? '#cbd5e1' : '#535e6e',
                    textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1,
                  }}>
                    Day {dayIndex + 1}:
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: isActive ? '#f1f5f9' : '#94a3b8', lineHeight: 1 }}>
                    {day.name}
                  </Typography>
                  {typeof day.activityCount === 'number' && (
                    <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                      {day.activityCount} act
                    </Typography>
                  )}
                  {onRemoveDay && (
                    <IconButton
                      className="day-del"
                      size="small"
                      onClick={(event) => { event.stopPropagation(); onRemoveDay(day.id); }}
                      sx={{ p: 0, ml: -0.25, opacity: 0, transition: 'opacity 0.15s', color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                    >
                      <CloseIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </Box>
          {showAddDay && onAddDay && (
            <Box
              onClick={onAddDay}
              sx={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                px: 1.25, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                bgcolor: 'transparent', transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <AddIcon sx={{ fontSize: 14, color: '#64748b' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Add Day</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
        </Box>
      ) : days.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, px: 2.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, mx: 'auto', mb: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 58, 68, 0.3)',
          }}>
            <CalendarTodayIcon sx={{ fontSize: 20, color: '#334155' }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem' }}>{emptyDaysTitle}</Typography>
          <Typography variant="caption" sx={{ color: '#334155', display: 'block', fontSize: '0.6rem', mt: 0.25 }}>{emptyDaysSubtitle}</Typography>
        </Box>
      ) : timedActivities.length > 0 ? (
        <Box sx={{ mx: 2, mt: 1, mb: 0.5, py: 1.5, px: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
            <Box ref={lanesRef} sx={{ flex: 1, position: 'relative', borderRadius: '6px', overflow: 'visible', minHeight: laneCount * 34 + 8 }}>
              {hourMarkers.map((hour) => (
                <Box key={hour} sx={{
                  position: 'absolute', left: `${getPos(hour * 60)}%`, top: 0, bottom: 0, width: '1px',
                  bgcolor: hour % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
                }} />
              ))}

              {sortedActivities.map((activity) => {
                const rawStart = parseTimeToMinutes(activity.startTime);
                if (rawStart === null) return null;
                const rawDuration = activityDuration(activity);
                const rawEnd = rawStart + rawDuration;
                const isDragging = dragPreview?.activityId === activity.id;
                const start = isDragging ? dragPreview!.startMin : rawStart;
                const end = isDragging ? dragPreview!.endMin : rawEnd;
                const duration = end - start;
                const color = activity.color ?? ACTIVITY_COLORS[(activity.orderIndex ?? 0) % ACTIVITY_COLORS.length];
                const lane = activityLanes.get(activity.id) ?? 0;
                const isSelected = selectedActivityId === activity.id;

                return (
                  <Tooltip
                    key={activity.id}
                    arrow
                    placement="top"
                    disableHoverListener={isDragging}
                    disableFocusListener={isDragging}
                    disableTouchListener={isDragging}
                    title={
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{activity.name}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                          {formatTimeDisplay(minutesToTime(start))} - {formatTimeDisplay(minutesToTime(end))} ({formatMinutes(duration)})
                        </Typography>
                        {activity.sceneCount != null && activity.sceneCount > 0 && (
                          <Typography sx={{ fontSize: '0.6rem', opacity: 0.7 }}>
                            {activity.sceneCount} scene{activity.sceneCount !== 1 ? 's' : ''} linked
                          </Typography>
                        )}
                      </Box>
                    }
                  >
                    <Box
                      onClick={(event) => handleBarClick(event, activity.id)}
                      onMouseDown={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.dataset.resizeHandle) return;
                        handleBarMouseDown(event, activity.id, 'move', start, end);
                      }}
                      sx={{
                        position: 'absolute',
                        left: `${getPos(start)}%`,
                        width: `${Math.max(3, getWidth(duration))}%`,
                        top: lane * 34 + 4,
                        height: 26,
                        bgcolor: isSelected ? `${color}35` : `${color}18`,
                        borderRadius: '5px',
                        display: 'flex', alignItems: 'center', px: 1,
                        overflow: onActivityTimeChange ? 'visible' : 'hidden',
                        cursor: isDragging ? 'grabbing' : 'pointer',
                        border: isSelected ? `1.5px solid ${color}` : `1px solid ${color}30`,
                        borderLeft: `3px solid ${color}`,
                        transition: isDragging ? 'none' : 'all 0.15s ease',
                        zIndex: isDragging ? 10 : isSelected ? 5 : 1,
                        boxShadow: isSelected ? `0 0 12px ${color}40, 0 2px 8px ${color}25` : isDragging ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
                        userSelect: 'none',
                        '&:hover': {
                          bgcolor: isSelected ? `${color}40` : `${color}30`,
                          borderColor: `${color}60`,
                          boxShadow: `0 2px 8px ${color}25`,
                          zIndex: isDragging ? 10 : 3,
                        },
                      }}
                    >
                      {onActivityTimeChange && (
                        <Box
                          data-resize-handle="left"
                          onMouseDown={(event) => { event.stopPropagation(); handleBarMouseDown(event, activity.id, 'resize-left', start, end); }}
                          sx={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: 6, cursor: 'ew-resize', zIndex: 4, '&:hover': { bgcolor: `${color}40`, borderRadius: '3px 0 0 3px' } }}
                        />
                      )}
                      <Typography sx={{
                        fontSize: '0.6rem', fontWeight: 700, color, lineHeight: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none',
                      }}>
                        {activity.name}
                      </Typography>
                      {onActivityTimeChange && (
                        <Box
                          data-resize-handle="right"
                          onMouseDown={(event) => { event.stopPropagation(); handleBarMouseDown(event, activity.id, 'resize-right', start, end); }}
                          sx={{ position: 'absolute', right: -2, top: 0, bottom: 0, width: 6, cursor: 'ew-resize', zIndex: 4, '&:hover': { bgcolor: `${color}40`, borderRadius: '0 3px 3px 0' } }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ position: 'relative', height: 22, mt: 0.75 }}>
            {hourMarkers
              .filter((_, index) => index % (hourMarkers.length > 14 ? 2 : 1) === 0)
              .map((hour) => (
                <Typography
                  key={hour}
                  sx={{
                    position: 'absolute', left: `${getPos(hour * 60)}%`, transform: 'translateX(-50%)',
                    fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600,
                    fontFamily: 'monospace', userSelect: 'none',
                  }}
                >
                  {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)}
                </Typography>
              ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4, px: 2.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, mx: 'auto', mb: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 58, 68, 0.3)',
          }}>
            <CalendarTodayIcon sx={{ fontSize: 20, color: '#334155' }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem' }}>{emptyTimelineTitle}</Typography>
          <Typography variant="caption" sx={{ color: '#334155', display: 'block', fontSize: '0.6rem', mt: 0.25 }}>{emptyTimelineSubtitle}</Typography>
        </Box>
      )}
    </Box>
  );
}
