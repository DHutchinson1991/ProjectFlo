import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useUpdateActivity, useUpdateMoment, useUpdateMomentAction } from '../../hooks';
import type {
  DayBlueprintActivity,
  DayBlueprintDay,
  DayBlueprintMoment,
  DayBlueprintMomentAction,
  DayBlueprintMomentPlacement,
  DayBlueprintVersionDetail,
} from '../../types';
import { formatMinutes, formatSeconds } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';
import { MOMENT_LOCK_OPTIONS, activeLockLabels } from './LockFlagsButton';
import { activityTotals, dayTotals, formatTimeDisplay } from './editor-utils';
import { buildPerCopyPlacementLines } from '../../utils/placement-copy-tokens';

export function BlueprintContextPanel({
  blueprintId,
  versionId,
  day,
  activity,
  moment,
  version,
  readOnly,
  externalHoveredMomentRoleId,
  selectedSubjectRoleId = null,
}: {
  blueprintId: number;
  versionId: number;
  day: DayBlueprintDay | null;
  activity: DayBlueprintActivity | null;
  moment: DayBlueprintMoment | null;
  version: DayBlueprintVersionDetail;
  readOnly: boolean;
  externalHoveredMomentRoleId: number | null;
  selectedSubjectRoleId?: number | null;
}) {
  const updateActivity = useUpdateActivity(blueprintId, versionId);
  const updateMoment = useUpdateMoment(blueprintId, versionId);
  const updateMomentAction = useUpdateMomentAction(blueprintId, versionId);

  const roleLabels = useMemo(() => new Map(
    (version.subject_roles ?? []).map((role) => [
      role.subject_role_id,
      role.subject_role?.role_name ?? `Role #${role.subject_role_id}`,
    ]),
  ), [version.subject_roles]);
  const momentLocks = activeLockLabels(moment?.lock_flags, MOMENT_LOCK_OPTIONS);
  const activitySummary = activity ? activityTotals(activity) : null;
  const daySummary = day ? dayTotals(day) : null;

  const hoveredActivityRoleContext = useMemo(() => {
    if (!activity || !externalHoveredMomentRoleId) return null;
    const relevantMoments = (activity.moments ?? []).flatMap((row) => {
      const roleActions = (row.actions ?? []).filter((action) => action.subject_role_id === externalHoveredMomentRoleId);
      const rolePlacements = (row.placements ?? []).filter((placement) => placement.subject_role_id === externalHoveredMomentRoleId);
      if (roleActions.length === 0 && rolePlacements.length === 0) return [];
      return [{ row, roleActions, rolePlacements }];
    });
    if (relevantMoments.length === 0) return null;

    const actionCount = relevantMoments.reduce((sum, item) => sum + item.roleActions.length, 0);
    const placementCount = relevantMoments.reduce((sum, item) => sum + item.rolePlacements.length, 0);
    const emphasisValues = Array.from(new Set(
      relevantMoments.flatMap((item) => item.roleActions.map((action) => action.emphasis).filter(Boolean)),
    ));
    const positionHints = Array.from(new Set(
      relevantMoments.flatMap((item) => item.rolePlacements.map((placement) => placement.position_hint).filter(Boolean)),
    ));
    const facingHints = Array.from(new Set(
      relevantMoments.flatMap((item) => item.rolePlacements.map((placement) => placement.facing_hint).filter(Boolean)),
    ));
    const momentsMissingPlacements = relevantMoments
      .filter((item) => item.roleActions.length > 0 && item.rolePlacements.length === 0)
      .map((item) => item.row.name);
    const momentsMissingActions = relevantMoments
      .filter((item) => item.rolePlacements.length > 0 && item.roleActions.length === 0)
      .map((item) => item.row.name);

    return {
      roleId: externalHoveredMomentRoleId,
      roleName: roleLabels.get(externalHoveredMomentRoleId) ?? `Role #${externalHoveredMomentRoleId}`,
      actionCount,
      placementCount,
      moments: relevantMoments.map((item) => item.row),
      emphasisValues,
      positionHints,
      facingHints,
      momentsMissingPlacements,
      momentsMissingActions,
    };
  }, [activity, externalHoveredMomentRoleId, roleLabels]);

  const slotLabelById = useMemo(
    () => new Map(
      (version.space_slots ?? []).map((slot) => [slot.id, slot.label?.trim() || `Slot #${slot.id}`]),
    ),
    [version.space_slots],
  );

  const roleTypicalCountById = useMemo(
    () => new Map(
      (version.subject_roles ?? []).map((r) => [
        r.subject_role_id,
        Math.max(r.typical_count ?? 1, 1),
      ]),
    ),
    [version.subject_roles],
  );

  type MomentRoleCard = {
    roleId: number;
    roleName: string;
    copyCount: number;
    actions: DayBlueprintMomentAction[];
    placementRows: Array<{
      placement: DayBlueprintMomentPlacement;
      slotLabel: string;
      perCopyLines: ReturnType<typeof buildPerCopyPlacementLines>;
    }>;
  };

  const momentRoleCards = useMemo((): MomentRoleCard[] | null => {
    if (!moment) return null;
    const ids = new Set<number>();
    for (const a of moment.actions ?? []) {
      ids.add(a.subject_role_id);
    }
    for (const p of moment.placements ?? []) {
      ids.add(p.subject_role_id);
    }
    const order = new Map(
      (version.subject_roles ?? []).map((r) => [r.subject_role_id, r.order_index ?? 0]),
    );
    const sorted = Array.from(ids).sort((a, b) => {
      const oa = order.get(a) ?? 0;
      const ob = order.get(b) ?? 0;
      if (oa !== ob) return oa - ob;
      return a - b;
    });
    return sorted.map((roleId) => {
      const roleName = roleLabels.get(roleId) ?? `Role #${roleId}`;
      const copyCount = roleTypicalCountById.get(roleId) ?? 1;
      return {
        roleId,
        roleName,
        copyCount,
        actions: (moment.actions ?? []).filter((a) => a.subject_role_id === roleId),
        placementRows: (moment.placements ?? [])
          .filter((p) => p.subject_role_id === roleId)
          .map((placement) => ({
            placement,
            slotLabel: slotLabelById.get(placement.day_blueprint_space_slot_id) ?? `Slot #${placement.day_blueprint_space_slot_id}`,
            perCopyLines: buildPerCopyPlacementLines(placement.notes, copyCount, roleName),
          })),
      };
    });
  }, [moment, roleLabels, roleTypicalCountById, slotLabelById, version.subject_roles]);

  const filteredMomentRoleCards = useMemo(() => {
    if (!momentRoleCards || selectedSubjectRoleId == null) return null;
    return momentRoleCards.filter((c) => c.roleId === selectedSubjectRoleId);
  }, [momentRoleCards, selectedSubjectRoleId]);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {moment ? 'Moment Context' : activity ? 'Activity Context' : day ? 'Day Context' : 'Blueprint Context'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2 }}>
        {!day && (
          <Typography sx={{ fontSize: '0.74rem', color: '#475569', fontStyle: 'italic' }}>
            Select a day or activity to inspect its planning context.
          </Typography>
        )}

        {day && !activity && (
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                {day.name}
              </Typography>
              {day.description && (
                <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55, mt: 0.5 }}>
                  {day.description}
                </Typography>
              )}
            </Box>

            <Stack spacing={1}>
              <ContextMetaRow label="Activities" value={`${daySummary?.activityCount ?? 0}`} />
              <ContextMetaRow label="Moments" value={`${daySummary?.momentCount ?? 0}`} />
              <ContextMetaRow label="Planned runtime" value={formatMinutes(daySummary?.minutes ?? 0)} />
              <ContextMetaRow label="Day start" value={formatTimeDisplay(day.default_start_time)} />
            </Stack>

          </Stack>
        )}

        {activity && !moment && (
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                {activity.name}
              </Typography>
              {readOnly ? (
                activity.description && (
                  <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55, mt: 0.5 }}>
                    {activity.description}
                  </Typography>
                )
              ) : (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  placeholder="Add a description or planning note…"
                  defaultValue={activity.description ?? ''}
                  key={`activity-desc-${activity.id}`}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (activity.description ?? '')) {
                      updateActivity.mutate({ activityId: activity.id, data: { description: val || undefined } });
                    }
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 0.75,
                    '& .MuiOutlinedInput-root': { fontSize: '0.74rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.03)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96,165,250,0.3)' },
                  }}
                />
              )}
            </Box>

            <Stack spacing={1}>
              <ContextMetaRow label="Day" value={day?.name ?? 'Unassigned'} />
              <ContextMetaRow label="Start time" value={formatTimeDisplay(activity.default_start_time)} />
              <ContextMetaRow label="Target duration" value={formatMinutes(activity.default_duration_minutes ?? activitySummary?.planned ?? 0)} />
              <ContextMetaRow
                label="Duration band"
                value={activity.duration_min_minutes != null || activity.duration_max_minutes != null
                  ? `${activity.duration_min_minutes ?? '?'}-${activity.duration_max_minutes ?? '?'} min`
                  : 'No band set'}
              />
              <ContextMetaRow label="Moments" value={`${activitySummary?.momentCount ?? 0}`} />
              <ContextMetaRow label="Moment runtime" value={formatMinutes(activitySummary?.momentMin ?? 0)} />
              {!readOnly && (
                <TargetMomentCountField
                  activityId={activity.id}
                  value={activity.target_moment_count ?? null}
                  onChange={(next) => updateActivity.mutate({ activityId: activity.id, data: { target_moment_count: next } })}
                  disabled={updateActivity.isPending}
                />
              )}
            </Stack>

            {hoveredActivityRoleContext && (
              <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                  Person Focus
                </Typography>
                <Box sx={{ px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)' }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#dbeafe', fontWeight: 700 }}>
                    {hoveredActivityRoleContext.roleName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.35 }}>
                    {hoveredActivityRoleContext.actionCount} action{hoveredActivityRoleContext.actionCount === 1 ? '' : 's'} · {hoveredActivityRoleContext.placementCount} placement{hoveredActivityRoleContext.placementCount === 1 ? '' : 's'}
                  </Typography>
                  {hoveredActivityRoleContext.emphasisValues.length > 0 && (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.7 }}>
                      {hoveredActivityRoleContext.emphasisValues.map((value) => (
                        <Chip
                          key={`emphasis-${value}`}
                          label={`Action: ${value}`}
                          size="small"
                          sx={{ height: 20, bgcolor: 'rgba(56,189,248,0.14)', color: '#67e8f9', border: 'none' }}
                        />
                      ))}
                    </Stack>
                  )}
                  {(hoveredActivityRoleContext.positionHints.length > 0 || hoveredActivityRoleContext.facingHints.length > 0) && (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.55 }}>
                      {hoveredActivityRoleContext.positionHints.map((value) => (
                        <Chip
                          key={`position-${value}`}
                          label={`Position: ${value}`}
                          size="small"
                          sx={{ height: 20, bgcolor: 'rgba(167,139,250,0.14)', color: '#c4b5fd', border: 'none' }}
                        />
                      ))}
                      {hoveredActivityRoleContext.facingHints.map((value) => (
                        <Chip
                          key={`facing-${value}`}
                          label={`Facing: ${value}`}
                          size="small"
                          sx={{ height: 20, bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none' }}
                        />
                      ))}
                    </Stack>
                  )}
                  {(hoveredActivityRoleContext.momentsMissingPlacements.length > 0 || hoveredActivityRoleContext.momentsMissingActions.length > 0) && (
                    <Box sx={{ mt: 0.7, px: 0.9, py: 0.65, borderRadius: 1, bgcolor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)' }}>
                      <Typography sx={{ fontSize: '0.64rem', color: '#fcd34d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Assignment warnings
                      </Typography>
                      {hoveredActivityRoleContext.momentsMissingPlacements.length > 0 && (
                        <Typography sx={{ fontSize: '0.64rem', color: '#fbbf24', mt: 0.35 }}>
                          Actions without placement: {hoveredActivityRoleContext.momentsMissingPlacements.join(', ')}
                        </Typography>
                      )}
                      {hoveredActivityRoleContext.momentsMissingActions.length > 0 && (
                        <Typography sx={{ fontSize: '0.64rem', color: '#fbbf24', mt: 0.2 }}>
                          Placements without action: {hoveredActivityRoleContext.momentsMissingActions.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.5 }}>
                    Moments: {hoveredActivityRoleContext.moments.map((entry) => entry.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                Locations on this activity
              </Typography>
              {(activity.activity_locations?.length ?? 0) === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  No activity-level locations linked yet.
                </Typography>
              ) : (
                <Stack spacing={0.6}>
                  {activity.activity_locations?.map((entry) => (
                    <Box key={entry.id} sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>
                        {entry.location_role?.display_name ?? `Location #${entry.day_blueprint_location_role_id}`}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.35 }}>
                        {entry.is_primary ? 'Primary location' : 'Secondary location'}
                        {entry.notes ? ` · ${entry.notes}` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

          </Stack>
        )}

        {activity && moment && (
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                {moment.name}
              </Typography>
              {readOnly ? (
                moment.description && (
                  <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55, mt: 0.5 }}>
                    {moment.description}
                  </Typography>
                )
              ) : (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  placeholder="Moment description or planning note…"
                  defaultValue={moment.description ?? ''}
                  key={`moment-desc-${moment.id}`}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (moment.description ?? '').trim()) {
                      updateMoment.mutate({ momentId: moment.id, data: { description: val || undefined } });
                    }
                  }}
                  disabled={updateMoment.isPending}
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 0.75,
                    '& .MuiOutlinedInput-root': { fontSize: '0.74rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.03)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96,165,250,0.3)' },
                  }}
                />
              )}
            </Box>

            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              <Chip label={activity.name} size="small" sx={{ bgcolor: 'rgba(148,163,184,0.14)', color: '#cbd5e1', border: 'none' }} />
              {moment.is_key_moment && (
                <Chip label="Key moment" size="small" sx={{ bgcolor: 'rgba(251,191,36,0.14)', color: '#fbbf24', border: 'none' }} />
              )}
              {momentLocks.map((label) => (
                <Chip
                  key={label}
                  label={`Locked: ${label}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none' }}
                />
              ))}
            </Stack>

            <Stack spacing={1}>
              <ContextMetaRow label="Day" value={day?.name ?? 'Unassigned'} />
              <ContextMetaRow label="Duration" value={formatSeconds(moment.duration_seconds)} />
              <ContextMetaRow label="Actions" value={`${moment.actions?.length ?? 0}`} />
              <ContextMetaRow label="Placements" value={`${moment.placements?.length ?? 0}`} />
            </Stack>

            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                Placements
              </Typography>
              {selectedSubjectRoleId == null ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  Select someone on the floor plan to see their placement and actions here.
                </Typography>
              ) : !filteredMomentRoleCards || filteredMomentRoleCards.length === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  No placement or actions for this role in this moment yet.
                </Typography>
              ) : (
                <Stack spacing={0.9}>
                  {filteredMomentRoleCards.map((card) => (
                    <Box
                      key={card.roleId}
                      sx={{
                        p: 1.1,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(255,215,0,0.07)',
                        border: '1px solid rgba(255,215,0,0.24)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#fef9c3' }}>
                        {card.roleName}
                      </Typography>

                      {card.actions.length > 0 && (
                        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                          {card.actions.map((action) => (
                            <Box key={action.id} sx={{ p: 0.75, borderRadius: 1.15, bgcolor: 'rgba(255,255,255,0.04)' }}>
                              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: '#93c5fd', mb: 0.35 }}>Action</Typography>
                              {readOnly ? (
                                <>
                                  <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>{action.action_text}</Typography>
                                  {action.notes && (
                                    <Typography sx={{ fontSize: '0.64rem', color: '#64748b', mt: 0.35, fontStyle: 'italic' }}>
                                      {action.notes}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Stack spacing={0.75}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={6}
                                    label="What they do"
                                    size="small"
                                    defaultValue={action.action_text}
                                    key={`action-text-${action.id}-${action.action_text}`}
                                    onBlur={(e) => {
                                      const val = e.target.value.trim();
                                      if (val !== action.action_text.trim()) {
                                        updateMomentAction.mutate({
                                          actionId: action.id,
                                          data: { action_text: val || '—' },
                                        });
                                      }
                                    }}
                                    disabled={updateMomentAction.isPending}
                                    sx={{
                                      '& .MuiOutlinedInput-root': { fontSize: '0.72rem', color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.02)' },
                                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                                      '& .MuiInputLabel-root': { fontSize: '0.68rem', color: '#64748b' },
                                    }}
                                  />
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={1}
                                    maxRows={4}
                                    label="Notes (optional)"
                                    size="small"
                                    placeholder="Crew or planning notes…"
                                    defaultValue={action.notes ?? ''}
                                    key={`action-notes-${action.id}-${action.notes ?? ''}`}
                                    onBlur={(e) => {
                                      const val = e.target.value.trim();
                                      const prev = (action.notes ?? '').trim();
                                      if (val !== prev) {
                                        updateMomentAction.mutate({
                                          actionId: action.id,
                                          data: { notes: val || undefined },
                                        });
                                      }
                                    }}
                                    disabled={updateMomentAction.isPending}
                                    sx={{
                                      '& .MuiOutlinedInput-root': { fontSize: '0.68rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.02)' },
                                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                                      '& .MuiInputLabel-root': { fontSize: '0.65rem', color: '#64748b' },
                                    }}
                                  />
                                </Stack>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      )}

                      {card.placementRows.length === 0 ? (
                        card.actions.length > 0 ? (
                          <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', mt: 0.75 }}>
                            No floor placement for this person in this moment.
                          </Typography>
                        ) : null
                      ) : (
                        card.placementRows.map(({ placement, slotLabel, perCopyLines }) => {
                          const hintLine = formatPlacementHintLine(placement.position_hint, placement.facing_hint);
                          return (
                            <Box key={placement.id} sx={{ mt: 0.85 }}>
                              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa' }}>
                                Placement · {slotLabel}
                              </Typography>
                              {hintLine ? (
                                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{hintLine}</Typography>
                              ) : (
                                <Typography sx={{ fontSize: '0.64rem', color: '#64748b', fontStyle: 'italic' }}>
                                  No position/facing hint on this placement (canvas tokens carry the spot).
                                </Typography>
                              )}
                              <Stack spacing={0.45} sx={{ mt: 0.45 }}>
                                {perCopyLines.map((line) => (
                                  <Box
                                    key={line.copyIndex}
                                    sx={{
                                      pl: 0.75,
                                      borderLeft: '2px solid rgba(167,139,250,0.4)',
                                      pt: 0.1,
                                      pb: 0.1,
                                    }}
                                  >
                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#e2e8f0' }}>
                                      {line.memberLabel}
                                    </Typography>
                                    {line.seatLabel && (
                                      <Typography sx={{ fontSize: '0.62rem', color: '#cbd5e1', mt: 0.15 }}>
                                        Ceremony seat: {line.seatLabel}
                                      </Typography>
                                    )}
                                    {line.coords && (
                                      <Typography sx={{ fontSize: '0.6rem', color: '#64748b', mt: 0.1 }}>
                                        Canvas x,y,r: {Math.round(line.coords.x)}, {Math.round(line.coords.y)},{' '}
                                        {Math.round(line.coords.rotation)}°
                                      </Typography>
                                    )}
                                    {!line.seatLabel && !line.coords && (
                                      <Typography sx={{ fontSize: '0.6rem', color: '#64748b', mt: 0.1, fontStyle: 'italic' }}>
                                        No seat saved for this member (e.g. overflow or not seated in layout).
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

          </Stack>
        )}
      </Box>
    </Box>
  );
}

function formatPlacementHintLine(positionHint?: string | null, facingHint?: string | null): string | null {
  const clean = (raw?: string | null) => {
    const t = (raw ?? '').trim();
    if (!t) return null;
    if (/^unspecified$/i.test(t)) return null;
    return t;
  };
  const p = clean(positionHint);
  const f = clean(facingHint);
  const parts = [p, f].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' · ') : null;
}

function ContextMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.74rem', color: '#cbd5e1', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Per-activity AI moment-count override. Empty string clears the override
 * (sends null) so the brand's density library takes over again. Commits on
 * blur to avoid spamming the activity update mutation on each keystroke.
 */
function TargetMomentCountField({
  activityId,
  value,
  onChange,
  disabled,
}: {
  activityId: number;
  value: number | null;
  onChange: (next: number | null) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<string>(value == null ? '' : String(value));
  useEffect(() => {
    setDraft(value == null ? '' : String(value));
  }, [activityId, value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      if (value != null) onChange(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraft(value == null ? '' : String(value));
      return;
    }
    const next = Math.max(1, Math.min(24, Math.floor(parsed)));
    if (next !== value) onChange(next);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Tooltip title="Overrides the brand's density library for this activity. Leave blank to defer.">
        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          AI moments override
        </Typography>
      </Tooltip>
      <TextField
        size="small"
        type="number"
        value={draft}
        placeholder="auto"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        disabled={disabled}
        inputProps={{ min: 1, max: 24, style: { textAlign: 'right' } }}
        sx={{
          width: 88,
          '& .MuiOutlinedInput-root': { fontSize: '0.74rem', color: '#cbd5e1', bgcolor: 'rgba(255,255,255,0.03)' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
        }}
      />
    </Box>
  );
}

