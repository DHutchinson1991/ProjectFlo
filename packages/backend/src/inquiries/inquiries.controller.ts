import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Headers,
    NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiriesService } from './inquiries.service';
import { ProjectPackageSnapshotService } from '../projects/project-package-snapshot.service';
import { ProjectPackageCloneService } from '../projects/project-package-clone.service';
import { ScheduleService } from '../content/schedule/schedule.service';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/inquiries.dto';
import { ClientPortalService } from './client-portal.service';

@Controller('api/inquiries')
@UseGuards(AuthGuard('jwt'))
export class InquiriesController {
    constructor(
        private readonly inquiriesService: InquiriesService,
        private readonly snapshotService: ProjectPackageSnapshotService,
        private readonly cloneService: ProjectPackageCloneService,
        private readonly scheduleService: ScheduleService,
        private readonly clientPortalService: ClientPortalService,
    ) { }

    @Post(':id/portal-token')
    async getPortalToken(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        const token = await this.clientPortalService.getOrCreatePortalToken(id, brandIdNum);
        return { portal_token: token };
    }

    @Get()
    async findAll(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.findAll(brandIdNum);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        return this.inquiriesService.findOne(id, brandIdNum || 0);
    }

    @Post()
    async create(
        @Body() createInquiryDto: CreateInquiryDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.create(createInquiryDto, brandIdNum);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateInquiryDto: UpdateInquiryDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.update(id, updateInquiryDto, brandIdNum);
    }

    @Post(':id/convert')
    async convert(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.convertInquiryToProject(id, brandIdNum);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.remove(id, brandIdNum);
    }

    // ─── Inquiry Schedule Snapshot Endpoints ─────────────────────────

    /** Get schedule snapshot summary (source package info + aggregate counts) */
    @Get(':id/schedule-snapshot')
    async getScheduleSnapshot(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getSnapshotSummary({ inquiryId: id });
    }

    /** Get all event days with activities, operators, subjects, locations */
    @Get(':id/schedule-snapshot/event-days')
    async getScheduleSnapshotEventDays(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getEventDays({ inquiryId: id });
    }

    /** Get all activities (across all event days) */
    @Get(':id/schedule-snapshot/activities')
    async getScheduleSnapshotActivities(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getActivities({ inquiryId: id });
    }

    /** Get all operators (crew slots) */
    @Get(':id/schedule-snapshot/operators')
    async getScheduleSnapshotOperators(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getOperators({ inquiryId: id });
    }

    /** Get all subjects */
    @Get(':id/schedule-snapshot/subjects')
    async getScheduleSnapshotSubjects(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getSubjects({ inquiryId: id });
    }

    /** Get all location slots */
    @Get(':id/schedule-snapshot/locations')
    async getScheduleSnapshotLocations(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getLocationSlots({ inquiryId: id });
    }

    /** Get all films with scene schedules */
    @Get(':id/schedule-snapshot/films')
    async getScheduleSnapshotFilms(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getFilms({ inquiryId: id });
    }

    /** Get moments for a specific activity */
    @Get(':id/schedule-snapshot/activities/:activityId/moments')
    async getScheduleSnapshotActivityMoments(
        @Param('id', ParseIntPipe) id: number,
        @Param('activityId', ParseIntPipe) activityId: number,
    ) {
        return this.snapshotService.getActivityMoments({ inquiryId: id }, activityId);
    }

    // ─── Sync from Package ─────────────────────────────────────────

    /** Delete all instance schedule data for an inquiry, then re-clone from its source package. */
    @Post(':id/schedule/sync-from-package')
    async syncInquiryScheduleFromPackage(@Param('id', ParseIntPipe) id: number) {
        return this.cloneService.syncInquiryScheduleFromPackage(id);
    }

    // ─── Schedule Diff ─────────────────────────────────────────────

    /** Compare the inquiry's instance schedule against its source package schedule */
    @Get(':id/schedule/diff')
    async getScheduleDiff(@Param('id', ParseIntPipe) id: number) {
        return this.scheduleService.getScheduleDiff({ inquiry_id: id });
    }

    // ─── Welcome Pack ───────────────────────────────────────────────

    /** Mark welcome pack as sent for this inquiry */
    @Post(':id/send-welcome-pack')
    async sendWelcomePack(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.inquiriesService.sendWelcomePack(id, brandIdNum);
    }
}
