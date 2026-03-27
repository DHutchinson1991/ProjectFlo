import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarAttendeesController } from './calendar-attendees.controller';
import { CalendarEventsService } from './services/calendar-events.service';
import { CalendarAttendeesService } from './services/calendar-attendees.service';
import { CalendarTagsService } from './services/calendar-tags.service';
import { CalendarSettingsService } from './services/calendar-settings.service';
import { CalendarStatsService } from './services/calendar-stats.service';
import { CalendarDiscoveryService } from './services/calendar-discovery.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { BrandsModule } from '../../platform/brands/brands.module';
import { TasksModule } from '../tasks/tasks.module';

const services = [
    CalendarEventsService,
    CalendarAttendeesService,
    CalendarTagsService,
    CalendarSettingsService,
    CalendarStatsService,
    CalendarDiscoveryService,
];

@Module({
    imports: [PrismaModule, BrandsModule, TasksModule],
    controllers: [CalendarController, CalendarAttendeesController],
    providers: services,
    exports: services,
})
export class CalendarModule { }
