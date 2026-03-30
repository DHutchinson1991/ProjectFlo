import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
    TimeRange,
    getEventDayTimeRange,
    timeRangesOverlap,
    isSameDay,
} from './inquiry-availability.utils';

/**
 * InquiryEquipmentAvailabilityService
 *
 * Handles equipment slot availability checks and conflict detection for an inquiry.
 * Ownership verification and subtask syncing are performed by
 * InquiryAvailabilityService (the facade) before calling these methods.
 */
@Injectable()
export class InquiryEquipmentAvailabilityService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Build and return the equipment availability rows for an inquiry.
     */
    async getRows(inquiryId: number, brandId: number) {
        const assignments = await this.prisma.projectCrewSlotEquipment.findMany({
            where: { project_crew_slot: { inquiry_id: inquiryId } },
            include: {
                equipment: {
                    select: {
                        id: true, item_name: true, item_code: true, category: true, type: true,
                        availability_status: true, rental_price_per_day: true,
                        owner: {
                            select: {
                                id: true,
                                contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } },
                            },
                        },
                    },
                },
                project_crew_slot: {
                    include: {
                        job_role: { select: { id: true, name: true, display_name: true } },
                        project_event_day: { select: { id: true, name: true, date: true, start_time: true, end_time: true } },
                    },
                },
            },
            orderBy: [
                { project_crew_slot: { project_event_day_id: 'asc' } },
                { project_crew_slot: { order_index: 'asc' } },
            ],
        });

        const existingReservations = await this.prisma.inquiry_equipment_reservations.findMany({
            where: { inquiry_id: inquiryId },
            select: { id: true, project_crew_slot_equipment_id: true, status: true },
        });
        const reservationBySlot = new Map(existingReservations.map((r) => [r.project_crew_slot_equipment_id, r]));

        const rows = await Promise.all(assignments.map(async (a) => {
            const timeRange = getEventDayTimeRange(a.project_crew_slot.project_event_day);
            const conflicts = await this.findEquipmentConflicts(a.equipment_id, inquiryId, timeRange);
            const alternatives = await this.findAvailableEquipment(
                brandId, String(a.equipment.category), inquiryId, timeRange, a.equipment_id,
            );
            const reservation = reservationBySlot.get(a.id);

            return {
                id: a.id,
                crew_slot_id: a.project_crew_slot_id,
                is_primary: a.is_primary,
                equipment: {
                    id: a.equipment.id,
                    item_name: a.equipment.item_name,
                    item_code: a.equipment.item_code,
                    category: a.equipment.category,
                    type: a.equipment.type,
                    availability_status: a.equipment.availability_status,
                    rental_price_per_day: a.equipment.rental_price_per_day != null
                        ? Number(a.equipment.rental_price_per_day)
                        : null,
                    owner: a.equipment.owner
                        ? {
                            id: a.equipment.owner.id,
                            name: `${a.equipment.owner.contact.first_name} ${a.equipment.owner.contact.last_name}`.trim(),
                            email: a.equipment.owner.contact.email ?? null,
                            phone: a.equipment.owner.contact.phone_number ?? null,
                        }
                        : null,
                },
                crew_slot: {
                    id: a.project_crew_slot.id,
                    label: a.project_crew_slot.label,
                    job_role: a.project_crew_slot.job_role,
                },
                event_day: {
                    id: a.project_crew_slot.project_event_day.id,
                    name: a.project_crew_slot.project_event_day.name,
                    date: a.project_crew_slot.project_event_day.date,
                    start_time: a.project_crew_slot.project_event_day.start_time,
                    end_time: a.project_crew_slot.project_event_day.end_time,
                },
                status: conflicts.length > 0 ? 'conflict' : 'available',
                has_conflict: conflicts.length > 0,
                conflict_reason: conflicts.length > 0 ? 'Equipment is assigned to an overlapping booking' : null,
                conflicts,
                alternatives,
                equipment_reservation_id: reservation?.id ?? null,
                equipment_reservation_status: reservation?.status ?? null,
            };
        }));

        return rows;
    }

    /**
     * Count the total number of equipment assignment conflicts for an inquiry.
     * Used by the facade to compute the resolve_availability_conflicts subtask.
     */
    async countEquipmentConflicts(inquiryId: number): Promise<number> {
        const assignments = await this.prisma.projectCrewSlotEquipment.findMany({
            where: { project_crew_slot: { inquiry_id: inquiryId } },
            include: {
                project_crew_slot: {
                    include: { project_event_day: { select: { date: true, start_time: true, end_time: true } } },
                },
            },
        });
        let count = 0;
        for (const a of assignments) {
            const timeRange = getEventDayTimeRange(a.project_crew_slot.project_event_day);
            const conflicts = await this.findEquipmentConflicts(a.equipment_id, inquiryId, timeRange);
            if (conflicts.length > 0) count++;
        }
        return count;
    }

    private async findEquipmentConflicts(equipmentId: number, inquiryId: number, currentRange: TimeRange) {
        const bookings = await this.prisma.projectCrewSlotEquipment.findMany({
            where: {
                equipment_id: equipmentId,
                project_crew_slot: {
                    NOT: { inquiry_id: inquiryId },
                    OR: [
                        { project_id: { not: null }, project: { archived_at: null } },
                        { inquiry_id: { not: null }, inquiry: { archived_at: null, status: 'Booked' } },
                    ],
                },
            },
            include: {
                project_crew_slot: {
                    include: {
                        project_event_day: { select: { date: true, start_time: true, end_time: true, name: true } },
                        project: { select: { id: true, project_name: true } },
                        inquiry: { select: { id: true, contact: { select: { first_name: true, last_name: true } } } },
                    },
                },
            },
        });

        return bookings
            .filter((b) => isSameDay(b.project_crew_slot.project_event_day.date, currentRange.start))
            .map((b) => ({ b, range: getEventDayTimeRange(b.project_crew_slot.project_event_day) }))
            .filter(({ range }) => timeRangesOverlap(range, currentRange))
            .map(({ b }) => ({
                type: b.project_crew_slot.project_id ? 'project' : 'inquiry',
                id: b.project_crew_slot.project_id ?? b.project_crew_slot.inquiry_id,
                title: b.project_crew_slot.project_id
                    ? (b.project_crew_slot.project?.project_name ?? `Project #${b.project_crew_slot.project_id}`)
                    : `${b.project_crew_slot.inquiry?.contact.first_name ?? ''} ${b.project_crew_slot.inquiry?.contact.last_name ?? ''}`.trim() || `Inquiry #${b.project_crew_slot.inquiry_id}`,
                event_day_name: b.project_crew_slot.project_event_day.name,
                start_time: b.project_crew_slot.project_event_day.start_time,
                end_time: b.project_crew_slot.project_event_day.end_time,
            }));
    }

    private async findAvailableEquipment(
        brandId: number,
        category: string,
        inquiryId: number,
        currentRange: TimeRange,
        currentEquipmentId?: number,
    ) {
        const candidates = await this.prisma.equipment.findMany({
            where: { brand_id: brandId, category: category as never, availability_status: 'AVAILABLE' },
            orderBy: [{ item_name: 'asc' }],
        });

        return Promise.all(candidates.map(async (c) => {
            const conflicts = await this.findEquipmentConflicts(c.id, inquiryId, currentRange);
            return {
                id: c.id,
                item_name: c.item_name,
                item_code: c.item_code,
                category: c.category,
                type: c.type,
                is_current: c.id === currentEquipmentId,
                conflicts,
            };
        }));
    }
}
