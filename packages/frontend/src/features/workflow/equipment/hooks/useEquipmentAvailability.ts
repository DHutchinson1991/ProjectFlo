'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { equipmentApi } from '../api';

export interface EquipmentAvailabilitySlot {
    id: number;
    equipment_id: number;
    start_date: string;
    end_date: string;
    all_day: boolean;
    status: 'AVAILABLE' | 'BOOKED' | 'IN_USE' | 'UNAVAILABLE' | 'TENTATIVE';
    title?: string;
    description?: string;
    project_id?: number;
    booked_by_id?: number;
    client_id?: number;
    booking_notes?: string;
    internal_notes?: string;
    created_at: string;
    updated_at: string;
    equipment?: {
        id: number;
        item_name: string;
        item_code: string;
        category: string;
        type: string;
    };
    project?: {
        id: number;
        project_name: string;
        wedding_date: string;
    } | null;
    booked_by?: {
        contact: {
            first_name: string;
            last_name: string;
            email: string;
        };
    } | null;
    client?: {
        contact: {
            first_name: string;
            last_name: string;
            email: string;
            company_name?: string;
        };
    } | null;
}

export function useEquipmentAvailability(equipmentId: number, currentDate: Date, statusFilter: string) {
    const dateRange = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString(),
        };
    }, [currentDate]);

    const query = useQuery({
        queryKey: ['equipment', equipmentId, 'availability', dateRange.start, dateRange.end, statusFilter],
        queryFn: () => equipmentApi.getAvailability(equipmentId, {
            start_date: dateRange.start,
            end_date: dateRange.end,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }) as Promise<EquipmentAvailabilitySlot[]>,
        enabled: Boolean(equipmentId),
        staleTime: 1000 * 60,
    });

    return {
        availabilitySlots: query.data ?? [],
        loading: query.isPending,
        error: query.error instanceof Error ? query.error.message : null,
    };
}