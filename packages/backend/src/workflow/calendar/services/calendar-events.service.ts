import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { Prisma } from '@prisma/client';
import {
    CreateCalendarEventDto,
    UpdateCalendarEventDto,
    CalendarQueryDto,
} from '../dto/calendar.dto';

@Injectable()
export class CalendarEventsService {
    constructor(
        private prisma: PrismaService,
        private inquiryTasksService: InquiryTasksService,
    ) { }

    private readonly eventInclude = {
        crew_member: {
            include: {
                contact: {
                    select: { first_name: true, last_name: true, email: true },
                },
            },
        },
        project: true,
        inquiry: {
            include: {
                contact: {
                    select: { first_name: true, last_name: true, email: true, company_name: true },
                },
            },
        },
        event_tags: { include: { tag: true } },
        event_attendees: {
            include: {
                crew_member: {
                    include: {
                        contact: {
                            select: { first_name: true, last_name: true, email: true },
                        },
                    },
                },
                contact: {
                    select: { first_name: true, last_name: true, email: true },
                },
            },
        },
        event_reminders: true,
    } satisfies Prisma.calendar_eventsInclude;

    async createEvent(createEventDto: CreateCalendarEventDto) {
        const createData: Prisma.calendar_eventsCreateInput = {
            title: createEventDto.title,
            description: createEventDto.description,
            start_time: new Date(createEventDto.start_time),
            end_time: new Date(createEventDto.end_time),
            is_all_day: createEventDto.is_all_day || false,
            event_type: createEventDto.event_type,
            crew_member: { connect: { id: createEventDto.crew_member_id } },
            meeting_type: createEventDto.meeting_type,
            location: createEventDto.location,
            meeting_url: createEventDto.meeting_url,
            outcome_notes: createEventDto.outcome_notes,
            is_confirmed: createEventDto.is_confirmed ?? false,
        };

        if (createEventDto.project_id) {
            createData.project = { connect: { id: createEventDto.project_id } };
        }

        if (createEventDto.inquiry_id) {
            createData.inquiry = { connect: { id: createEventDto.inquiry_id } };
        }

        const event = await this.prisma.calendar_events.create({
            data: createData,
            include: this.eventInclude,
        });

        // Auto-complete the 'Schedule Discovery Call' subtask when a discovery call event is booked
        if (createEventDto.inquiry_id && createEventDto.event_type === 'DISCOVERY_CALL') {
            try {
                await this.inquiryTasksService.setAutoSubtaskStatus(
                    createEventDto.inquiry_id,
                    'schedule_discovery_call',
                    true,
                );
            } catch {
                // Best-effort
            }
        }

        return event;
    }

    async findAllEvents(query: CalendarQueryDto) {
        const where: Prisma.calendar_eventsWhereInput = {};

        if (query.start_date && query.end_date) {
            const startDate = this.parseDate(query.start_date, 'start');
            const endDate = this.parseDate(query.end_date, 'end');

            // For day queries where start_date === end_date, ensure full day
            if (query.start_date === query.end_date && !query.end_date.includes('T')) {
                endDate.setHours(23, 59, 59, 999);
            }

            where.start_time = { gte: startDate, lte: endDate };
        }

        if (query.crew_member_id) where.crew_member_id = query.crew_member_id;
        if (query.event_type) where.event_type = query.event_type;
        if (query.project_id) where.project_id = query.project_id;

        return this.prisma.calendar_events.findMany({
            where,
            include: this.eventInclude,
            orderBy: { start_time: 'asc' },
        });
    }

    async findEventById(id: number) {
        const event = await this.prisma.calendar_events.findUnique({
            where: { id },
            include: this.eventInclude,
        });

        if (!event) {
            throw new NotFoundException(`Calendar event with ID ${id} not found`);
        }

        return event;
    }

    async updateEvent(id: number, updateEventDto: UpdateCalendarEventDto) {
        await this.findEventById(id);

        const updateData: Prisma.calendar_eventsUpdateInput = {};

        if (updateEventDto.title !== undefined) updateData.title = updateEventDto.title;
        if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
        if (updateEventDto.start_time !== undefined) updateData.start_time = new Date(updateEventDto.start_time);
        if (updateEventDto.end_time !== undefined) updateData.end_time = new Date(updateEventDto.end_time);
        if (updateEventDto.is_all_day !== undefined) updateData.is_all_day = updateEventDto.is_all_day;
        if (updateEventDto.event_type !== undefined) updateData.event_type = updateEventDto.event_type;
        if (updateEventDto.inquiry_id !== undefined) {
            updateData.inquiry = updateEventDto.inquiry_id
                ? { connect: { id: updateEventDto.inquiry_id } }
                : { disconnect: true };
        }
        if (updateEventDto.meeting_type !== undefined) updateData.meeting_type = updateEventDto.meeting_type;
        if (updateEventDto.location !== undefined) updateData.location = updateEventDto.location;
        if (updateEventDto.meeting_url !== undefined) updateData.meeting_url = updateEventDto.meeting_url;
        if (updateEventDto.outcome_notes !== undefined) updateData.outcome_notes = updateEventDto.outcome_notes;
        if (updateEventDto.is_confirmed !== undefined) updateData.is_confirmed = updateEventDto.is_confirmed;

        return this.prisma.calendar_events.update({
            where: { id },
            data: updateData,
            include: this.eventInclude,
        });
    }

    async deleteEvent(id: number) {
        await this.findEventById(id);
        return this.prisma.calendar_events.delete({ where: { id } });
    }

    async getEventsForDateRange(startDate: string, endDate: string, contributorId?: number) {
        const query: CalendarQueryDto = { start_date: startDate, end_date: endDate };
        if (contributorId) query.crew_member_id = contributorId;
        return this.findAllEvents(query);
    }

    async getTodaysEvents(contributorId?: number) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        return this.getEventsForDateRange(startOfDay, endOfDay, contributorId);
    }

    async getUpcomingEvents(contributorId?: number, limit: number = 10) {
        const where: Prisma.calendar_eventsWhereInput = {
            start_time: { gte: new Date() },
        };
        if (contributorId) where.crew_member_id = contributorId;

        return this.prisma.calendar_events.findMany({
            where,
            include: this.eventInclude,
            orderBy: { start_time: 'asc' },
            take: limit,
        });
    }

    private parseDate(dateStr: string, bound: 'start' | 'end'): Date {
        if (dateStr.includes('T') || dateStr.includes(' ')) {
            return new Date(dateStr);
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        return bound === 'start'
            ? new Date(year, month - 1, day, 0, 0, 0, 0)
            : new Date(year, month - 1, day, 23, 59, 59, 999);
    }
}
