import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { BrandsService } from '../../../platform/brands/brands.service';

@Injectable()
export class CalendarDiscoveryService {
    constructor(
        private prisma: PrismaService,
        private brandsService: BrandsService,
    ) { }

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

        // Find active brand members as the discovery call crew
        const brandMembers = await this.prisma.brandMember.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
            },
            select: { crew_id: true },
        });

        const crewIds = brandMembers.map(o => o.crew_id);
        if (crewIds.length === 0) {
            return { date, slots: [], unavailable_reason: 'no_crew' };
        }

        // Parse available window
        const [fromH, fromM] = settings.available_from.split(':').map(Number);
        const [toH, toM] = settings.available_to.split(':').map(Number);
        const dayStart = new Date(`${date}T${String(fromH).padStart(2, '0')}:${String(fromM).padStart(2, '0')}:00`);
        const dayEnd = new Date(`${date}T${String(toH).padStart(2, '0')}:${String(toM).padStart(2, '0')}:00`);

        // Fetch existing events for ALL crew on this date
        const existingEvents = await this.prisma.calendar_events.findMany({
            where: {
                crew_id: { in: crewIds },
                start_time: { lt: dayEnd },
                end_time: { gt: dayStart },
            },
            select: { crew_id: true, start_time: true, end_time: true },
        });

        // Build busy map per crew
        const busyMap = new Map<number, { start: Date; end: Date }[]>();
        for (const cid of crewIds) busyMap.set(cid, []);
        for (const ev of existingEvents) {
            busyMap.get(ev.crew_id)?.push({ start: ev.start_time, end: ev.end_time });
        }

        // Generate candidate slots from dayStart to dayEnd
        const slots: { time: string; available: boolean; crew_id?: number }[] = [];
        let cursor = new Date(dayStart);
        while (cursor.getTime() + duration * 60000 <= dayEnd.getTime()) {
            const slotStart = new Date(cursor);
            const slotEnd = new Date(cursor.getTime() + duration * 60000);
            const hh = String(slotStart.getHours()).padStart(2, '0');
            const mm = String(slotStart.getMinutes()).padStart(2, '0');
            const timeLabel = `${hh}:${mm}`;

            // Check if ANY crew member is free during this slot
            let availableCrew: number | undefined;
            for (const cid of crewIds) {
                const busy = busyMap.get(cid) || [];
                const conflict = busy.some(b => slotStart < b.end && slotEnd > b.start);
                if (!conflict) { availableCrew = cid; break; }
            }

            slots.push({ time: timeLabel, available: availableCrew !== undefined, crew_id: availableCrew });
            cursor = new Date(cursor.getTime() + duration * 60000);
        }

        return { date, duration_minutes: duration, slots };
    }
}
