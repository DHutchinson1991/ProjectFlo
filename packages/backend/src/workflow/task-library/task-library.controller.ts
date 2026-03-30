import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
    ValidationPipe,
    Headers,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskLibraryService } from './task-library.service';
import { CreateTaskLibraryDto, UpdateTaskLibraryDto, TaskLibraryQueryDto, ProjectPhase, BatchUpdateTaskOrderDto, ExecuteAutoGenerationDto, CreateSubtaskTemplateDto, UpdateSubtaskTemplateDto } from './dto/task-library.dto';
import { TaskLibraryPhaseQueryDto } from './dto/task-library-phase-query.dto';
import { PreviewAutoGenerationQueryDto } from './dto/preview-auto-generation-query.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

interface RequestUser {
    id: number;
    email: string;
}

interface AuthenticatedRequest {
    user: RequestUser;
}

@Controller('api/task-library')
@UseGuards(AuthGuard('jwt'))
export class TaskLibraryController {
    constructor(private readonly taskLibraryService: TaskLibraryService) {}

    @Post()
    create(
        @Body(ValidationPipe) createTaskLibraryDto: CreateTaskLibraryDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.create(createTaskLibraryDto, req.user.id);
    }

    @Get()
    findAll(
        @Query(ValidationPipe) query: TaskLibraryQueryDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.findAll(query, req.user.id);
    }

    @Get('phases/:phase')
    findByPhase(
        @Param('phase') phase: ProjectPhase,
        @Query(new ValidationPipe({ transform: true })) query: TaskLibraryPhaseQueryDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.getTasksByPhase(phase, query.brandId, req.user.id);
    }

    @Patch('batch-update-order')
    async batchUpdateTaskOrder(
        @Body(new ValidationPipe({ transform: true })) batchUpdateDto: BatchUpdateTaskOrderDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.batchUpdateOrder(batchUpdateDto, req.user.id);
    }

    @Get('auto-generate/preview/:packageId')
    previewAutoGeneration(
        @Param('packageId', ParseIntPipe) packageId: number,
        @Query(new ValidationPipe({ transform: true })) query: PreviewAutoGenerationQueryDto,
        @Request() req: AuthenticatedRequest,
        @BrandId() brandId?: number,
    ) {
        const resolvedBrandId = query.brandId ?? brandId;
        if (!resolvedBrandId) {
            throw new BadRequestException('Brand ID is required');
        }
        return this.taskLibraryService.previewAutoGeneration(
            packageId,
            resolvedBrandId,
            req.user.id,
            query.inquiryId,
            query.projectId,
        );
    }

    @Post('auto-generate/execute')
    executeAutoGeneration(
        @Body(ValidationPipe) dto: ExecuteAutoGenerationDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.executeAutoGeneration(dto, req.user.id);
    }

    @Post('sync-crew')
    syncCrew(
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');
        return this.taskLibraryService.syncCrewToInquiryTasks(brandIdNum);
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.findOne(id, req.user.id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateTaskLibraryDto: UpdateTaskLibraryDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.update(id, updateTaskLibraryDto, req.user.id);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.remove(id, req.user.id);
    }

    // ─── Subtask template endpoints ───────────────────────────────

    @Post(':id/subtasks')
    createSubtask(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: CreateSubtaskTemplateDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.createSubtask(id, dto, req.user.id);
    }

    @Patch(':id/subtasks/:subtaskId')
    updateSubtask(
        @Param('id', ParseIntPipe) id: number,
        @Param('subtaskId', ParseIntPipe) subtaskId: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateSubtaskTemplateDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.updateSubtask(id, subtaskId, dto, req.user.id);
    }

    @Delete(':id/subtasks/:subtaskId')
    removeSubtask(
        @Param('id', ParseIntPipe) id: number,
        @Param('subtaskId', ParseIntPipe) subtaskId: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.removeSubtask(id, subtaskId, req.user.id);
    }
}
