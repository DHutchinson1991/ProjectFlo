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
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiryQueryService } from './services/inquiry-query.service';
import { InquiryCrudService } from './services/inquiry-crud.service';
import { InquiryLifecycleService } from './services/inquiry-lifecycle.service';
import { ProjectPackageSnapshotService } from '../projects/project-package-snapshot.service';
import { ProjectPackageCloneService } from '../projects/project-package-clone.service';
import { ScheduleDiffService } from '../../content/schedule/services';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/inquiries.dto';
import { ClientPortalService } from './client-portal.service';

@Controller('api/inquiries')
@UseGuards(AuthGuard('jwt'))
export class InquiriesController {
    constructor(
        private readonly queryService: InquiryQueryService,
        private readonly crudService: InquiryCrudService,
        private readonly lifecycleService: InquiryLifecycleService,
        private readonly snapshotService: ProjectPackageSnapshotService,
        private readonly cloneService: ProjectPackageCloneService,
        private readonly scheduleService: ScheduleDiffService,
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
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.queryService.findAll(brandIdNum);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        return this.queryService.findOne(id, brandIdNum || 0);
    }

    @Get(':id/discovery-call')
    async getDiscoveryCall(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.queryService.getDiscoveryCall(id, brandIdNum);
    }

    @Post()
    async create(
        @Body(new ValidationPipe({ transform: true })) createInquiryDto: CreateInquiryDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.crudService.create(createInquiryDto, brandIdNum);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateInquiryDto: UpdateInquiryDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.crudService.update(id, updateInquiryDto, brandIdNum);
    }

    @Post(':id/convert')
    async convert(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.lifecycleService.convertInquiryToProject(id, brandIdNum);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.crudService.remove(id, brandIdNum);
    }

    // ─── Inquiry Schedule Snapshot Endpoints ─────────────────────────

    @Get(':id/schedule-snapshot')
    async getScheduleSnapshot(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getSnapshotSummary({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/event-days')
    async getScheduleSnapshotEventDays(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getEventDays({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/activities')
    async getScheduleSnapshotActivities(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getActivities({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/crew-slots')
    async getScheduleSnapshotCrewSlots(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getCrewSlots({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/subjects')
    async getScheduleSnapshotSubjects(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getSubjects({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/locations')
    async getScheduleSnapshotLocations(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getLocationSlots({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/films')
    async getScheduleSnapshotFilms(@Param('id', ParseIntPipe) id: number) {
        return this.snapshotService.getFilms({ inquiryId: id });
    }

    @Get(':id/schedule-snapshot/activities/:activityId/moments')
    async getScheduleSnapshotActivityMoments(
        @Param('id', ParseIntPipe) id: number,
        @Param('activityId', ParseIntPipe) activityId: number,
    ) {
        return this.snapshotService.getActivityMoments({ inquiryId: id }, activityId);
    }

    // ─── Sync from Package ─────────────────────────────────────────

    @Post(':id/schedule/sync-from-package')
    async syncInquiryScheduleFromPackage(@Param('id', ParseIntPipe) id: number) {
        return this.cloneService.syncInquiryScheduleFromPackage(id);
    }

    // ─── Schedule Diff ─────────────────────────────────────────────

    @Get(':id/schedule/diff')
    async getScheduleDiff(@Param('id', ParseIntPipe) id: number) {
        return this.scheduleService.getScheduleDiff({ inquiry_id: id });
    }

    // ─── Welcome Pack ───────────────────────────────────────────────

    @Post(':id/send-welcome-pack')
    async sendWelcomePack(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.crudService.sendWelcomePack(id, brandIdNum);
    }
}
