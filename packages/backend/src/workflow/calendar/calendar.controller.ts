import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    BadRequestException,
    Body,
    Param,
    Query,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// Attendees & Reminders moved to CalendarAttendeesController
import { CalendarEventsService } from './services/calendar-events.service';
import { CalendarTagsService } from './services/calendar-tags.service';
import { CalendarSettingsService } from './services/calendar-settings.service';
import { CalendarStatsService } from './services/calendar-stats.service';
import { CalendarDiscoveryService } from './services/calendar-discovery.service';
import {
    CreateCalendarEventDto,
    UpdateCalendarEventDto,
    CreateTagDto,
    CalendarQueryDto,
    UpdateCalendarSettingsDto,
} from './dto/calendar.dto';
import { CalendarEventsDateRangeQueryDto } from './dto/calendar-events-date-range-query.dto';
import { CalendarCrewQueryDto } from './dto/calendar-crew-query.dto';
import { CalendarUpcomingEventsQueryDto } from './dto/calendar-upcoming-events-query.dto';
import { CalendarStatsQueryDto } from './dto/calendar-stats-query.dto';
import { CalendarDiscoveryCallSlotsQueryDto } from './dto/calendar-discovery-call-slots-query.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/calendar')
@UseGuards(AuthGuard('jwt'))
export class CalendarController {
    constructor(
        private readonly eventsService: CalendarEventsService,
        private readonly tagsService: CalendarTagsService,
        private readonly settingsService: CalendarSettingsService,
        private readonly statsService: CalendarStatsService,
        private readonly discoveryService: CalendarDiscoveryService,
    ) { }

    // Calendar Events
    @Post('events')
    async createEvent(@Body(new ValidationPipe({ transform: true })) createEventDto: CreateCalendarEventDto) {
        return this.eventsService.createEvent(createEventDto);
    }

    @Get('events')
    async findAllEvents(@Query(new ValidationPipe({ transform: true })) query: CalendarQueryDto) {
        return this.eventsService.findAllEvents(query);
    }

    @Get('events/date-range')
    async getEventsForDateRange(
        @Query(new ValidationPipe({ transform: true })) query: CalendarEventsDateRangeQueryDto,
    ) {
        return this.eventsService.getEventsForDateRange(query.start_date, query.end_date, query.crew_id);
    }

    @Get('events/today')
    async getTodaysEvents(
        @Query(new ValidationPipe({ transform: true })) query: CalendarCrewQueryDto,
    ) {
        return this.eventsService.getTodaysEvents(query.crew_id);
    }

    @Get('events/upcoming')
    async getUpcomingEvents(
        @Query(new ValidationPipe({ transform: true })) query: CalendarUpcomingEventsQueryDto,
    ) {
        return this.eventsService.getUpcomingEvents(query.crew_id, query.limit ?? 10);
    }

    @Get('events/:id')
    async findEventById(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.findEventById(id);
    }

    @Put('events/:id')
    async updateEvent(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateEventDto: UpdateCalendarEventDto,
    ) {
        return this.eventsService.updateEvent(id, updateEventDto);
    }

    @Delete('events/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteEvent(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.deleteEvent(id);
    }

    // Tags
    @Post('tags')
    async createTag(@Body(new ValidationPipe({ transform: true })) createTagDto: CreateTagDto) {
        return this.tagsService.createTag(createTagDto);
    }

    @Get('tags')
    async getAllTags() {
        return this.tagsService.getAllTags();
    }

    @Post('events/:eventId/tags/:tagId')
    @HttpCode(HttpStatus.CREATED)
    async tagEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('tagId') tagId: string,
    ) {
        return this.tagsService.tagEvent(eventId, tagId);
    }

    @Get('events/:id/tags')
    async getEventTags(@Param('id', ParseIntPipe) eventId: number) {
        return this.tagsService.getEventTags(eventId);
    }

    @Delete('events/:eventId/tags/:tagId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeEventTag(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('tagId') tagId: string,
    ) {
        return this.tagsService.removeEventTag(eventId, tagId);
    }

    // Calendar Settings
    @Get('settings/:userId')
    async getUserCalendarSettings(@Param('userId', ParseIntPipe) userId: number) {
        return this.settingsService.getUserCalendarSettings(userId);
    }

    @Put('settings/:userId')
    async updateUserCalendarSettings(
        @Param('userId', ParseIntPipe) userId: number,
        @Body(new ValidationPipe({ transform: true })) settings: UpdateCalendarSettingsDto,
    ) {
        return this.settingsService.updateUserCalendarSettings(userId, settings);
    }

    // Dashboard/Stats
    @Get('stats')
    async getCalendarStats(
        @Query(new ValidationPipe({ transform: true })) query: CalendarStatsQueryDto,
    ) {
        return this.statsService.getCalendarStats(query.user_id);
    }

    // Discovery call availability slots
    @Get('discovery-call-slots')
    async getDiscoveryCallSlots(
        @Query(new ValidationPipe({ transform: true })) query: CalendarDiscoveryCallSlotsQueryDto,
        @BrandId() brandId?: number,
    ) {
        const resolvedBrandId = query.brandId ?? brandId;
        if (!resolvedBrandId) {
            throw new BadRequestException('Brand ID is required');
        }
        return this.discoveryService.getDiscoveryCallSlots(resolvedBrandId, query.date);
    }
}
