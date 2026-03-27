import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { UpdateCalendarSettingsDto, CalendarSettings } from '../dto/calendar.dto';

@Injectable()
export class CalendarSettingsService {
    constructor(private prisma: PrismaService) { }

    async getUserCalendarSettings(userId: number): Promise<CalendarSettings | null> {
        const result = await this.prisma.$queryRaw`
            SELECT * FROM calendar_settings WHERE user_id = ${userId}
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
}
