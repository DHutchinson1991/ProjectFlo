import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CalendarEventsService } from './calendar-events.service';
import { CreateTagDto } from '../dto/calendar.dto';

@Injectable()
export class CalendarTagsService {
    constructor(
        private prisma: PrismaService,
        private calendarEventsService: CalendarEventsService,
    ) { }

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
            SELECT * FROM tags ORDER BY name
        `;
    }

    async tagEvent(eventId: number, tagId: string) {
        await this.calendarEventsService.findEventById(eventId);

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
}
