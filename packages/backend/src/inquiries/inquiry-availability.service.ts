import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';
import { EstimatesService } from '../estimates/estimates.service';
import type { InquiryTaskSubtaskKey } from '../inquiry-tasks/inquiry-task-subtasks.constants';

type TimeRange = {
    start: Date;
    end: Date;
};

@Injectable()
export class InquiryAvailabilityService {
    private readonly logger = new Logger(InquiryAvailabilityService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly estimatesService: EstimatesService,
    ) {}

    async getCrewAvailability(inquiryId: number, brandId: number) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        // Fetch all slots (both on-site and project-level roles)
        const slots = await this.prisma.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId },
            include: {
                job_role: { select: { id: true, name: true, display_name: true, on_site: true } },
                contributor: {
                    include: {
                        contact: { select: { first_name: true, last_name: true, email: true } },
                    },
                },
                project_event_day: {
                    select: { id: true, name: true, date: true, start_time: true, end_time: true },
                },
            },
            orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
        });

        // Fetch all existing availability requests for this inquiry upfront
        const existingRequests = await this.prisma.inquiry_availability_requests.findMany({
            where: { inquiry_id: inquiryId },
            select: { id: true, contributor_id: true, status: true },
        });
        const requestByContributor = new Map(existingRequests.map((r) => [r.contributor_id, r]));

        const rows = await Promise.all(slots.map(async (slot) => {
            const isOnSite = slot.job_role?.on_site ?? false;
            const timeRange = this.getEventDayTimeRange(slot.project_event_day);
            const conflicts = slot.contributor_id
                ? await this.findContributorConflicts(slot.contributor_id, inquiryId, timeRange)
                : [];
            const alternatives = slot.job_role_id
                ? await this.findAvailableContributors(slot.job_role_id, inquiryId, timeRange, brandId, slot.contributor_id ?? undefined)
                : [];

            const hasConflict = conflicts.length > 0 || !slot.contributor_id;
            const request = slot.contributor_id ? requestByContributor.get(slot.contributor_id) : undefined;

            return {
                id: slot.id,
                position_name: slot.position_name,
                job_role: slot.job_role,
                is_on_site: isOnSite,
                event_day: {
                    id: slot.project_event_day.id,
                    name: slot.project_event_day.name,
                    date: slot.project_event_day.date,
                    start_time: slot.project_event_day.start_time,
                    end_time: slot.project_event_day.end_time,
                },
                assigned_contributor: slot.contributor
                    ? {
                        id: slot.contributor.id,
                        name: `${slot.contributor.contact.first_name} ${slot.contributor.contact.last_name}`.trim(),
                        email: slot.contributor.contact.email,
                    }
                    : null,
                status: !slot.contributor_id ? 'unassigned' : hasConflict ? 'conflict' : 'available',
                has_conflict: hasConflict,
                conflict_reason: !slot.contributor_id ? 'No contributor assigned' : conflicts.length > 0 ? 'Contributor has an overlapping booking' : null,
                conflicts,
                alternatives,
                availability_request_id: request?.id ?? null,
                availability_request_status: request?.status ?? null,
            };
        }));

        // Only count on-site conflicts for the auto-subtask
        const onSiteRows = rows.filter((r) => r.is_on_site);
        await this.syncAutoSubtask(inquiryId, 'check_crew_availability', onSiteRows.length === 0 || onSiteRows.every((row) => !row.has_conflict));

        // Sync combined resolve_availability_conflicts subtask
        await this.syncResolveConflicts(inquiryId, brandId);

        return {
            inquiry_id: inquiryId,
            rows,
            summary: {
                total: rows.length,
                resolved: rows.filter((row) => !row.has_conflict).length,
                conflicts: rows.filter((row) => row.has_conflict).length,
            },
        };
    }

    async getEquipmentAvailability(inquiryId: number, brandId: number) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        const assignments = await this.prisma.projectDayOperatorEquipment.findMany({
            where: {
                project_day_operator: {
                    inquiry_id: inquiryId,
                },
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        item_name: true,
                        item_code: true,
                        category: true,
                        type: true,
                        availability_status: true,
                        rental_price_per_day: true,
                        owner: {
                            select: {
                                id: true,
                                contact: {
                                    select: { first_name: true, last_name: true, email: true, phone_number: true },
                                },
                            },
                        },
                    },
                },
                project_day_operator: {
                    include: {
                        job_role: { select: { id: true, name: true, display_name: true } },
                        project_event_day: {
                            select: { id: true, name: true, date: true, start_time: true, end_time: true },
                        },
                    },
                },
            },
            orderBy: [
                { project_day_operator: { project_event_day_id: 'asc' } },
                { project_day_operator: { order_index: 'asc' } },
            ],
        });

        // Fetch existing reservations for this inquiry upfront
        const existingReservations = await this.prisma.inquiry_equipment_reservations.findMany({
            where: { inquiry_id: inquiryId },
            select: { id: true, project_day_operator_equipment_id: true, status: true },
        });
        const reservationBySlot = new Map(existingReservations.map((r) => [r.project_day_operator_equipment_id, r]));

        const rows = await Promise.all(assignments.map(async (assignment) => {
            const timeRange = this.getEventDayTimeRange(assignment.project_day_operator.project_event_day);
            const conflicts = await this.findEquipmentConflicts(assignment.equipment_id, inquiryId, timeRange);
            const alternatives = await this.findAvailableEquipment(
                brandId,
                String(assignment.equipment.category),
                inquiryId,
                timeRange,
                assignment.equipment_id,
            );

            const reservation = reservationBySlot.get(assignment.id);

            return {
                id: assignment.id,
                operator_id: assignment.project_day_operator_id,
                is_primary: assignment.is_primary,
                equipment: {
                    id: assignment.equipment.id,
                    item_name: assignment.equipment.item_name,
                    item_code: assignment.equipment.item_code,
                    category: assignment.equipment.category,
                    type: assignment.equipment.type,
                    availability_status: assignment.equipment.availability_status,
                    rental_price_per_day: assignment.equipment.rental_price_per_day != null
                        ? Number(assignment.equipment.rental_price_per_day)
                        : null,
                    owner: assignment.equipment.owner
                        ? {
                              id: assignment.equipment.owner.id,
                              name: `${assignment.equipment.owner.contact.first_name} ${assignment.equipment.owner.contact.last_name}`.trim(),
                              email: assignment.equipment.owner.contact.email ?? null,
                              phone: assignment.equipment.owner.contact.phone_number ?? null,
                          }
                        : null,
                },
                operator: {
                    id: assignment.project_day_operator.id,
                    position_name: assignment.project_day_operator.position_name,
                    job_role: assignment.project_day_operator.job_role,
                },
                event_day: {
                    id: assignment.project_day_operator.project_event_day.id,
                    name: assignment.project_day_operator.project_event_day.name,
                    date: assignment.project_day_operator.project_event_day.date,
                    start_time: assignment.project_day_operator.project_event_day.start_time,
                    end_time: assignment.project_day_operator.project_event_day.end_time,
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

        await this.syncAutoSubtask(inquiryId, 'check_equipment_availability', rows.length === 0 || rows.every((row) => !row.has_conflict));

        // Sync combined resolve_availability_conflicts subtask
        await this.syncResolveConflicts(inquiryId, brandId);

        return {
            inquiry_id: inquiryId,
            rows,
            summary: {
                total: rows.length,
                resolved: rows.filter((row) => !row.has_conflict).length,
                conflicts: rows.filter((row) => row.has_conflict).length,
            },
        };
    }

    private async syncAutoSubtask(inquiryId: number, subtaskKey: InquiryTaskSubtaskKey, isComplete: boolean) {
        await this.inquiryTasksService.setAutoSubtaskStatus(inquiryId, subtaskKey, isComplete);
    }

    /**
     * Syncs the resolve_availability_conflicts subtask by checking whether
     * BOTH crew and equipment have zero conflicts for this inquiry.
     * Called after every crew or equipment availability check.
     */
    private async syncResolveConflicts(inquiryId: number, brandId: number) {
        // Count ALL crew slots with conflicts (on-site + project roles)
        const crewSlots = await this.prisma.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId },
            include: {
                project_event_day: { select: { date: true, start_time: true, end_time: true } },
            },
        });
        let crewConflicts = 0;
        for (const slot of crewSlots) {
            if (!slot.contributor_id) {
                crewConflicts++;
            } else {
                const timeRange = this.getEventDayTimeRange(slot.project_event_day);
                const conflicts = await this.findContributorConflicts(slot.contributor_id, inquiryId, timeRange);
                if (conflicts.length > 0) crewConflicts++;
            }
        }

        // Count equipment slots with conflicts
        const equipmentAssignments = await this.prisma.projectDayOperatorEquipment.findMany({
            where: { project_day_operator: { inquiry_id: inquiryId } },
            include: {
                project_day_operator: {
                    include: { project_event_day: { select: { date: true, start_time: true, end_time: true } } },
                },
            },
        });
        let equipmentConflicts = 0;
        for (const assignment of equipmentAssignments) {
            const timeRange = this.getEventDayTimeRange(assignment.project_day_operator.project_event_day);
            const conflicts = await this.findEquipmentConflicts(assignment.equipment_id, inquiryId, timeRange);
            if (conflicts.length > 0) equipmentConflicts++;
        }

        const allResolved = crewConflicts === 0 && equipmentConflicts === 0;
        await this.syncAutoSubtask(inquiryId, 'resolve_availability_conflicts', allResolved);
    }

    private async verifyInquiryOwnership(inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                archived_at: null,
                contact: { brand_id: brandId },
            },
            select: { id: true },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry ${inquiryId} not found`);
        }
    }

    private getEventDayTimeRange(eventDay: { date: Date; start_time: string | null; end_time: string | null }): TimeRange {
        const start = this.combineDateAndTime(eventDay.date, eventDay.start_time ?? '00:00');
        const end = this.combineDateAndTime(eventDay.date, eventDay.end_time ?? '23:59');
        return { start, end: end > start ? end : this.combineDateAndTime(eventDay.date, '23:59') };
    }

    private combineDateAndTime(date: Date, time: string) {
        const [hours = '0', minutes = '0'] = time.split(':');
        const result = new Date(date);
        result.setHours(Number(hours), Number(minutes), 0, 0);
        return result;
    }

    private timeRangesOverlap(left: TimeRange, right: TimeRange) {
        return left.start < right.end && left.end > right.start;
    }

    private isSameDay(left: Date, right: Date) {
        return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
    }

    private async findContributorConflicts(contributorId: number, inquiryId: number, currentRange: TimeRange) {
        const bookings = await this.prisma.projectDayOperator.findMany({
            where: {
                contributor_id: contributorId,
                NOT: { inquiry_id: inquiryId },
                OR: [
                    {
                        project_id: { not: null },
                        project: { archived_at: null },
                    },
                    {
                        inquiry_id: { not: null },
                        inquiry: {
                            archived_at: null,
                            status: 'Booked',
                        },
                    },
                ],
            },
            include: {
                project_event_day: {
                    select: { date: true, start_time: true, end_time: true, name: true },
                },
                project: { select: { id: true, project_name: true } },
                inquiry: {
                    select: {
                        id: true,
                        contact: { select: { first_name: true, last_name: true } },
                    },
                },
            },
        });

        return bookings
            .filter((booking) => this.isSameDay(booking.project_event_day.date, currentRange.start))
            .map((booking) => ({
                booking,
                range: this.getEventDayTimeRange(booking.project_event_day),
            }))
            .filter(({ range }) => this.timeRangesOverlap(range, currentRange))
            .map(({ booking }) => ({
                type: booking.project_id ? 'project' : 'inquiry',
                id: booking.project_id ?? booking.inquiry_id,
                title: booking.project_id
                    ? booking.project?.project_name ?? `Project #${booking.project_id}`
                    : `${booking.inquiry?.contact.first_name ?? ''} ${booking.inquiry?.contact.last_name ?? ''}`.trim() || `Inquiry #${booking.inquiry_id}`,
                event_day_name: booking.project_event_day.name,
                start_time: booking.project_event_day.start_time,
                end_time: booking.project_event_day.end_time,
            }));
    }

    private async findAvailableContributors(
        jobRoleId: number,
        inquiryId: number,
        currentRange: TimeRange,
        brandId: number,
        currentContributorId?: number,
    ) {
        const candidates = await this.prisma.contributor_job_roles.findMany({
            where: {
                job_role_id: jobRoleId,
                contributor: {
                    contact: {
                        archived_at: null,
                        brand_id: brandId,
                    },
                },
            },
            include: {
                contributor: {
                    include: {
                        contact: { select: { first_name: true, last_name: true, email: true } },
                    },
                },
            },
        });

        return Promise.all(candidates.map(async (candidate) => {
            const conflicts = await this.findContributorConflicts(candidate.contributor_id, inquiryId, currentRange);
            return {
                id: candidate.contributor.id,
                name: `${candidate.contributor.contact.first_name} ${candidate.contributor.contact.last_name}`.trim(),
                email: candidate.contributor.contact.email,
                is_current: candidate.contributor.id === currentContributorId,
                conflicts,
            };
        }));
    }

    private async findEquipmentConflicts(equipmentId: number, inquiryId: number, currentRange: TimeRange) {
        const bookings = await this.prisma.projectDayOperatorEquipment.findMany({
            where: {
                equipment_id: equipmentId,
                project_day_operator: {
                    NOT: { inquiry_id: inquiryId },
                    OR: [
                        {
                            project_id: { not: null },
                            project: { archived_at: null },
                        },
                        {
                            inquiry_id: { not: null },
                            inquiry: {
                                archived_at: null,
                                status: 'Booked',
                            },
                        },
                    ],
                },
            },
            include: {
                project_day_operator: {
                    include: {
                        project_event_day: {
                            select: { date: true, start_time: true, end_time: true, name: true },
                        },
                        project: { select: { id: true, project_name: true } },
                        inquiry: {
                            select: {
                                id: true,
                                contact: { select: { first_name: true, last_name: true } },
                            },
                        },
                    },
                },
            },
        });

        return bookings
            .filter((booking) => this.isSameDay(booking.project_day_operator.project_event_day.date, currentRange.start))
            .map((booking) => ({
                booking,
                range: this.getEventDayTimeRange(booking.project_day_operator.project_event_day),
            }))
            .filter(({ range }) => this.timeRangesOverlap(range, currentRange))
            .map(({ booking }) => ({
                type: booking.project_day_operator.project_id ? 'project' : 'inquiry',
                id: booking.project_day_operator.project_id ?? booking.project_day_operator.inquiry_id,
                title: booking.project_day_operator.project_id
                    ? booking.project_day_operator.project?.project_name ?? `Project #${booking.project_day_operator.project_id}`
                    : `${booking.project_day_operator.inquiry?.contact.first_name ?? ''} ${booking.project_day_operator.inquiry?.contact.last_name ?? ''}`.trim() || `Inquiry #${booking.project_day_operator.inquiry_id}`,
                event_day_name: booking.project_day_operator.project_event_day.name,
                start_time: booking.project_day_operator.project_event_day.start_time,
                end_time: booking.project_day_operator.project_event_day.end_time,
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
            where: {
                brand_id: brandId,
                category: category as never,
                availability_status: 'AVAILABLE',
            },
            orderBy: [{ item_name: 'asc' }],
        });

        const available = await Promise.all(candidates.map(async (candidate) => {
            const conflicts = await this.findEquipmentConflicts(candidate.id, inquiryId, currentRange);
            return {
                id: candidate.id,
                item_name: candidate.item_name,
                item_code: candidate.item_code,
                category: candidate.category,
                type: candidate.type,
                is_current: candidate.id === currentEquipmentId,
                conflicts,
            };
        }));

        return available.filter((candidate) => candidate.conflicts.length === 0);
    }

    async sendAvailabilityRequest(
        inquiryId: number,
        contributorId: number,
        operatorId: number | undefined,
        brandId: number,
    ) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        const existing = await this.prisma.inquiry_availability_requests.findFirst({
            where: { inquiry_id: inquiryId, contributor_id: contributorId },
        });

        let result;
        if (existing) {
            result = await this.prisma.inquiry_availability_requests.update({
                where: { id: existing.id },
                data: { status: 'pending', sent_at: new Date(), responded_at: null, project_day_operator_id: operatorId ?? null },
            });
        } else {
            result = await this.prisma.inquiry_availability_requests.create({
                data: {
                    inquiry_id: inquiryId,
                    contributor_id: contributorId,
                    project_day_operator_id: operatorId ?? null,
                    status: 'pending',
                },
            });
        }

        await this.syncRequestSubtasks(inquiryId);
        return result;
    }

    async updateAvailabilityRequestStatus(
        inquiryId: number,
        requestId: number,
        status: 'confirmed' | 'declined' | 'cancelled',
        brandId: number,
    ) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        const request = await this.prisma.inquiry_availability_requests.findFirst({
            where: { id: requestId, inquiry_id: inquiryId },
        });

        if (!request) {
            throw new Error(`Availability request ${requestId} not found for inquiry ${inquiryId}`);
        }

        const isResponse = status === 'confirmed' || status === 'declined';
        const result = await this.prisma.inquiry_availability_requests.update({
            where: { id: requestId },
            data: {
                status,
                responded_at: isResponse ? new Date() : null,
            },
        });

        await this.syncRequestSubtasks(inquiryId);

        // When all crew are confirmed, auto-refresh the estimate so costs are current
        if (status === 'confirmed') {
            await this.autoRefreshEstimateIfAllCrewConfirmed(inquiryId);
        }

        return result;
    }

    private async syncRequestSubtasks(inquiryId: number) {
        // All slots with an assigned contributor
        const slots = await this.prisma.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId, contributor_id: { not: null } },
            select: { contributor_id: true },
        });

        const assignedContributorIds = [...new Set(slots.map((s) => s.contributor_id as number))];

        if (assignedContributorIds.length === 0) {
            // No one assigned yet — requests cannot be complete.
            await this.syncAutoSubtask(inquiryId, 'send_crew_availability_requests', false);
            return;
        }

        const requests = await this.prisma.inquiry_availability_requests.findMany({
            where: { inquiry_id: inquiryId },
            select: { contributor_id: true, status: true },
        });

        // A contributor has a "sent" request if they have any non-cancelled request record
        const sentContributorIds = new Set(
            requests.filter((r) => r.status !== 'cancelled').map((r) => r.contributor_id),
        );
        const allSent = assignedContributorIds.every((id) => sentContributorIds.has(id));

        await this.syncAutoSubtask(inquiryId, 'send_crew_availability_requests', allSent);
    }

    /**
     * When every assigned contributor has a 'confirmed' availability request,
     * auto-refresh the primary draft estimate so costs reflect the finalised crew,
     * then auto-complete the 'Review Estimate' pipeline task.
     */
    private async autoRefreshEstimateIfAllCrewConfirmed(inquiryId: number) {
        // All slots with an assigned contributor
        const slots = await this.prisma.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId, contributor_id: { not: null } },
            select: { contributor_id: true },
        });

        const assignedContributorIds = [...new Set(slots.map((s) => s.contributor_id as number))];
        if (assignedContributorIds.length === 0) return;

        const requests = await this.prisma.inquiry_availability_requests.findMany({
            where: { inquiry_id: inquiryId },
            select: { contributor_id: true, status: true },
        });

        // Check every assigned contributor has a 'confirmed' request
        const confirmedIds = new Set(
            requests.filter((r) => r.status === 'confirmed').map((r) => r.contributor_id),
        );
        const allConfirmed = assignedContributorIds.every((id) => confirmedIds.has(id));
        if (!allConfirmed) return;

        // Find the primary (or first) Draft estimate for this inquiry
        const draftEstimate = await this.prisma.estimates.findFirst({
            where: { inquiry_id: inquiryId, status: 'Draft' },
            orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
            select: { id: true },
        });
        if (!draftEstimate) return;

        try {
            await this.estimatesService.refreshItems(inquiryId, draftEstimate.id);
            this.logger.log(`Auto-refreshed estimate ${draftEstimate.id} — all crew confirmed for inquiry ${inquiryId}`);
        } catch (err) {
            this.logger.warn(`Failed to auto-refresh estimate ${draftEstimate.id}: ${err.message}`);
        }
    }

    async reserveEquipment(inquiryId: number, assignmentId: number, brandId: number) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        const assignment = await this.prisma.projectDayOperatorEquipment.findFirst({
            where: {
                id: assignmentId,
                project_day_operator: { inquiry_id: inquiryId },
            },
            include: {
                project_day_operator: {
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

        const timeRange = this.getEventDayTimeRange(assignment.project_day_operator.project_event_day);

        // Upsert: if a reservation already exists for this slot, re-activate it
        const existing = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { inquiry_id: inquiryId, project_day_operator_equipment_id: assignmentId },
        });

        let availabilityRecord;
        if (existing?.equipment_availability_id) {
            // Update existing availability block back to TENTATIVE
            availabilityRecord = await this.prisma.equipment_availability.update({
                where: { id: existing.equipment_availability_id },
                data: { status: 'TENTATIVE' },
            });
        } else {
            // Create new equipment_availability block
            availabilityRecord = await this.prisma.equipment_availability.create({
                data: {
                    equipment_id: assignment.equipment_id,
                    start_date: timeRange.start,
                    end_date: timeRange.end,
                    all_day: false,
                    status: 'TENTATIVE',
                    title: `Held – ${assignment.project_day_operator.project_event_day.name || 'Event Day'}`,
                    inquiry_id: inquiryId,
                },
            });
        }

        const reservation = existing
            ? await this.prisma.inquiry_equipment_reservations.update({
                where: { id: existing.id },
                data: {
                    status: 'reserved',
                    equipment_availability_id: availabilityRecord.id,
                    cancelled_at: null,
                    reserved_at: new Date(),
                },
            })
            : await this.prisma.inquiry_equipment_reservations.create({
                data: {
                    inquiry_id: inquiryId,
                    equipment_id: assignment.equipment_id,
                    project_day_operator_equipment_id: assignmentId,
                    equipment_availability_id: availabilityRecord.id,
                    status: 'reserved',
                },
            });

        await this.syncEquipmentReservationSubtask(inquiryId);
        return { id: reservation.id, status: reservation.status, equipment_availability_id: availabilityRecord.id };
    }

    async cancelEquipmentReservation(inquiryId: number, reservationId: number, brandId: number) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        const reservation = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { id: reservationId, inquiry_id: inquiryId },
        });

        if (!reservation) {
            throw new NotFoundException(`Equipment reservation ${reservationId} not found for inquiry ${inquiryId}`);
        }

        // Release the equipment_availability block
        if (reservation.equipment_availability_id) {
            await this.prisma.equipment_availability.update({
                where: { id: reservation.equipment_availability_id },
                data: { status: 'AVAILABLE' },
            });
        }

        return this.prisma.inquiry_equipment_reservations.update({
            where: { id: reservationId },
            data: { status: 'cancelled', cancelled_at: new Date() },
        }).then(async (result) => {
            await this.syncEquipmentReservationSubtask(inquiryId);
            return result;
        });
    }

    async updateEquipmentReservationStatus(
        inquiryId: number,
        reservationId: number,
        status: 'confirmed' | 'cancelled',
        brandId: number,
    ) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        const reservation = await this.prisma.inquiry_equipment_reservations.findFirst({
            where: { id: reservationId, inquiry_id: inquiryId },
        });

        if (!reservation) {
            throw new NotFoundException(`Equipment reservation ${reservationId} not found for inquiry ${inquiryId}`);
        }

        if (status === 'cancelled') {
            // Release the equipment_availability block
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

        // confirmed — lock the equipment_availability block
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
        // All equipment assignments for this inquiry
        const assignments = await this.prisma.projectDayOperatorEquipment.findMany({
            where: { project_day_operator: { inquiry_id: inquiryId } },
            select: { id: true },
        });

        if (assignments.length === 0) {
            await this.syncAutoSubtask(inquiryId, 'reserve_equipment', false);
            return;
        }

        const reservations = await this.prisma.inquiry_equipment_reservations.findMany({
            where: { inquiry_id: inquiryId, status: 'reserved' },
            select: { project_day_operator_equipment_id: true },
        });

        const reservedSlotIds = new Set(reservations.map((r) => r.project_day_operator_equipment_id));
        const allReserved = assignments.every((a) => reservedSlotIds.has(a.id));

        await this.syncAutoSubtask(inquiryId, 'reserve_equipment', allReserved);
    }
}
