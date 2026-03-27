import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CalendarAttendeesService } from './services/calendar-attendees.service';
import {
    CreateEventAttendeeDto,
    CreateEventReminderDto,
} from './dto/calendar.dto';
import { UpdateAttendeeResponseDto } from './dto/update-attendee-response.dto';

@Controller('api/calendar/events')
@UseGuards(AuthGuard('jwt'))
export class CalendarAttendeesController {
    constructor(private readonly attendeesService: CalendarAttendeesService) {}

    // Attendees
    @Post(':id/attendees')
    async addEventAttendee(
        @Param('id', ParseIntPipe) eventId: number,
        @Body(new ValidationPipe({ transform: true })) createAttendeeDto: Omit<CreateEventAttendeeDto, 'event_id'>,
    ) {
        const attendeeDto: CreateEventAttendeeDto = { ...createAttendeeDto, event_id: eventId };
        return this.attendeesService.addEventAttendee(attendeeDto);
    }

    @Get(':id/attendees')
    async getEventAttendees(@Param('id', ParseIntPipe) eventId: number) {
        return this.attendeesService.getEventAttendees(eventId);
    }

    @Put(':eventId/attendees/:userId')
    async updateAttendeeResponse(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body(new ValidationPipe({ transform: true })) body: UpdateAttendeeResponseDto,
    ) {
        return this.attendeesService.updateAttendeeResponse(eventId, userId, body.response_status);
    }

    @Delete(':eventId/attendees/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeEventAttendee(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.attendeesService.removeEventAttendee(eventId, userId);
    }

    // Reminders
    @Post(':id/reminders')
    async addEventReminder(
        @Param('id', ParseIntPipe) eventId: number,
        @Body(new ValidationPipe({ transform: true })) createReminderDto: Omit<CreateEventReminderDto, 'event_id'>,
    ) {
        const reminderDto: CreateEventReminderDto = { ...createReminderDto, event_id: eventId };
        return this.attendeesService.addEventReminder(reminderDto);
    }

    @Get(':id/reminders')
    async getEventReminders(@Param('id', ParseIntPipe) eventId: number) {
        return this.attendeesService.getEventReminders(eventId);
    }
}
