import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto, UpdateActivityLogDto } from './activity-log.entity';

@Controller('activity-logs')
@UseGuards(AuthGuard('jwt'))
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) { }

    @Post()
    create(@Body() createActivityLogDto: CreateActivityLogDto) {
        return this.activityLogsService.create(createActivityLogDto);
    }

    @Get()
    findAll() {
        return this.activityLogsService.findAll();
    }

    @Get('inquiry/:inquiryId')
    findByInquiry(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
        return this.activityLogsService.findByInquiry(inquiryId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.activityLogsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateActivityLogDto: UpdateActivityLogDto,
    ) {
        return this.activityLogsService.update(id, updateActivityLogDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.activityLogsService.remove(id);
    }

    // Convenience endpoints for common activity types
    @Post('status-change')
    logStatusChange(@Body() body: { inquiryId: number; oldStatus: string; newStatus: string }) {
        return this.activityLogsService.logStatusChange(body.inquiryId, body.oldStatus, body.newStatus);
    }

    @Post('document-sent')
    logDocumentSent(@Body() body: { inquiryId: number; documentType: string; documentId: number }) {
        return this.activityLogsService.logDocumentSent(body.inquiryId, body.documentType, body.documentId);
    }

    @Post('note')
    logNote(@Body() body: { inquiryId: number; note: string }) {
        return this.activityLogsService.logNote(body.inquiryId, body.note);
    }

    @Post('call')
    logCall(@Body() body: { inquiryId: number; duration: string; notes?: string }) {
        return this.activityLogsService.logCall(body.inquiryId, body.duration, body.notes);
    }
}
