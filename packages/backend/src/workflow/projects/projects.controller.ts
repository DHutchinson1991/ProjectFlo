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
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { ProjectQueryService } from './project-query.service';
import { ProjectPackageSnapshotService } from './project-package-snapshot.service';
import { ProjectPackageCloneService } from './project-package-clone.service';
import { ScheduleService } from '../../content/schedule/schedule.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';

@Controller('api/projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly projectQueryService: ProjectQueryService,
        private readonly snapshotService: ProjectPackageSnapshotService,
        private readonly cloneService: ProjectPackageCloneService,
        private readonly scheduleService: ScheduleService,
    ) { }

    @Get()
    async getAllProjects(@Headers('x-brand-context') brandId?: string) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectQueryService.getAllProjects(parsedBrandId);
    }

    @Get(':id')
    async getProjectById(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectQueryService.getProjectById(id, parsedBrandId);
    }

    @Post()
    async createProject(
        @Body(new ValidationPipe({ transform: true })) createProjectDto: CreateProjectDto,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectsService.createProject(createProjectDto, parsedBrandId);
    }

    @Put(':id')
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateProjectDto: UpdateProjectDto,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectsService.updateProject(id, updateProjectDto, parsedBrandId);
    }

    @Delete(':id')
    async deleteProject(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectsService.deleteProject(id, parsedBrandId);
    }

    // ─── Project Package Snapshot Endpoints ───────────────────────────

    /** Get package snapshot summary (source package info + aggregate counts) */
    @Get(':id/package-snapshot')
    async getPackageSnapshot(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getSnapshotSummary({ projectId: id });
    }

    /** Get all project event days with activities, operators, subjects, locations */
    @Get(':id/package-snapshot/event-days')
    async getPackageSnapshotEventDays(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getEventDays({ projectId: id });
    }

    /** Get all project activities (across all event days) */
    @Get(':id/package-snapshot/activities')
    async getPackageSnapshotActivities(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getActivities({ projectId: id });
    }

    /** Get all project operators (crew slots) */
    @Get(':id/package-snapshot/operators')
    async getPackageSnapshotOperators(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getOperators({ projectId: id });
    }

    /** Get all project subjects */
    @Get(':id/package-snapshot/subjects')
    async getPackageSnapshotSubjects(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getSubjects({ projectId: id });
    }

    /** Get all project location slots */
    @Get(':id/package-snapshot/locations')
    async getPackageSnapshotLocations(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getLocationSlots({ projectId: id });
    }

    /** Get all project films with scene schedules */
    @Get(':id/package-snapshot/films')
    async getPackageSnapshotFilms(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getFilms({ projectId: id });
    }

    /** Get moments for a specific project activity */
    @Get(':id/package-snapshot/activities/:activityId/moments')
    async getPackageSnapshotActivityMoments(
        @Param('id', ParseIntPipe) id: number,
        @Param('activityId', ParseIntPipe) activityId: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.snapshotService.getActivityMoments({ projectId: id }, activityId);
    }

    // ─── Sync from Package ─────────────────────────────────────────

    /** Delete all instance schedule data for a project, then re-clone from its source package. */
    @Post(':id/schedule/sync-from-package')
    async syncProjectScheduleFromPackage(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.cloneService.syncProjectScheduleFromPackage(id);
    }

    // ─── Schedule Diff ─────────────────────────────────────────────

    /** Compare the project's instance schedule against its source package schedule */
    @Get(':id/schedule/diff')
    async getScheduleDiff(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.scheduleService.getScheduleDiff({ project_id: id });
    }
}
