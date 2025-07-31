import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
    CreateCalendarEventDto,
    UpdateCalendarEventDto,
    CreateEventAttendeeDto,
    CreateEventReminderDto,
    CreateTagDto,
    CalendarQueryDto,
    UpdateCalendarSettingsDto,
    CalendarSettings,
    CalendarStats,
    ResponseStatus,
} from './dto/calendar.dto';

@Injectable()
export class CalendarService {
    constructor(private prisma: PrismaService) { }

    // Calendar Events
    async createEvent(createEventDto: CreateCalendarEventDto) {
        const createData: Prisma.calendar_eventsCreateInput = {
            title: createEventDto.title,
            description: createEventDto.description,
            start_time: new Date(createEventDto.start_time),
            end_time: new Date(createEventDto.end_time),
            is_all_day: createEventDto.is_all_day || false,
            event_type: createEventDto.event_type,
            contributor: { connect: { id: createEventDto.contributor_id } },
            meeting_type: createEventDto.meeting_type,
            location: createEventDto.location,
            meeting_url: createEventDto.meeting_url,
            outcome_notes: createEventDto.outcome_notes,
        };

        if (createEventDto.project_id) {
            createData.project = { connect: { id: createEventDto.project_id } };
        }

        if (createEventDto.inquiry_id) {
            createData.inquiry = { connect: { id: createEventDto.inquiry_id } };
        }

        return this.prisma.calendar_events.create({
            data: createData,
            include: {
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: true,
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                company_name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findAllEvents(query: CalendarQueryDto) {
        const where: Prisma.calendar_eventsWhereInput = {};

        if (query.start_date && query.end_date) {
            // Handle date parsing correctly to avoid timezone issues
            // If the date string is in YYYY-MM-DD format, treat it as local time
            let startDate: Date;
            let endDate: Date;

            if (query.start_date.includes('T') || query.start_date.includes(' ')) {
                // Full datetime string
                startDate = new Date(query.start_date);
            } else {
                // Date-only string (YYYY-MM-DD) - parse as local date
                const [year, month, day] = query.start_date.split('-').map(Number);
                startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
            }

            if (query.end_date.includes('T') || query.end_date.includes(' ')) {
                // Full datetime string
                endDate = new Date(query.end_date);
            } else {
                // Date-only string (YYYY-MM-DD) - parse as local date
                const [year, month, day] = query.end_date.split('-').map(Number);
                endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
            }

            // For day queries where start_date === end_date, we need to include the entire day
            if (query.start_date === query.end_date && !query.end_date.includes('T')) {
                endDate.setHours(23, 59, 59, 999);
            }

            console.log('📅 Calendar Query Debug:', {
                raw_start: query.start_date,
                raw_end: query.end_date,
                parsed_start: startDate.toISOString(),
                parsed_end: endDate.toISOString(),
                local_start: startDate.toString(),
                local_end: endDate.toString()
            });

            // Use a simple range query that includes events that START within the date range
            // This is more conservative and predictable than complex overlap logic
            where.start_time = {
                gte: startDate,
                lte: endDate,
            };
        }

        if (query.contributor_id) {
            where.contributor_id = query.contributor_id;
        }

        if (query.event_type) {
            where.event_type = query.event_type;
        }

        if (query.project_id) {
            where.project_id = query.project_id;
        }

        return this.prisma.calendar_events.findMany({
            where,
            include: {
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: true,
                event_tags: {
                    include: {
                        tag: true,
                    },
                },
                event_attendees: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                event_reminders: true,
            },
            orderBy: {
                start_time: 'asc',
            },
        });
    }

    async findEventById(id: number) {
        const event = await this.prisma.calendar_events.findUnique({
            where: { id },
            include: {
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: true,
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                company_name: true,
                            },
                        },
                    },
                },
                event_tags: {
                    include: {
                        tag: true,
                    },
                },
                event_attendees: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                event_reminders: true,
            },
        });

        if (!event) {
            throw new NotFoundException(`Calendar event with ID ${id} not found`);
        }

        return event;
    }

