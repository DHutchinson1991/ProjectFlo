'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Inquiry,
    InquiryAvailabilityResponse,
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    RequestState,
    RequestMap,
    ReservationState,
    ReservationMap,
    CrewDialogState,
    EquipmentDialogState,
    MergedCrewGroup,
    TaskAutoGenerationPreviewTask,
} from '../types';
import { useCrewPaymentTemplates } from '@/features/finance/crew-payment-templates';
import { crewSlotsApi } from '@/features/workflow/scheduling/shared';
import { taskLibraryApi } from '@/features/catalog/task-library/api';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { useBrand } from '@/features/platform/brand';
import { buildCrewEmailDraft, buildEquipmentEmailDraft } from '../components/availability-card/AvailabilityEmailBuilders';

export interface UseAvailabilityCardOptions {
    inquiry: Inquiry;
    onTasksChanged?: () => void;
}

export function useAvailabilityCard({ inquiry, onTasksChanged }: UseAvailabilityCardOptions) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const [crew, setCrew] = useState<InquiryAvailabilityResponse<InquiryCrewAvailabilityRow> | null>(null);
    const [equipment, setEquipment] = useState<InquiryAvailabilityResponse<InquiryEquipmentAvailabilityRow> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<RequestMap>(new Map());
    const [sending, setSending] = useState<Set<number>>(new Set());
    const [reservations, setReservations] = useState<ReservationMap>(new Map());
    const [reserving, setReserving] = useState<Set<number>>(new Set());
    const [crewDialogState, setCrewDialogState] = useState<CrewDialogState | null>(null);
    const [crewDialogError, setCrewDialogError] = useState<string | null>(null);
    const [equipmentDialogState, setEquipmentDialogState] = useState<EquipmentDialogState | null>(null);
    const [equipmentDialogError, setEquipmentDialogError] = useState<string | null>(null);
    const { data: crewPaymentTemplates = [] } = useCrewPaymentTemplates();
    const isMounted = useRef(true);
    const [swappingSlots, setSwappingSlots] = useState<Set<number>>(new Set());
    const [swappingEquipment, setSwappingEquipment] = useState<Set<number>>(new Set());

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const refreshAvailability = useCallback(async () => {
        try {
            const [crewData, equipmentData] = await Promise.all([
                inquiriesApi.getCrewAvailability(inquiry.id),
                inquiriesApi.getEquipmentAvailability(inquiry.id),
            ]);
            if (!isMounted.current) return;
            setCrew(crewData);
            setEquipment(equipmentData);
            const initialRequests: RequestMap = new Map();
            for (const row of crewData.rows) {
                if (row.assigned_crew && row.availability_request_id && row.availability_request_status) {
                    initialRequests.set(row.assigned_crew.id, {
                        id: row.availability_request_id,
                        status: row.availability_request_status as RequestState['status'],
                    });
                }
            }
            setRequests(initialRequests);
            const initialReservations: ReservationMap = new Map();
            for (const row of equipmentData.rows) {
                if (row.equipment_reservation_id && row.equipment_reservation_status) {
                    initialReservations.set(row.id, {
                        id: row.equipment_reservation_id,
                        status: row.equipment_reservation_status as ReservationState['status'],
                    });
                }
            }
            setReservations(initialReservations);
            setError(null);
        } catch (err) {
            console.error('Failed to load inquiry availability', err);
            if (isMounted.current) setError('Failed to load live crew and equipment availability.');
        }
    }, [inquiry.id, brandId]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            await refreshAvailability();
            if (!cancelled) {
                setLoading(false);
                onTasksChanged?.();
            }
        }
        load();
        return () => { cancelled = true; };
    }, [refreshAvailability]);

    const handleSendRequest = useCallback(async (row: InquiryCrewAvailabilityRow) => {
        if (!row.assigned_crew) return;
        const crewId = row.assigned_crew.id;
        setSending((prev) => new Set(prev).add(crewId));
        try {
            const result = await inquiriesApi.sendAvailabilityRequest(inquiry.id, {
                crew_id: crewId,
                project_crew_slot_id: row.id,
            });
            if (isMounted.current) {
                setRequests((prev) => new Map(prev).set(crewId, { id: result.id, status: result.status as RequestState['status'] }));
            }
        } catch (err) {
            console.error('Failed to send availability request', err);
        } finally {
            if (isMounted.current) setSending((prev) => { const s = new Set(prev); s.delete(crewId); return s; });
        }
    }, [inquiry.id]);

    const handleUpdateStatus = useCallback(async (
        crewId: number,
        requestId: number,
        status: 'pending' | 'confirmed' | 'declined' | 'cancelled',
    ) => {
        setSending((prev) => new Set(prev).add(crewId));
        try {
            const result = await inquiriesApi.updateAvailabilityRequest(inquiry.id, requestId, status);
            // Sync slot-level confirmations with person-level status
            if (status === 'confirmed') {
                await inquiriesApi.confirmAllSlotsForCrew(inquiry.id, crewId, true);
            } else if (status === 'pending' || status === 'cancelled' || status === 'declined') {
                await inquiriesApi.confirmAllSlotsForCrew(inquiry.id, crewId, false);
            }
            if (isMounted.current) {
                setRequests((prev) => new Map(prev).set(crewId, { id: result.id, status: result.status as RequestState['status'] }));
            }
            await refreshAvailability();
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to update availability request', err);
        } finally {
            if (isMounted.current) setSending((prev) => { const s = new Set(prev); s.delete(crewId); return s; });
        }
    }, [inquiry.id, onTasksChanged, refreshAvailability]);

    const handleReserveEquipment = useCallback(async (row: InquiryEquipmentAvailabilityRow) => {
        const assignmentId = row.id;
        setReserving((prev) => new Set(prev).add(assignmentId));
        try {
            const result = await inquiriesApi.reserveEquipment(inquiry.id, assignmentId);
            if (isMounted.current) {
                setReservations((prev) => new Map(prev).set(assignmentId, { id: result.id, status: result.status as ReservationState['status'] }));
            }
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to reserve equipment', err);
        } finally {
            if (isMounted.current) setReserving((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id, onTasksChanged]);

    const handleCancelReservation = useCallback(async (row: InquiryEquipmentAvailabilityRow) => {
        const assignmentId = row.id;
        const reservation = reservations.get(assignmentId);
        if (!reservation) return;
        setReserving((prev) => new Set(prev).add(assignmentId));
        try {
            await inquiriesApi.cancelEquipmentReservation(inquiry.id, reservation.id);
            if (isMounted.current) {
                setReservations((prev) => new Map(prev).set(assignmentId, { id: reservation.id, status: 'cancelled' }));
            }
        } catch (err) {
            console.error('Failed to cancel equipment reservation', err);
        } finally {
            if (isMounted.current) setReserving((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id, reservations]);

    const handleUpdateEquipmentStatus = useCallback(async (
        assignmentId: number,
        reservationId: number,
        status: 'confirmed' | 'cancelled',
    ) => {
        setReserving((prev) => new Set(prev).add(assignmentId));
        try {
            await inquiriesApi.updateEquipmentReservation(inquiry.id, reservationId, status);
            if (isMounted.current) {
                setReservations((prev) => new Map(prev).set(assignmentId, { id: reservationId, status }));
            }
        } catch (err) {
            console.error('Failed to update equipment reservation status', err);
        } finally {
            if (isMounted.current) setReserving((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id]);

    const handleDirectConfirmCrew = useCallback(async (crewId: number, row: InquiryCrewAvailabilityRow) => {
        setSending((prev) => new Set(prev).add(crewId));
        try {
            const created = await inquiriesApi.sendAvailabilityRequest(inquiry.id, {
                crew_id: crewId,
                project_crew_slot_id: row.id,
            });
            const confirmed = await inquiriesApi.updateAvailabilityRequest(inquiry.id, created.id, 'confirmed');
            await inquiriesApi.confirmAllSlotsForCrew(inquiry.id, crewId, true);
            if (isMounted.current) {
                setRequests((prev) => new Map(prev).set(crewId, { id: confirmed.id, status: 'confirmed' }));
            }
            await refreshAvailability();
        } catch (err) {
            console.error('Failed to directly confirm crew', err);
        } finally {
            if (isMounted.current) setSending((prev) => { const s = new Set(prev); s.delete(crewId); return s; });
        }
    }, [inquiry.id, refreshAvailability]);

    const handleToggleSlotConfirmed = useCallback(async (slotId: number, confirmed: boolean) => {
        try {
            await inquiriesApi.toggleSlotConfirmed(inquiry.id, slotId, confirmed);
            await refreshAvailability();
        } catch (err) {
            console.error('Failed to toggle slot confirmation', err);
        }
    }, [inquiry.id, refreshAvailability]);

    const handleSwapCrew = useCallback(async (slotId: number, newCrewId: number) => {
        setSwappingSlots((prev) => new Set(prev).add(slotId));
        try {
            await crewSlotsApi.projectDay.assign(slotId, newCrewId);
            await refreshAvailability();
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to reassign crew', err);
        } finally {
            if (isMounted.current) setSwappingSlots((prev) => { const s = new Set(prev); s.delete(slotId); return s; });
        }
    }, [refreshAvailability, onTasksChanged]);

    const handleSwapEquipment = useCallback(async (assignmentId: number, newEquipmentId: number) => {
        setSwappingEquipment((prev) => new Set(prev).add(assignmentId));
        try {
            await inquiriesApi.swapEquipment(inquiry.id, assignmentId, newEquipmentId);
            await refreshAvailability();
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to swap equipment', err);
        } finally {
            if (isMounted.current) setSwappingEquipment((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id, refreshAvailability, onTasksChanged]);

    const handleCancelOwnerReservations = useCallback(async (ownerRows: InquiryEquipmentAvailabilityRow[]) => {
        for (const row of ownerRows) {
            const state = reservations.get(row.id);
            if (state && (state.status === 'reserved' || state.status === 'confirmed')) {
                await handleUpdateEquipmentStatus(row.id, state.id, 'cancelled');
            }
        }
    }, [handleUpdateEquipmentStatus, reservations]);

    const handleConfirmOwnerReservations = useCallback(async (ownerRows: InquiryEquipmentAvailabilityRow[]) => {
        for (const row of ownerRows) {
            const state = reservations.get(row.id);
            if (state?.status === 'reserved') {
                await handleUpdateEquipmentStatus(row.id, state.id, 'confirmed');
            }
        }
    }, [handleUpdateEquipmentStatus, reservations]);

    const handleDirectConfirmEquipment = useCallback(async (ownerRows: InquiryEquipmentAvailabilityRow[]) => {
        for (const row of ownerRows) {
            setReserving((prev) => new Set(prev).add(row.id));
        }
        try {
            for (const row of ownerRows) {
                const result = await inquiriesApi.reserveEquipment(inquiry.id, row.id);
                await inquiriesApi.updateEquipmentReservation(inquiry.id, result.id, 'confirmed');
                if (isMounted.current) {
                    setReservations((prev) => new Map(prev).set(row.id, { id: result.id, status: 'confirmed' }));
                }
            }
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to directly confirm equipment', err);
        } finally {
            if (isMounted.current) {
                setReserving((prev) => {
                    const s = new Set(prev);
                    for (const row of ownerRows) s.delete(row.id);
                    return s;
                });
            }
        }
    }, [inquiry.id, onTasksChanged]);

    // Group ALL crew rows by crew (merged view — one card per person)
    const mergedCrewGroups: MergedCrewGroup[] = [];
    const unassignedRows: InquiryCrewAvailabilityRow[] = [];
    const seenCrewMerged = new Map<number, number>(); // cid → index

    for (const row of (crew?.rows ?? [])) {
        const cid = row.assigned_crew?.id;
        if (cid == null) {
            unassignedRows.push(row);
            continue;
        }
        if (!seenCrewMerged.has(cid)) {
            seenCrewMerged.set(cid, mergedCrewGroups.length);
            mergedCrewGroups.push({ cid, name: row.assigned_crew!.name, onSiteRows: [], projectRows: [] });
        }
        const group = mergedCrewGroups[seenCrewMerged.get(cid)!];
        if (row.is_on_site && row.event_day?.date) {
            group.onSiteRows.push(row);
        } else {
            group.projectRows.push(row);
        }
    }

    // Readiness counts for StatusBanner
    const uniqueCrewCount = new Set((crew?.rows ?? []).map(r => r.assigned_crew?.id).filter(Boolean)).size;
    const crewReadyCount = Array.from(requests.values()).filter(r => r.status === 'confirmed').length;
    const equipmentReadyCount = Array.from(reservations.values()).filter(r => r.status === 'reserved' || r.status === 'confirmed').length;

    const getCrewRows = useCallback((crewId: number) => {
        const allRows = crew?.rows ?? [];
        return allRows.filter((row) => row.assigned_crew?.id === crewId);
    }, [crew?.rows]);

    const openCrewRequestDialog = useCallback(async (row: InquiryCrewAvailabilityRow) => {
        if (!row.assigned_crew) return;
        const crewId = row.assigned_crew.id;
        const crewName = row.assigned_crew.name;
        const crewRows = getCrewRows(crewId);

        let previewTasks: TaskAutoGenerationPreviewTask[] | undefined;
        const packageId = inquiry.selected_package_id;
        if (packageId && brandId) {
            try {
                const preview = await taskLibraryApi.previewAutoGeneration(packageId, brandId, inquiry.id);
                previewTasks = preview.tasks;
            } catch {
                // non-fatal
            }
        }

        const draft = buildCrewEmailDraft(inquiry, crewName, crewRows, previewTasks, currentBrand, crewPaymentTemplates);
        setCrewDialogError(null);
        setCrewDialogState({
            crewId,
            crewName,
            crewEmail: row.assigned_crew.email,
            rows: crewRows,
            requestState: requests.get(crewId),
            emailSubject: draft.subject,
            emailBody: draft.body,
            previewTasks,
            eventDate: inquiry.event_date ?? null,
            venueDetails: [inquiry.venue_details, inquiry.venue_address].filter(Boolean).join(', ') || null,
            eventType: inquiry.event_type ?? null,
            clientName: inquiry.contact?.full_name ?? inquiry.contact?.first_name,
            brandName: currentBrand?.display_name ?? currentBrand?.name,
        });
    }, [getCrewRows, inquiry, requests, brandId, currentBrand, crewPaymentTemplates]);

    const openEquipmentDialog = useCallback((row: InquiryEquipmentAvailabilityRow) => {
        const ownerId = row.equipment.owner?.id;
        if (ownerId === undefined) return;

        const ownerRows = (equipment?.rows ?? []).filter((r) => r.equipment.owner?.id === ownerId);
        const ownerName = row.equipment.owner?.name ?? 'Equipment Owner';
        const ownerEmail = row.equipment.owner?.email;

        const draft = buildEquipmentEmailDraft(inquiry, ownerName, ownerRows, currentBrand);
        setEquipmentDialogError(null);

        const reservationStates = new Map<number, ReservationState>();
        for (const r of ownerRows) {
            const state = reservations.get(r.id);
            if (state) {
                reservationStates.set(r.id, state);
            }
        }

        setEquipmentDialogState({
            ownerId,
            ownerName,
            ownerEmail,
            rows: ownerRows,
            reservationStates,
            emailSubject: draft.subject,
            emailBody: draft.body,
        });
    }, [inquiry, equipment?.rows, reservations, currentBrand]);

    const confirmCrewRequest = useCallback(async () => {
        if (!crewDialogState) return;
        const firstRow = crewDialogState.rows[0];
        if (!firstRow) return;

        try {
            await handleSendRequest(firstRow);
            if (crewDialogState.crewEmail) {
                const mailto = `mailto:${encodeURIComponent(crewDialogState.crewEmail)}?subject=${encodeURIComponent(crewDialogState.emailSubject)}&body=${encodeURIComponent(crewDialogState.emailBody)}`;
                window.location.href = mailto;
            }
            setCrewDialogState(null);
        } catch (err) {
            setCrewDialogError(err instanceof Error ? err.message : 'Unable to send availability request');
        }
    }, [crewDialogState, handleSendRequest]);

    const confirmEquipmentReservation = useCallback(async () => {
        if (!equipmentDialogState) return;

        try {
            for (const row of equipmentDialogState.rows) {
                await handleReserveEquipment(row);
            }
            if (equipmentDialogState.ownerEmail) {
                const mailto = `mailto:${encodeURIComponent(equipmentDialogState.ownerEmail)}?subject=${encodeURIComponent(equipmentDialogState.emailSubject)}&body=${encodeURIComponent(equipmentDialogState.emailBody)}`;
                window.location.href = mailto;
            }
            setEquipmentDialogState(null);
        } catch (err) {
            setEquipmentDialogError(err instanceof Error ? err.message : 'Unable to reserve equipment');
        }
    }, [equipmentDialogState, handleReserveEquipment]);

    const confirmCancelReservation = useCallback(async () => {
        if (!equipmentDialogState) return;

        try {
            for (const row of equipmentDialogState.rows) {
                const state = equipmentDialogState.reservationStates.get(row.id);
                if (state) {
                    await handleCancelReservation(row);
                }
            }
            setEquipmentDialogState(null);
        } catch (err) {
            setEquipmentDialogError(err instanceof Error ? err.message : 'Unable to cancel reservation');
        }
    }, [equipmentDialogState, handleCancelReservation]);

    const setCrewEmailSubject = useCallback((v: string) => {
        setCrewDialogState((prev) => prev ? { ...prev, emailSubject: v } : null);
    }, []);
    const setCrewEmailBody = useCallback((v: string) => {
        setCrewDialogState((prev) => prev ? { ...prev, emailBody: v } : null);
    }, []);
    const setEquipmentEmailSubject = useCallback((v: string) => {
        setEquipmentDialogState((prev) => prev ? { ...prev, emailSubject: v } : null);
    }, []);
    const setEquipmentEmailBody = useCallback((v: string) => {
        setEquipmentDialogState((prev) => prev ? { ...prev, emailBody: v } : null);
    }, []);

    return {
        // Data
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

        // Banner counts
        uniqueCrewCount,
        crewReadyCount,
        equipmentReadyCount,

        // Dialog state
        crewDialogState,
        crewDialogError,
        equipmentDialogState,
        equipmentDialogError,

        // Crew handlers
        handleSendRequest,
        handleUpdateStatus,
        handleDirectConfirmCrew,
        handleToggleSlotConfirmed,
        handleSwapCrew,
        openCrewRequestDialog,
        confirmCrewRequest,
        setCrewEmailSubject,
        setCrewEmailBody,
        setCrewDialogState,

        // Equipment handlers
        handleReserveEquipment,
        handleCancelReservation,
        handleUpdateEquipmentStatus,
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
    };
}
