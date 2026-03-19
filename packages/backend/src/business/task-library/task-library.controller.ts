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
import { CreateTaskLibraryDto, UpdateTaskLibraryDto, TaskLibraryQueryDto, ProjectPhase, BatchUpdateTaskOrderDto, ExecuteAutoGenerationDto } from './dto/task-library.dto';

interface RequestUser {
    id: number;
    email: string;
}

interface AuthenticatedRequest {
    user: RequestUser;
}

@Controller('task-library')
@UseGuards(AuthGuard('jwt'))
export class TaskLibraryController {
    constructor(private readonly taskLibraryService: TaskLibraryService) { }

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
        @Query('brandId', ParseIntPipe) brandId: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.getTasksByPhase(phase, brandId, req.user.id);
    }

    @Patch('batch-update-order')
    async batchUpdateTaskOrder(
        @Body(new ValidationPipe({ transform: true })) batchUpdateDto: BatchUpdateTaskOrderDto,
        @Request() req: AuthenticatedRequest,
    ) {
        console.log('🎯 Controller Debug - Batch update endpoint hit');
        console.log('🎯 Controller Debug - DTO received:', JSON.stringify(batchUpdateDto, null, 2));
        console.log('🎯 Controller Debug - User:', req.user?.id);

        try {
            return await this.taskLibraryService.batchUpdateOrder(batchUpdateDto, req.user.id);
        } catch (error) {
            console.error('🚨 Controller Debug - Error in batch update:', error);
            throw error;
        }
    }

    @Get('auto-generate/preview/:packageId')
    previewAutoGeneration(
        @Param('packageId', ParseIntPipe) packageId: number,
        @Query('brandId', ParseIntPipe) brandId: number,
        @Query('inquiryId') inquiryIdRaw: string | undefined,
        @Query('projectId') projectIdRaw: string | undefined,
        @Request() req: AuthenticatedRequest,
    ) {
        const inquiryId = inquiryIdRaw ? parseInt(inquiryIdRaw, 10) : undefined;
        const projectId = projectIdRaw ? parseInt(projectIdRaw, 10) : undefined;
        return this.taskLibraryService.previewAutoGeneration(
            packageId,
            brandId,
            req.user.id,
            inquiryId,
            projectId,
        );
    }

    @Post('auto-generate/execute')
    executeAutoGeneration(
        @Body(ValidationPipe) dto: ExecuteAutoGenerationDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.taskLibraryService.executeAutoGeneration(dto, req.user.id);
    }

    /** Bulk-sync assigned_to_id on all inquiry tasks from task library defaults */
    @Post('sync-contributors')
    syncContributors(
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');
        return this.taskLibraryService.syncContributorsToInquiryTasks(brandIdNum);
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
}
