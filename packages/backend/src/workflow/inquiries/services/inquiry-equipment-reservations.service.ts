import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import type { InquiryTaskSubtaskKey } from '../../tasks/inquiry/constants/inquiry-task-subtasks.constants';
import { getEventDayTimeRange } from './inquiry-availability.utils';

/**
 * InquiryEquipmentReservationsService
 *
 * Manages equipment reservations for an inquiry: creating, cancelling,
 * swapping, and confirming equipment holds.
 * Ownership verification is performed by InquiryAvailabilityService (facade).
 */
@Injectable()
export class InquiryEquipmentReservationsService {
    private readonly logger = new Logger(InquiryEquipmentReservationsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    async reserveEquipment(inquiryId: number, assignmentId: number) {
        const assignment = await this.prisma.projectCrewSlotEquipment.findFirst({
            where: { id: assignmentId, project_crew_slot: { inquiry_id: inquiryId } },
            include: {
                project_crew_slot: {
                    include: {
                        project_event_day: { select: { date: true, start_time: true, end_time: true, name: true } },
                    },
                },
                equipment: { select: { item_name: true } },
            },
        });
        if (!assignment) {
            throw new NotFoundException(`Equipment assignment ${assignmentId} not found for inquiry ${inquiryId}`);
        }

        const timeRange = getEventDayTimeRange(assignment.project_crew_slot.project_event_day);
        const existing = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { inquiry_id: inquiryId, project_crew_slot_equipment_id: assignmentId },
        });

        const availabilityRecord = existing?.equipment_availability_id
            ? await this.prisma.equipment_availability.update({
                where: { id: existing.equipment_availability_id },
                data: { status: 'TENTATIVE' },
            })
            : await this.prisma.equipment_availability.create({
                data: {
                    equipment_id: assignment.equipment_id,
                    start_date: timeRange.start,
                    end_date: timeRange.end,
                    all_day: false,
                    status: 'TENTATIVE',
                    title: `Held – ${assignment.project_crew_slot.project_event_day.name || 'Event Day'}`,
                    inquiry_id: inquiryId,
                },
            });

        const reservation = existing
            ? await this.prisma.inquiry_equipment_reservations.update({
                where: { id: existing.id },
                data: { status: 'reserved', equipment_availability_id: availabilityRecord.id, cancelled_at: null, reserved_at: new Date() },
            })
            : await this.prisma.inquiry_equipment_reservations.create({
                data: {
                    inquiry_id: inquiryId,
                    equipment_id: assignment.equipment_id,
                    project_crew_slot_equipment_id: assignmentId,
                    equipment_availability_id: availabilityRecord.id,
                    status: 'reserved',
                },
            });

