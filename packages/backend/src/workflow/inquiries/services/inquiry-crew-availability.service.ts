import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
    TimeRange,
    getEventDayTimeRange,
    timeRangesOverlap,
    isSameDay,
} from './inquiry-availability.utils';

/**
 * InquiryCrewAvailabilityService
 *
 * Handles crew slot availability checks and conflict detection for an inquiry.
 * Ownership verification and subtask syncing are performed by
 * InquiryAvailabilityService (the facade) before calling these methods.
 */
@Injectable()
export class InquiryCrewAvailabilityService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Build and return the crew availability rows for an inquiry.
     * Returns rows + a flag indicating whether all on-site slots are conflict-free.
     */
    async getRows(inquiryId: number, brandId: number) {
        const slots = await this.prisma.projectCrewSlot.findMany({
            where: { inquiry_id: inquiryId },
            include: {
                job_role: { select: { id: true, name: true, display_name: true, on_site: true } },
                crew: {
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

        const rows = await Promise.all(slots.map(async (slot) => {
            const isOnSite = slot.job_role?.on_site ?? false;
            const timeRange = getEventDayTimeRange(slot.project_event_day);
            const conflicts = slot.crew_id
                ? await this.findCrewConflicts(slot.crew_id, inquiryId, timeRange)
                : [];
            const alternatives = slot.job_role_id
                ? await this.findAvailableCrew(slot.job_role_id, inquiryId, timeRange, brandId, slot.crew_id ?? undefined)
                : [];
            const hasConflict = conflicts.length > 0 || !slot.crew_id;

            return {
                id: slot.id,
                label: slot.label,
                job_role: slot.job_role,
                is_on_site: isOnSite,
                event_day: {
                    id: slot.project_event_day.id,
                    name: slot.project_event_day.name,
                    date: slot.project_event_day.date,
                    start_time: slot.project_event_day.start_time,
                    end_time: slot.project_event_day.end_time,
                },
                assigned_crew: slot.crew
                    ? {
                        id: slot.crew.id,
                        name: `${slot.crew.contact.first_name} ${slot.crew.contact.last_name}`.trim(),
                        email: slot.crew.contact.email,
                    }
                    : null,
                status: !slot.crew_id ? 'unassigned' : hasConflict ? 'conflict' : 'available',
                has_conflict: hasConflict,
                conflict_reason: !slot.crew_id
                    ? 'No crew assigned'
                    : conflicts.length > 0
                    ? 'Crew has an overlapping booking'
                    : null,
                conflicts,
                alternatives,
            };
        }));

        const onSiteRows = rows.filter((r) => r.is_on_site);
        const onSiteAllGood = onSiteRows.length === 0 || onSiteRows.every((r) => !r.has_conflict);
        return { rows, onSiteAllGood };
    }

    /**
     * Count the total number of conflicting crew slots for an inquiry.
     * Used by the facade to compute the resolve_availability_conflicts subtask.
     */
    async countCrewConflicts(inquiryId: number): Promise<number> {
        const slots = await this.prisma.projectCrewSlot.findMany({
            where: { inquiry_id: inquiryId },
            include: {
                project_event_day: { select: { date: true, start_time: true, end_time: true } },
            },
        });
        let count = 0;
        for (const slot of slots) {
            if (!slot.crew_id) {
                count++;
            } else {
                const timeRange = getEventDayTimeRange(slot.project_event_day);
                const conflicts = await this.findCrewConflicts(slot.crew_id, inquiryId, timeRange);
                if (conflicts.length > 0) count++;
            }
        }
        return count;
    }

    private async findCrewConflicts(crewId: number, inquiryId: number, currentRange: TimeRange) {
        const bookings = await this.prisma.projectCrewSlot.findMany({
            where: {
                crew_id: crewId,
                NOT: { inquiry_id: inquiryId },
                OR: [
                    { project_id: { not: null }, project: { archived_at: null } },
                    { inquiry_id: { not: null }, inquiry: { archived_at: null, status: 'Booked' } },
                ],
            },
            include: {
                project_event_day: { select: { date: true, start_time: true, end_time: true, name: true } },
                project: { select: { id: true, project_name: true } },
                inquiry: { select: { id: true, contact: { select: { first_name: true, last_name: true } } } },
            },
        });

        return bookings
            .filter((b) => isSameDay(b.project_event_day.date, currentRange.start))
            .map((b) => ({ b, range: getEventDayTimeRange(b.project_event_day) }))
            .filter(({ range }) => timeRangesOverlap(range, currentRange))
            .map(({ b }) => ({
                type: b.project_id ? 'project' : 'inquiry',
                id: b.project_id ?? b.inquiry_id,
                title: b.project_id
                    ? (b.project?.project_name ?? `Project #${b.project_id}`)
                    : `${b.inquiry?.contact.first_name ?? ''} ${b.inquiry?.contact.last_name ?? ''}`.trim() || `Inquiry #${b.inquiry_id}`,
                event_day_name: b.project_event_day.name,
                start_time: b.project_event_day.start_time,
                end_time: b.project_event_day.end_time,
            }));
    }

    private async findAvailableCrew(
        jobRoleId: number,
        inquiryId: number,
        currentRange: TimeRange,
        brandId: number,
        currentCrewId?: number,
    ) {
        const candidates = await this.prisma.crewJobRole.findMany({
            where: {
                job_role_id: jobRoleId,
                crew: { contact: { archived_at: null, brand_id: brandId } },
            },
            include: {
                crew: {
                    include: {
                        contact: { select: { first_name: true, last_name: true, email: true } },
                    },
                },
            },
        });

        return Promise.all(candidates.map(async (c) => {
            const conflicts = await this.findCrewConflicts(c.crew_id, inquiryId, currentRange);
            return {
                id: c.crew.id,
                name: `${c.crew.contact.first_name} ${c.crew.contact.last_name}`.trim(),
                email: c.crew.contact.email,
                is_current: c.crew.id === currentCrewId,
                conflicts,
            };
        }));
    }
}
