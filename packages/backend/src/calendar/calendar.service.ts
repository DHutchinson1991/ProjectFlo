import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BrandsService } from '../business/brands/brands.service';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';
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
    constructor(
        private prisma: PrismaService,
        private brandsService: BrandsService,
        private inquiryTasksService: InquiryTasksService,
    ) { }

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

        // Auto-complete the 'Schedule Discovery Call' subtask on Q&R when a discovery call event is booked
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
        if (updateEventDto.is_confirmed !== undefined) updateData.is_confirmed = updateEventDto.is_confirmed;

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

    /**
     * Fetches inquiry_tasks and project_tasks with due_dates in the given range,
     * returning them in a unified shape for the calendar frontend.
     */
    async getTasksForDateRange(startDate: string, endDate: string) {
        let start: Date;
        let end: Date;

        if (startDate.includes('T') || startDate.includes(' ')) {
            start = new Date(startDate);
        } else {
            const [y, m, d] = startDate.split('-').map(Number);
            start = new Date(y, m - 1, d, 0, 0, 0, 0);
        }

        if (endDate.includes('T') || endDate.includes(' ')) {
            end = new Date(endDate);
        } else {
            const [y, m, d] = endDate.split('-').map(Number);
            end = new Date(y, m - 1, d, 23, 59, 59, 999);
        }

        const dueDateFilter = { gte: start, lte: end };

        const [inquiryTasks, projectTasks] = await Promise.all([
            this.prisma.inquiry_tasks.findMany({
                where: {
                    is_active: true,
                    due_date: dueDateFilter,
                },
                include: {
                    inquiry: {
                        select: {
                            id: true,
                            contact: {
                                select: { first_name: true, last_name: true },
                            },
                        },
                    },
                },
                orderBy: { due_date: 'asc' },
            }),
            this.prisma.project_tasks.findMany({
                where: {
                    is_active: true,
                    due_date: dueDateFilter,
                },
                include: {
                    project: {
                        select: { id: true, project_name: true },
                    },
                    assigned_to: {
                        include: {
                            contact: {
                                select: { first_name: true, last_name: true, email: true },
                            },
                        },
                    },
                },
                orderBy: { due_date: 'asc' },
            }),
        ]);

        const unified = [
            ...inquiryTasks.map(t => ({
                id: t.id,
                source: 'inquiry' as const,
                inquiry_id: t.inquiry_id,
                project_id: null as number | null,
                name: t.name,
                description: t.description,
                phase: t.phase,
                status: t.status,
                due_date: t.due_date,
                estimated_hours: t.estimated_hours ? Number(t.estimated_hours) : null,
                completed_at: t.completed_at,
                context_label: t.inquiry?.contact
                    ? `${t.inquiry.contact.first_name} ${t.inquiry.contact.last_name}`
                    : `Inquiry #${t.inquiry_id}`,
                project_name: null as string | null,
                assignee: null as { id: number; name: string; email: string } | null,
            })),
            ...projectTasks.map(t => ({
                id: t.id,
                source: 'project' as const,
                inquiry_id: null as number | null,
                project_id: t.project_id,
                name: t.name,
                description: t.description,
                phase: t.phase,
                status: t.status,
                due_date: t.due_date,
                estimated_hours: t.estimated_hours ? Number(t.estimated_hours) : null,
                completed_at: null as Date | null,
                context_label: t.project?.project_name ?? `Project #${t.project_id}`,
                project_name: t.project?.project_name ?? null,
                assignee: t.assigned_to?.contact
                    ? {
                        id: t.assigned_to.id,
                        name: `${t.assigned_to.contact.first_name} ${t.assigned_to.contact.last_name}`.trim(),
                        email: t.assigned_to.contact.email,
                    }
                    : null,
            })),
        ];

        // Sort by due_date
        unified.sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        return unified;
    }

    /**
     * Fetches all active (non-archived) tasks across inquiries and projects,
     * with optional status filtering. Used by the Monday.com-style task board.
     */
    async getActiveTasks(status?: string) {
        const statusFilter = status
            ? { status: status as any }
            : { status: { not: 'Archived' as any } };

        const [inquiryTasks, projectTasks] = await Promise.all([
            this.prisma.inquiry_tasks.findMany({
                where: {
                    is_active: true,
                    ...statusFilter,
                },
                include: {
                    inquiry: {
                        select: {
                            id: true,
                            wedding_date: true,
                            status: true,
                            contact: {
                                select: { first_name: true, last_name: true, email: true },
                            },
                        },
                    },
                    completed_by: {
                        include: {
                            contact: {
                                select: { first_name: true, last_name: true, email: true },
                            },
                        },
                    },
                    assigned_to: {
                        include: {
                            contact: {
                                select: { first_name: true, last_name: true, email: true },
                            },
                        },
                    },
                    task_library: {
                        select: { is_auto_only: true },
                    },
                    children: {
                        where: { is_active: true },
                        select: { id: true, status: true },
                    },
                    subtasks: {
                        where: status ? { status: status as any } : { status: { not: 'Archived' as any } },
                        orderBy: [{ order_index: 'asc' }],
                        include: {
                            completed_by: {
                                include: {
                                    contact: {
                                        select: { first_name: true, last_name: true, email: true },
                                    },
                                },
                            },
                            job_role: {
                                select: { id: true, name: true, display_name: true },
                            },
                        },
                    },
                },
                orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
            }),
            this.prisma.project_tasks.findMany({
                where: {
                    is_active: true,
                    ...statusFilter,
                },
                include: {
                    project: {
                        select: { id: true, project_name: true, wedding_date: true },
                    },
                    assigned_to: {
                        include: {
                            contact: {
                                select: { first_name: true, last_name: true, email: true },
                            },
                        },
                    },
                },
                orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
            }),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const inquiryRows = inquiryTasks.flatMap((task) => {
            const contextLabel = task.inquiry?.contact
                ? `${task.inquiry.contact.first_name} ${task.inquiry.contact.last_name}`
                : `Inquiry #${task.inquiry_id}`;
            const baseAssignee = task.assigned_to?.contact
                ? {
                    id: task.assigned_to.id,
                    name: `${task.assigned_to.contact.first_name} ${task.assigned_to.contact.last_name}`.trim(),
                    email: task.assigned_to.contact.email,
                }
                : task.completed_by?.contact
                ? {
                    id: task.completed_by.id,
                    name: `${task.completed_by.contact.first_name} ${task.completed_by.contact.last_name}`.trim(),
                    email: task.completed_by.contact.email,
                }
                : null;

            const taskRow = {
                id: task.id,
                source: 'inquiry' as const,
                task_kind: 'task' as const,
                subtask_key: null as string | null,
                inquiry_id: task.inquiry_id,
                project_id: null as number | null,
                name: task.name,
                description: task.description,
                phase: task.phase,
                status: task.status,
                due_date: task.due_date,
                estimated_hours: task.estimated_hours ? Number(task.estimated_hours) : null,
                actual_hours: null as number | null,
                completed_at: task.completed_at,
                context_label: contextLabel,
                project_name: null as string | null,
                event_date: task.inquiry?.wedding_date ?? null,
                assignee: baseAssignee,
                is_stage: task.is_stage,
                parent_task_id: task.parent_inquiry_task_id,
                stage_color: task.stage_color,
                is_auto_only: task.task_library?.is_auto_only ?? false,
                children_count: task.subtasks.length > 0 ? task.subtasks.length : task.children.length,
                children_completed: task.subtasks.length > 0
                    ? task.subtasks.filter((subtask) => subtask.status === 'Completed').length
                    : task.children.filter((child) => child.status === 'Completed').length,
                priority: task.due_date && new Date(task.due_date) < today && task.status !== 'Completed' ? 'overdue' : null,
                subtask_parent_id: null as number | null,
                job_role: null as { id: number; name: string; display_name: string | null } | null,
            };

            const subtaskRows = task.subtasks.map((subtask) => ({
                id: subtask.id,
                source: 'inquiry' as const,
                task_kind: 'subtask' as const,
                subtask_key: subtask.subtask_key,
                inquiry_id: task.inquiry_id,
                project_id: null as number | null,
                name: subtask.name,
                description: null,
                phase: task.phase,
                status: subtask.status,
                due_date: task.due_date,
                estimated_hours: null as number | null,
                actual_hours: null as number | null,
                completed_at: subtask.completed_at,
                context_label: contextLabel,
                project_name: null as string | null,
                event_date: task.inquiry?.wedding_date ?? null,
                assignee: subtask.completed_by?.contact
                    ? {
                        id: subtask.completed_by.id,
                        name: `${subtask.completed_by.contact.first_name} ${subtask.completed_by.contact.last_name}`.trim(),
                        email: subtask.completed_by.contact.email,
                    }
                    : baseAssignee,
                is_stage: false,
                parent_task_id: task.parent_inquiry_task_id,
                stage_color: task.stage_color,
                is_auto_only: subtask.is_auto_only,
                children_count: 0,
                children_completed: 0,
                priority: task.due_date && new Date(task.due_date) < today && subtask.status !== 'Completed' ? 'overdue' : null,
                subtask_parent_id: task.id,
                job_role: subtask.job_role,
            }));

            return [taskRow, ...subtaskRows];
        });

        const projectRows = projectTasks.map((task) => ({
            id: task.id,
            source: 'project' as const,
            task_kind: 'task' as const,
            subtask_key: null as string | null,
            inquiry_id: null as number | null,
            project_id: task.project_id,
            name: task.name,
            description: task.description,
            phase: task.phase,
            status: task.status,
            due_date: task.due_date,
            estimated_hours: task.estimated_hours ? Number(task.estimated_hours) : null,
            actual_hours: task.actual_hours ? Number(task.actual_hours) : null,
            completed_at: null as Date | null,
            context_label: task.project?.project_name ?? `Project #${task.project_id}`,
            project_name: task.project?.project_name ?? null,
            event_date: task.project?.wedding_date ?? null,
            assignee: task.assigned_to?.contact
                ? {
                    id: task.assigned_to.id,
                    name: `${task.assigned_to.contact.first_name} ${task.assigned_to.contact.last_name}`.trim(),
                    email: task.assigned_to.contact.email,
                }
                : null,
            is_stage: false,
            parent_task_id: null as number | null,
            stage_color: null as string | null,
            is_auto_only: false,
            children_count: 0,
            children_completed: 0,
            priority: task.due_date && new Date(task.due_date) < today && task.status !== 'Completed' ? 'overdue' : null,
            subtask_parent_id: null as number | null,
            job_role: null as { id: number; name: string; display_name: string | null } | null,
        }));

        return [...inquiryRows, ...projectRows];
    }

    /**
     * Assign a contributor to an active task (inquiry or project).
     * Pass assigneeId = null to unassign.
     */
    async assignActiveTask(
        taskId: number,
        source: 'inquiry' | 'project',
        assigneeId: number | null,
        taskKind: 'task' | 'subtask' = 'task',
    ) {
        if (source === 'inquiry') {
            if (taskKind === 'subtask') {
                throw new NotFoundException('Inquiry subtasks do not support direct assignee changes');
            }

            return this.prisma.inquiry_tasks.update({
                where: { id: taskId },
                data: { assigned_to_id: assigneeId },
            });
        }

        return this.prisma.project_tasks.update({
            where: { id: taskId },
            data: { assigned_to_id: assigneeId },
        });
    }

    /**
     * Toggle a task between To_Do and Completed.
     */
    async toggleActiveTask(
        taskId: number,
        source: 'inquiry' | 'project',
        taskKind: 'task' | 'subtask' = 'task',
        completedById?: number,
    ) {
        if (source === 'inquiry') {
            if (taskKind === 'subtask') {
                const subtask = await this.prisma.inquiry_task_subtasks.findUnique({
                    where: { id: taskId },
                    include: { inquiry_task: { select: { inquiry_id: true } } },
                });
                if (!subtask) {
                    throw new NotFoundException(`Inquiry subtask ${taskId} not found`);
                }

                const updated = await this.inquiryTasksService.toggleSubtaskById(taskId, completedById);
                return {
                    id: updated.id,
                    status: updated.status,
                    source: 'inquiry',
                    task_kind: 'subtask',
                    inquiry_id: subtask.inquiry_task.inquiry_id,
                    parent_task_id: subtask.inquiry_task_id,
                };
            }

            const task = await this.prisma.inquiry_tasks.findUnique({ where: { id: taskId } });
            if (!task) {
                throw new NotFoundException(`Inquiry task ${taskId} not found`);
            }

            const updated = await this.inquiryTasksService.toggleTaskById(taskId, completedById);
            return {
                id: updated.id,
                status: updated.status,
                source: 'inquiry',
                task_kind: 'task',
            };
        }

        const task = await this.prisma.project_tasks.findUnique({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException(`Project task ${taskId} not found`);
        }

        const isCompleted = task.status === 'Completed';
        const updated = await this.prisma.project_tasks.update({
            where: { id: taskId },
            data: isCompleted
                ? { status: 'To_Do' }
                : { status: 'Completed' },
        });

        return {
            id: updated.id,
            status: updated.status,
            source: 'project',
            task_kind: 'task',
        };
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

    /**
     * Get available discovery-call time slots for a given brand + date.
     * Cross-references brand meeting settings with the calendars of
     * brand owners/admins to find gaps.
     */
    async getDiscoveryCallSlots(brandId: number, date: string) {
        const settings = await this.brandsService.getMeetingSettings(brandId);
        const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0=Sun

        if (!settings.available_days.includes(dayOfWeek)) {
            return { date, slots: [], unavailable_reason: 'not_available_day' };
        }

        const duration = settings.duration_minutes || 20;

        // Find brand owners/admins as the discovery call operators
        const operators = await this.prisma.user_brands.findMany({
            where: {
                brand_id: brandId,
                role: { in: ['Owner', 'Admin'] },
                is_active: true,
            },
            select: { user_id: true },
        });

        const contributorIds = operators.map(o => o.user_id);
        if (contributorIds.length === 0) {
            return { date, slots: [], unavailable_reason: 'no_operators' };
        }

        // Parse available window
        const [fromH, fromM] = settings.available_from.split(':').map(Number);
        const [toH, toM] = settings.available_to.split(':').map(Number);
        const dayStart = new Date(`${date}T${String(fromH).padStart(2, '0')}:${String(fromM).padStart(2, '0')}:00`);
        const dayEnd = new Date(`${date}T${String(toH).padStart(2, '0')}:${String(toM).padStart(2, '0')}:00`);

        // Fetch existing events for ALL operators on this date
        const existingEvents = await this.prisma.calendar_events.findMany({
            where: {
                contributor_id: { in: contributorIds },
                start_time: { lt: dayEnd },
                end_time: { gt: dayStart },
            },
            select: { contributor_id: true, start_time: true, end_time: true },
        });

        // Build busy map per contributor
        const busyMap = new Map<number, { start: Date; end: Date }[]>();
        for (const cid of contributorIds) busyMap.set(cid, []);
        for (const ev of existingEvents) {
            busyMap.get(ev.contributor_id)?.push({ start: ev.start_time, end: ev.end_time });
        }

        // Generate candidate slots from dayStart to dayEnd
        const slots: { time: string; available: boolean; operator_id?: number }[] = [];
        let cursor = new Date(dayStart);
        while (cursor.getTime() + duration * 60000 <= dayEnd.getTime()) {
            const slotStart = new Date(cursor);
            const slotEnd = new Date(cursor.getTime() + duration * 60000);
            const hh = String(slotStart.getHours()).padStart(2, '0');
            const mm = String(slotStart.getMinutes()).padStart(2, '0');
            const timeLabel = `${hh}:${mm}`;

            // Check if ANY operator is free during this slot
            let availableOp: number | undefined;
            for (const cid of contributorIds) {
                const busy = busyMap.get(cid) || [];
                const conflict = busy.some(b => slotStart < b.end && slotEnd > b.start);
                if (!conflict) { availableOp = cid; break; }
            }

            slots.push({ time: timeLabel, available: availableOp !== undefined, operator_id: availableOp });
            cursor = new Date(cursor.getTime() + duration * 60000);
        }

        return { date, duration_minutes: duration, slots };
    }
}