        await this.syncEquipmentReservationSubtask(inquiryId);
        return { id: reservation.id, status: reservation.status, equipment_availability_id: availabilityRecord.id };
    }

    async swapEquipment(inquiryId: number, assignmentId: number, newEquipmentId: number, brandId: number) {
        const assignment = await this.prisma.projectCrewSlotEquipment.findFirst({
            where: { id: assignmentId, project_crew_slot: { inquiry_id: inquiryId } },
            include: { project_crew_slot: { include: { project_event_day: { select: { date: true, start_time: true, end_time: true, name: true } } } } },
        });
        if (!assignment) {
            throw new NotFoundException(`Equipment assignment ${assignmentId} not found for inquiry ${inquiryId}`);
        }

        const newEquipment = await this.prisma.equipment.findFirst({ where: { id: newEquipmentId, brand_id: brandId } });
        if (!newEquipment) {
            throw new NotFoundException(`Equipment ${newEquipmentId} not found`);
        }

        const oldEquipmentId = assignment.equipment_id;
        const existingReservation = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { inquiry_id: inquiryId, project_crew_slot_equipment_id: assignmentId, status: { in: ['reserved', 'confirmed'] } },
        });

        if (existingReservation) {
            if (existingReservation.equipment_availability_id) {
                await this.prisma.equipment_availability.update({
                    where: { id: existingReservation.equipment_availability_id },
                    data: { status: 'AVAILABLE' },
                });
            }
            await this.prisma.inquiry_equipment_reservations.update({
                where: { id: existingReservation.id },
                data: { status: 'cancelled', cancelled_at: new Date() },
            });
        }

        await this.prisma.projectCrewSlotEquipment.update({
            where: { id: assignmentId },
            data: { equipment_id: newEquipmentId },
        });
        await this.syncEquipmentReservationSubtask(inquiryId);
        return { id: assignmentId, old_equipment_id: oldEquipmentId, new_equipment_id: newEquipmentId };
    }

    async cancelEquipmentReservation(inquiryId: number, reservationId: number) {
        const reservation = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { id: reservationId, inquiry_id: inquiryId },
        });
        if (!reservation) {
            throw new NotFoundException(`Equipment reservation ${reservationId} not found for inquiry ${inquiryId}`);
        }

        if (reservation.equipment_availability_id) {
            await this.prisma.equipment_availability.update({
                where: { id: reservation.equipment_availability_id },
                data: { status: 'AVAILABLE' },
            });
        }
        const result = await this.prisma.inquiry_equipment_reservations.update({
            where: { id: reservationId },
            data: { status: 'cancelled', cancelled_at: new Date() },
        });
        await this.syncEquipmentReservationSubtask(inquiryId);
        return result;
    }

    async updateEquipmentReservationStatus(inquiryId: number, reservationId: number, status: 'confirmed' | 'cancelled') {
        const reservation = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { id: reservationId, inquiry_id: inquiryId },
        });
        if (!reservation) {
            throw new NotFoundException(`Equipment reservation ${reservationId} not found for inquiry ${inquiryId}`);
        }

        if (status === 'cancelled') {
            if (reservation.equipment_availability_id) {
                await this.prisma.equipment_availability.update({
                    where: { id: reservation.equipment_availability_id },
                    data: { status: 'AVAILABLE' },
                });
            }
            const result = await this.prisma.inquiry_equipment_reservations.update({
                where: { id: reservationId },
                data: { status: 'cancelled', cancelled_at: new Date() },
            });
            await this.syncEquipmentReservationSubtask(inquiryId);
            return { id: result.id, status: result.status };
        }

        if (reservation.equipment_availability_id) {
            await this.prisma.equipment_availability.update({
                where: { id: reservation.equipment_availability_id },
                data: { status: 'BOOKED' },
            });
        }
        const result = await this.prisma.inquiry_equipment_reservations.update({
            where: { id: reservationId },
            data: { status: 'confirmed' },
        });
        await this.syncEquipmentReservationSubtask(inquiryId);
        return { id: result.id, status: result.status };
    }

    private async syncEquipmentReservationSubtask(inquiryId: number) {
        const assignments = await this.prisma.projectCrewSlotEquipment.findMany({
            where: { project_crew_slot: { inquiry_id: inquiryId } },
            select: { id: true },
        });
        if (assignments.length === 0) {
            await this.setSubtask(inquiryId, 'reserve_equipment', false);
            return;
        }
        const reservations = await this.prisma.inquiry_equipment_reservations.findMany({
            where: { inquiry_id: inquiryId, status: { in: ['reserved', 'confirmed'] } },
            select: { project_crew_slot_equipment_id: true },
        });
        const reservedIds = new Set(reservations.map((r) => r.project_crew_slot_equipment_id));
        await this.setSubtask(inquiryId, 'reserve_equipment', assignments.every((a) => reservedIds.has(a.id)));
    }

    private async setSubtask(inquiryId: number, key: InquiryTaskSubtaskKey, complete: boolean) {
        await this.inquiryTasksService.setAutoSubtaskStatus(inquiryId, key, complete);
    }
}