    async updateEvent(id: number, updateEventDto: UpdateCalendarEventDto) {
        await this.findEventById(id); // Check if exists

        const updateData: Prisma.calendar_eventsUpdateInput = {};

        if (updateEventDto.title !== undefined) updateData.title = updateEventDto.title;
        if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
        if (updateEventDto.start_time !== undefined) updateData.start_time = new Date(updateEventDto.start_time);
        if (updateEventDto.end_time !== undefined) updateData.end_time = new Date(updateEventDto.end_time);
        if (updateEventDto.is_all_day !== undefined) updateData.is_all_day = updateEventDto.is_all_day;
        if (updateEventDto.event_type !== undefined) updateData.event_type = updateEventDto.event_type;
        if (updateEventDto.inquiry_id !== undefined) {
            updateData.inquiry = updateEventDto.inquiry_id ? { connect: { id: updateEventDto.inquiry_id } } : { disconnect: true };
        }
        if (updateEventDto.meeting_type !== undefined) updateData.meeting_type = updateEventDto.meeting_type;
        if (updateEventDto.location !== undefined) updateData.location = updateEventDto.location;
        if (updateEventDto.meeting_url !== undefined) updateData.meeting_url = updateEventDto.meeting_url;
        if (updateEventDto.outcome_notes !== undefined) updateData.outcome_notes = updateEventDto.outcome_notes;

        return this.prisma.calendar_events.update({
            where: { id },
            data: updateData,
            include: {
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: true,
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                company_name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async deleteEvent(id: number) {
        await this.findEventById(id); // Check if exists

        return this.prisma.calendar_events.delete({
            where: { id },
        });
    }

    // Event Attendees
    async addEventAttendee(createAttendeeDto: CreateEventAttendeeDto) {
        // Check if event exists
        await this.findEventById(createAttendeeDto.event_id);

        return this.prisma.$executeRaw`
      INSERT INTO event_attendees (event_id, user_id, response_status)
      VALUES (${createAttendeeDto.event_id}, ${createAttendeeDto.user_id}, ${createAttendeeDto.response_status || ResponseStatus.PENDING})
      ON CONFLICT (event_id, user_id) DO UPDATE SET
        response_status = EXCLUDED.response_status
    `;
    }

    async getEventAttendees(eventId: number) {
        const result = await this.prisma.$queryRaw`
      SELECT 
        ea.id,
        ea.event_id,
        ea.user_id,
        ea.response_status,
        ea.created_at,
        c.first_name,
        c.last_name,
        c.email
      FROM event_attendees ea
      INNER JOIN contributors contrib ON ea.user_id = contrib.id
      INNER JOIN contacts c ON contrib.contact_id = c.id
      WHERE ea.event_id = ${eventId}
      ORDER BY c.first_name, c.last_name
    `;
        return result;
    }

    async updateAttendeeResponse(eventId: number, userId: number, responseStatus: ResponseStatus) {
        return this.prisma.$executeRaw`
      UPDATE event_attendees 
      SET response_status = ${responseStatus}
      WHERE event_id = ${eventId} AND user_id = ${userId}
    `;
    }

    async removeEventAttendee(eventId: number, userId: number) {
        return this.prisma.$executeRaw`
      DELETE FROM event_attendees 
      WHERE event_id = ${eventId} AND user_id = ${userId}
    `;
    }

    // Event Reminders
    async addEventReminder(createReminderDto: CreateEventReminderDto) {
        await this.findEventById(createReminderDto.event_id); // Check if event exists

        return this.prisma.$executeRaw`
      INSERT INTO event_reminders (event_id, reminder_type, minutes_before)
      VALUES (${createReminderDto.event_id}, ${createReminderDto.reminder_type}, ${createReminderDto.minutes_before})
    `;
    }

    async getEventReminders(eventId: number) {
        return this.prisma.$queryRaw`
      SELECT * FROM event_reminders 
      WHERE event_id = ${eventId}
      ORDER BY minutes_before DESC
    `;
    }

    // Tags
    async createTag(createTagDto: CreateTagDto) {
        return this.prisma.$executeRaw`
      INSERT INTO tags (name, color)
      VALUES (${createTagDto.name}, ${createTagDto.color})
      ON CONFLICT (name) DO UPDATE SET
        color = EXCLUDED.color
    `;
    }

    async getAllTags() {
        return this.prisma.$queryRaw`
      SELECT * FROM tags 
      ORDER BY name
    `;
    }

    async tagEvent(eventId: number, tagId: string) {
        await this.findEventById(eventId); // Check if event exists

        return this.prisma.$executeRaw`
      INSERT INTO event_tags (event_id, tag_id)
      VALUES (${eventId}, ${tagId}::uuid)
      ON CONFLICT (event_id, tag_id) DO NOTHING
    `;
    }

    async getEventTags(eventId: number) {
        return this.prisma.$queryRaw`
      SELECT t.id, t.name, t.color, t.created_at
      FROM event_tags et
      INNER JOIN tags t ON et.tag_id = t.id
      WHERE et.event_id = ${eventId}
      ORDER BY t.name
    `;
    }

    async removeEventTag(eventId: number, tagId: string) {
        return this.prisma.$executeRaw`
      DELETE FROM event_tags 
      WHERE event_id = ${eventId} AND tag_id = ${tagId}::uuid
    `;
    }

    // Calendar Settings
    async getUserCalendarSettings(userId: number): Promise<CalendarSettings | null> {
        const result = await this.prisma.$queryRaw`
      SELECT * FROM calendar_settings 
      WHERE user_id = ${userId}
    ` as CalendarSettings[];
        return result[0] || null;
    }

    async updateUserCalendarSettings(userId: number, settings: UpdateCalendarSettingsDto) {
        return this.prisma.$executeRaw`
      INSERT INTO calendar_settings (
        user_id, default_view, week_starts_on, working_hours_start, 
        working_hours_end, timezone, email_notifications, 
        browser_notifications, default_reminder_minutes
      )
      VALUES (
        ${userId}, ${settings.default_view}, ${settings.week_starts_on},
        ${settings.working_hours_start}::time, ${settings.working_hours_end}::time,
        ${settings.timezone}, ${settings.email_notifications},
        ${settings.browser_notifications}, ${settings.default_reminder_minutes}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        default_view = EXCLUDED.default_view,
        week_starts_on = EXCLUDED.week_starts_on,
        working_hours_start = EXCLUDED.working_hours_start,
        working_hours_end = EXCLUDED.working_hours_end,
        timezone = EXCLUDED.timezone,
        email_notifications = EXCLUDED.email_notifications,
        browser_notifications = EXCLUDED.browser_notifications,
        default_reminder_minutes = EXCLUDED.default_reminder_minutes,
        updated_at = NOW()
    `;
    }

    // Dashboard/Stats
    async getCalendarStats(userId?: number): Promise<CalendarStats> {
        const where = userId ? { contributor_id: userId } : {};

        const totalEvents = await this.prisma.calendar_events.count({
            where
        });

        const projectEvents = await this.prisma.calendar_events.count({
            where: { ...where, event_type: 'PROJECT_ASSIGNMENT' }
        });

        const personalEvents = await this.prisma.calendar_events.count({
            where: { ...where, event_type: 'PERSONAL' }
        });

        const holidayEvents = await this.prisma.calendar_events.count({
            where: { ...where, event_type: 'HOLIDAY' }
        });

        const upcomingEvents = await this.prisma.calendar_events.count({
            where: {
                ...where,
                start_time: { gte: new Date() }
            }
        });

        const pastEvents = await this.prisma.calendar_events.count({
            where: {
                ...where,
                start_time: { lt: new Date() }
            }
        });

        return {
            total_events: totalEvents,
            project_events: projectEvents,
            personal_events: personalEvents,
            holiday_events: holidayEvents,
            upcoming_events: upcomingEvents,
            past_events: pastEvents
        };
    }

    // Utility methods
    async getEventsForDateRange(startDate: string, endDate: string, contributorId?: number) {
        const query: CalendarQueryDto = {
            start_date: startDate,
            end_date: endDate,
        };

        if (contributorId) {
            query.contributor_id = contributorId;
        }

        console.log('📅 getEventsForDateRange called with:', {
            startDate,
            endDate,
            contributorId,
            query
        });

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
            start_time: {
                gte: new Date(),
            },
        };

        if (contributorId) {
            where.contributor_id = contributorId;
        }

        return this.prisma.calendar_events.findMany({
            where,
            include: {
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: true,
                event_tags: {
                    include: {
                        tag: true,
                    },
                },
                event_attendees: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                event_reminders: true,
            },
            orderBy: {
                start_time: 'asc',
            },
            take: limit,
        });
    }
}
