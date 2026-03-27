import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CalendarEventsService } from './calendar-events.service';
import { CreateEventAttendeeDto, ResponseStatus } from '../dto/calendar.dto';

@Injectable()
export class CalendarAttendeesService {
    constructor(
        private prisma: PrismaService,
        private calendarEventsService: CalendarEventsService,
    ) { }

    async addEventAttendee(createAttendeeDto: CreateEventAttendeeDto) {
        await this.calendarEventsService.findEventById(createAttendeeDto.event_id);

        return this.prisma.$executeRaw`
            INSERT INTO event_attendees (event_id, user_id, response_status)
            VALUES (${createAttendeeDto.event_id}, ${createAttendeeDto.user_id}, ${createAttendeeDto.response_status || ResponseStatus.PENDING})
            ON CONFLICT (event_id, user_id) DO UPDATE SET
                response_status = EXCLUDED.response_status
        `;
    }

    async getEventAttendees(eventId: number) {
        return this.prisma.$queryRaw`
            SELECT 
                ea.id, ea.event_id, ea.user_id, ea.response_status, ea.created_at,
                c.first_name, c.last_name, c.email
            FROM event_attendees ea
            INNER JOIN contributors contrib ON ea.user_id = contrib.id
            INNER JOIN contacts c ON contrib.contact_id = c.id
            WHERE ea.event_id = ${eventId}
            ORDER BY c.first_name, c.last_name
        `;
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

    async addEventReminder(createReminderDto: { event_id: number; reminder_type: string; minutes_before: number }) {
        await this.calendarEventsService.findEventById(createReminderDto.event_id);

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
}
