import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import {
    CreateCalendarEventDto,
    UpdateCalendarEventDto,
    CreateEventAttendeeDto,
    CreateEventReminderDto,
    CreateTagDto,
    CalendarQueryDto,
    UpdateCalendarSettingsDto,
    ResponseStatus,
} from './dto/calendar.dto';

@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) { }

    // Calendar Events
    @Post('events')
    async createEvent(@Body() createEventDto: CreateCalendarEventDto) {
        return this.calendarService.createEvent(createEventDto);
    }

    @Get('events')
    async findAllEvents(@Query() query: CalendarQueryDto) {
        return this.calendarService.findAllEvents(query);
    }

    @Get('events/:id')
    async findEventById(@Param('id', ParseIntPipe) id: number) {
        return this.calendarService.findEventById(id);
    }

    @Put('events/:id')
    async updateEvent(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventDto: UpdateCalendarEventDto,
    ) {
        return this.calendarService.updateEvent(id, updateEventDto);
    }

    @Delete('events/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteEvent(@Param('id', ParseIntPipe) id: number) {
        return this.calendarService.deleteEvent(id);
    }

    // Event Attendees
    @Post('events/:id/attendees')
    async addEventAttendee(
        @Param('id', ParseIntPipe) eventId: number,
        @Body() createAttendeeDto: Omit<CreateEventAttendeeDto, 'event_id'>,
    ) {
        const attendeeDto: CreateEventAttendeeDto = {
            ...createAttendeeDto,
            event_id: eventId,
        };
        return this.calendarService.addEventAttendee(attendeeDto);
    }

    @Get('events/:id/attendees')
    async getEventAttendees(@Param('id', ParseIntPipe) eventId: number) {
        return this.calendarService.getEventAttendees(eventId);
    }

    @Put('events/:eventId/attendees/:userId')
    async updateAttendeeResponse(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body('response_status') responseStatus: ResponseStatus,
    ) {
        return this.calendarService.updateAttendeeResponse(eventId, userId, responseStatus);
    }

    @Delete('events/:eventId/attendees/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeEventAttendee(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.calendarService.removeEventAttendee(eventId, userId);
    }

    // Event Reminders
    @Post('events/:id/reminders')
    async addEventReminder(
        @Param('id', ParseIntPipe) eventId: number,
        @Body() createReminderDto: Omit<CreateEventReminderDto, 'event_id'>,
    ) {
        const reminderDto: CreateEventReminderDto = {
            ...createReminderDto,
            event_id: eventId,
        };
        return this.calendarService.addEventReminder(reminderDto);
    }

    @Get('events/:id/reminders')
    async getEventReminders(@Param('id', ParseIntPipe) eventId: number) {
        return this.calendarService.getEventReminders(eventId);
    }

    // Tags
    @Post('tags')
    async createTag(@Body() createTagDto: CreateTagDto) {
        return this.calendarService.createTag(createTagDto);
    }

    @Get('tags')
    async getAllTags() {
        return this.calendarService.getAllTags();
    }

    @Post('events/:eventId/tags/:tagId')
    @HttpCode(HttpStatus.CREATED)
    async tagEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('tagId') tagId: string,
    ) {
        return this.calendarService.tagEvent(eventId, tagId);
    }

    @Get('events/:id/tags')
    async getEventTags(@Param('id', ParseIntPipe) eventId: number) {
        return this.calendarService.getEventTags(eventId);
    }

    @Delete('events/:eventId/tags/:tagId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeEventTag(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('tagId') tagId: string,
    ) {
        return this.calendarService.removeEventTag(eventId, tagId);
    }

    // Calendar Settings
    @Get('settings/:userId')
    async getUserCalendarSettings(@Param('userId', ParseIntPipe) userId: number) {
        return this.calendarService.getUserCalendarSettings(userId);
    }

    @Put('settings/:userId')
    async updateUserCalendarSettings(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() settings: UpdateCalendarSettingsDto,
    ) {
        return this.calendarService.updateUserCalendarSettings(userId, settings);
    }

    // Dashboard/Stats
    @Get('stats')
    async getCalendarStats(@Query('user_id') userId?: string) {
        const parsedUserId = userId ? parseInt(userId, 10) : undefined;
        return this.calendarService.getCalendarStats(parsedUserId);
    }

    // Utility endpoints
    @Get('events/date-range')
    async getEventsForDateRange(
        @Query('start_date') startDate: string,
        @Query('end_date') endDate: string,
        @Query('contributor_id') contributorId?: string,
    ) {
        const parsedContributorId = contributorId ? parseInt(contributorId, 10) : undefined;
        return this.calendarService.getEventsForDateRange(startDate, endDate, parsedContributorId);
    }

    @Get('events/today')
    async getTodaysEvents(@Query('contributor_id') contributorId?: string) {
        const parsedContributorId = contributorId ? parseInt(contributorId, 10) : undefined;
        return this.calendarService.getTodaysEvents(parsedContributorId);
    }

    @Get('events/upcoming')
    async getUpcomingEvents(
        @Query('contributor_id') contributorId?: string,
        @Query('limit') limitStr?: string,
    ) {
        const parsedContributorId = contributorId ? parseInt(contributorId, 10) : undefined;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        return this.calendarService.getUpcomingEvents(parsedContributorId, limit);
    }
}
