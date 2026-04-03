'use client';

import React from 'react';
import {
    Alert,
    Box,
    CardContent,
    CircularProgress,
    Divider,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { CheckCircle, Videocam, WorkOutline } from '@mui/icons-material';
import type { Inquiry, InquiryCrewAvailabilityRow, InquiryEquipmentAvailabilityRow, InquiryTask, ReservationState } from '../../types';
import { useAvailabilityCard } from '../../hooks/use-availability-card';
import { StatusBanner } from './StatusBanner';
import { RequestBadge } from './RequestBadge';
import { ReserveBadge } from './ReserveBadge';
import { CrewRow, formatDayHeader } from './CrewRow';
import { EquipmentRow } from './EquipmentRow';
import CrewAvailabilityRequestDialog from '../crew-availability-request-dialog';
import EquipmentReservationDialog from '../equipment-reservation-dialog';

interface AvailabilityCardProps {
    inquiry: Inquiry;
    inquiryTasks?: InquiryTask[];
    isActive?: boolean;
    activeColor?: string;
    onTasksChanged?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

const AvailabilityCard: React.FC<AvailabilityCardProps> = ({ inquiry, isActive, activeColor, onTasksChanged, WorkflowCard }) => {
    const {
        crew,
        equipment,
        loading,
        error,
        requests,
        sending,
        reservations,
        reserving,
        mergedCrewGroups,
        unassignedRows,
        swappingSlots,
        swappingEquipment,
        uniqueCrewCount,
        crewReadyCount,
        equipmentReadyCount,
        crewDialogState,
        crewDialogError,
        equipmentDialogState,
        equipmentDialogError,
        handleUpdateStatus,
        handleDirectConfirmCrew,
        handleToggleSlotConfirmed,
        handleSwapCrew,
        openCrewRequestDialog,
        confirmCrewRequest,
        setCrewEmailSubject,
        setCrewEmailBody,
        setCrewDialogState,
        handleSwapEquipment,
        handleCancelOwnerReservations,
        handleConfirmOwnerReservations,
        handleDirectConfirmEquipment,
        openEquipmentDialog,
        confirmEquipmentReservation,
        confirmCancelReservation,
        setEquipmentEmailSubject,
        setEquipmentEmailBody,
        setEquipmentDialogState,
    } = useAvailabilityCard({ inquiry, onTasksChanged });

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid rgba(52,58,68,0.3)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent)' }}>
                    <CheckCircle sx={{ color: '#60a5fa', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                        Availability
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} sx={{ color: '#64748b' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Checking on-site crew and assigned gear…
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2.5 }}>
                        <Alert severity="warning">{error}</Alert>
                    </Box>
                ) : (
                    <Box sx={{ p: 2.5 }}>
                        <StatusBanner
                            crewConflicts={crew?.summary.conflicts ?? 0}
                            equipmentConflicts={equipment?.summary.conflicts ?? 0}
                            crewTotal={uniqueCrewCount}
                            equipmentTotal={equipment?.summary.total ?? 0}
                            crewReady={crewReadyCount}
                            equipmentReady={equipmentReadyCount}
                        />

                        {/* ─── Crew (merged: on-site + project roles per person) ─── */}
                        {mergedCrewGroups.length > 0 && (
                            <Stack spacing={0.8}>
                                {mergedCrewGroups.map(({ cid, name, onSiteRows, projectRows }) => {
                                    const allRows = [...onSiteRows, ...projectRows];
                                    const totalRoles = allRows.length;
                                    const reqState = requests.get(cid);

                                    const onSiteByDay = new Map<string, InquiryCrewAvailabilityRow[]>();
                                    for (const r of onSiteRows) {
                                        const key = r.event_day!.date.slice(0, 10);
                                        if (!onSiteByDay.has(key)) onSiteByDay.set(key, []);
                                        onSiteByDay.get(key)!.push(r);
                                    }

                                    return (
                                        <Box key={cid} sx={{ p: 1.1, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.26)', border: '1px solid rgba(52,58,68,0.35)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                                        {name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.67rem', color: '#475569' }}>
                                                        {totalRoles} role{totalRoles !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                                <RequestBadge
                                                    requestState={reqState}
                                                    onSend={() => openCrewRequestDialog(allRows[0])}
                                                    onUpdateStatus={(status) => {
                                                        if (reqState) handleUpdateStatus(cid, reqState.id, status);
                                                    }}
                                                    onDirectConfirm={() => handleDirectConfirmCrew(cid, allRows[0])}
                                                    sending={sending.has(cid)}
                                                />
                                            </Box>

                                            {onSiteRows.length > 0 && (
                                                <Box sx={{ mb: projectRows.length > 0 ? 0.8 : 0 }}>
                                                    {Array.from(onSiteByDay.entries()).map(([dateKey, dayRows]) => (
                                                        <Box key={dateKey} sx={{ mb: 0.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4, pl: 0.25 }}>
                                                                <Tooltip title="On-site" arrow placement="top">
                                                                    <Videocam sx={{ fontSize: 13, color: '#60a5fa' }} />
                                                                </Tooltip>
                                                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: '#60a5fa' }}>
                                                                    {formatDayHeader(dayRows[0].event_day!.date, dayRows[0].event_day!.start_time, dayRows[0].event_day!.end_time)}
                                                                </Typography>
                                                            </Box>
                                                            <Stack spacing={0.5}>
                                                                {dayRows.map((row) => <CrewRow key={row.id} row={row} onSwap={handleSwapCrew} swapping={swappingSlots.has(row.id)} confirmed={row.confirmed ?? false} onToggleConfirmed={handleToggleSlotConfirmed} />)}
                                                            </Stack>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}

                                            {projectRows.length > 0 && (
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4, pl: 0.25 }}>
                                                        <Tooltip title="Project role" arrow placement="top">
                                                            <WorkOutline sx={{ fontSize: 13, color: '#a78bfa' }} />
                                                        </Tooltip>
                                                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: '#a78bfa' }}>
                                                            Project Roles
                                                        </Typography>
                                                    </Box>
                                                    <Stack spacing={0.5}>
                                                        {projectRows.map((row) => <CrewRow key={row.id} row={row} onSwap={handleSwapCrew} swapping={swappingSlots.has(row.id)} confirmed={row.confirmed ?? false} onToggleConfirmed={handleToggleSlotConfirmed} />)}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                                {unassignedRows.map((row) => <CrewRow key={row.id} row={row} onSwap={handleSwapCrew} swapping={swappingSlots.has(row.id)} />)}
                            </Stack>
                        )}

                        {(crew?.rows ?? []).length === 0 && (
                            <Alert severity="info">No crew roles are assigned yet.</Alert>
                        )}

                        <Divider sx={{ my: 2, borderColor: 'rgba(52,58,68,0.3)' }} />

                        {/* ─── Equipment ─── */}
                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.9 }}>
                            Equipment Availability
                        </Typography>
                        <Stack spacing={0.8}>
                            {(equipment?.rows ?? []).length === 0 ? (
                                <Alert severity="info">No assigned equipment needs review yet.</Alert>
                            ) : (() => {
                                const equipmentByOwner = new Map<number | null, InquiryEquipmentAvailabilityRow[]>();
                                for (const row of (equipment?.rows ?? [])) {
                                    const ownerId = row.equipment.owner?.id ?? null;
                                    if (!equipmentByOwner.has(ownerId)) {
                                        equipmentByOwner.set(ownerId, []);
                                    }
                                    equipmentByOwner.get(ownerId)!.push(row);
                                }

                                return Array.from(equipmentByOwner.entries()).map(([ownerId, ownerRows]) => {
                                    const firstRow = ownerRows[0];
                                    const ownerName = firstRow.equipment.owner?.name ?? 'Equipment Owner';
                                    const owner = firstRow.equipment.owner;
                                    const ownerReserving = ownerRows.some((row) => reserving.has(row.id));
                                    const ownerStatuses = ownerRows.map((row) => reservations.get(row.id)?.status);
                                    const ownerAllActive = ownerRows.length > 0 && ownerStatuses.every((s) => s === 'reserved' || s === 'confirmed');
                                    const ownerAllConfirmed = ownerAllActive && ownerStatuses.every((s) => s === 'confirmed');
                                    const ownerReservationState: ReservationState | undefined = ownerAllActive
                                        ? { id: ownerId ?? -1, status: ownerAllConfirmed ? 'confirmed' : 'reserved' }
                                        : undefined;

                                    return (
                                        <Box key={ownerId ?? 'unowned'} sx={{ mb: 1, p: 1.1, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.26)', border: '1px solid rgba(52,58,68,0.35)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                                        {ownerName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.67rem', color: '#475569' }}>
                                                        {ownerRows.length} item{ownerRows.length !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                                <ReserveBadge
                                                    reservationState={ownerReservationState}
                                                    onReserve={() => openEquipmentDialog(firstRow)}
                                                    onUpdateStatus={(status) => {
                                                        if (status === 'confirmed') void handleConfirmOwnerReservations(ownerRows);
                                                        else void handleCancelOwnerReservations(ownerRows);
                                                    }}
                                                    onDirectConfirm={() => handleDirectConfirmEquipment(ownerRows)}
                                                    reserving={ownerReserving}
                                                    owner={owner}
                                                />
                                            </Box>
                                            <Stack spacing={0.8}>
                                                {ownerRows.map((row) => (
                                                    <EquipmentRow
                                                        key={row.id}
                                                        row={row}
                                                        reservationState={reservations.get(row.id)}
                                                        onSwap={handleSwapEquipment}
                                                        swapping={swappingEquipment.has(row.id)}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    );
                                });
                            })()}
                        </Stack>
                    </Box>
                )}
            </CardContent>

            <CrewAvailabilityRequestDialog
                open={Boolean(crewDialogState)}
                onClose={() => setCrewDialogState(null)}
                crewName={crewDialogState?.crewName ?? ''}
                crewEmail={crewDialogState?.crewEmail}
                rows={crewDialogState?.rows ?? []}
                requestStatus={crewDialogState?.requestState?.status ?? null}
                emailSubject={crewDialogState?.emailSubject ?? ''}
                emailBody={crewDialogState?.emailBody ?? ''}
                onEmailSubjectChange={setCrewEmailSubject}
                onEmailBodyChange={setCrewEmailBody}
                onConfirm={confirmCrewRequest}
                loading={crewDialogState ? sending.has(crewDialogState.crewId) : false}
                error={crewDialogError}
                previewTasks={crewDialogState?.previewTasks}
                eventDate={crewDialogState?.eventDate}
                venueDetails={crewDialogState?.venueDetails}
                eventType={crewDialogState?.eventType}
                clientName={crewDialogState?.clientName}
                brandName={crewDialogState?.brandName}
            />

            <EquipmentReservationDialog
                open={Boolean(equipmentDialogState)}
                onClose={() => setEquipmentDialogState(null)}
                rows={equipmentDialogState?.rows ?? []}
                ownerName={equipmentDialogState?.ownerName ?? ''}
                reservationStatuses={equipmentDialogState?.reservationStates ?? new Map()}
                emailSubject={equipmentDialogState?.emailSubject ?? ''}
                emailBody={equipmentDialogState?.emailBody ?? ''}
                onEmailSubjectChange={setEquipmentEmailSubject}
                onEmailBodyChange={setEquipmentEmailBody}
                onConfirm={confirmEquipmentReservation}
                onCancelReservation={equipmentDialogState && Array.from(equipmentDialogState.reservationStates.values()).every((s) => s.status === 'reserved') ? confirmCancelReservation : undefined}
                loading={equipmentDialogState ? Array.from(equipmentDialogState.rows).some((row) => reserving.has(row.id)) : false}
                error={equipmentDialogError}
            />
        </WorkflowCard>
    );
};

export default AvailabilityCard;
