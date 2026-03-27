import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CalendarStats } from '../dto/calendar.dto';

@Injectable()
export class CalendarStatsService {
    constructor(private prisma: PrismaService) { }

    async getCalendarStats(userId?: number): Promise<CalendarStats> {
        const where = userId ? { crew_member_id: userId } : {};

        const [totalEvents, projectEvents, personalEvents, holidayEvents, upcomingEvents, pastEvents] =
            await Promise.all([
                this.prisma.calendar_events.count({ where }),
                this.prisma.calendar_events.count({ where: { ...where, event_type: 'PROJECT_ASSIGNMENT' } }),
                this.prisma.calendar_events.count({ where: { ...where, event_type: 'PERSONAL' } }),
                this.prisma.calendar_events.count({ where: { ...where, event_type: 'HOLIDAY' } }),
                this.prisma.calendar_events.count({ where: { ...where, start_time: { gte: new Date() } } }),
                this.prisma.calendar_events.count({ where: { ...where, start_time: { lt: new Date() } } }),
            ]);

        return {
            total_events: totalEvents,
            project_events: projectEvents,
            personal_events: personalEvents,
            holiday_events: holidayEvents,
            upcoming_events: upcomingEvents,
            past_events: pastEvents,
        };
    }
}
