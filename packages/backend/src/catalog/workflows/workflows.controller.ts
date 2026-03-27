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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowsService } from './workflows.service';
import { WorkflowTemplateTasksService } from './services/workflow-template-tasks.service';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { AddTemplateTaskDto } from './dto/add-template-task.dto';
import { SyncTemplateTasksDto } from './dto/sync-template-tasks.dto';
import { UpdateTemplateTaskDto } from './dto/update-template-task.dto';
import { ToggleTemplateTaskDto } from './dto/toggle-template-task.dto';
import { WorkflowTemplatesQueryDto } from './dto/workflow-templates-query.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

interface AuthenticatedRequest {
    user: { id: number; email: string };
}

@Controller('api/workflows')
@UseGuards(AuthGuard('jwt'))
export class WorkflowsController {
    constructor(
        private readonly workflowsService: WorkflowsService,
        private readonly templateTasksService: WorkflowTemplateTasksService,
    ) {}

    // ── Workflow Templates ────────────────────────────────────────────────

    @Get()
    findAll(
        @BrandId() brandId?: number,
        @Query(new ValidationPipe({ transform: true })) query?: WorkflowTemplatesQueryDto,
        @Request() req?: AuthenticatedRequest,
    ) {
        return this.workflowsService.findAll(
            {
                brandId,
                is_active: query?.is_active,
                is_default: query?.is_default,
            },
            req!.user.id,
        );
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
        return this.workflowsService.findOne(id, req.user.id);
    }

    @Post()
    create(@Body(new ValidationPipe({ transform: true })) data: CreateWorkflowTemplateDto, @Request() req: AuthenticatedRequest) {
        return this.workflowsService.create(data, req.user.id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: UpdateWorkflowTemplateDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.update(id, data, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
        return this.workflowsService.remove(id, req.user.id);
    }

    @Get(':id/preview')
    preview(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
        return this.templateTasksService.preview(id, req.user.id);
    }

    // ── Template Tasks ────────────────────────────────────────────────────

    @Get(':id/tasks')
    getTemplateTasks(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
        return this.templateTasksService.getTemplateTasks(id, req.user.id);
    }

    @Post(':id/tasks')
    addTaskToTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: AddTemplateTaskDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.templateTasksService.addTaskToTemplate(id, data, req.user.id);
    }

    @Post(':id/tasks/sync')
    syncTemplateTasks(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: SyncTemplateTasksDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.templateTasksService.syncTemplateTasks(id, data, req.user.id);
    }

    @Post(':id/tasks/toggle')
    toggleTaskInTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: ToggleTemplateTaskDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.templateTasksService.toggleTaskInTemplate(id, data.task_library_id, req.user.id);
    }

    @Patch('tasks/:taskId')
    updateTemplateTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body(new ValidationPipe({ transform: true })) data: UpdateTemplateTaskDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.templateTasksService.updateTemplateTask(taskId, data, req.user.id);
    }

    @Delete('tasks/:taskId')
    removeTaskFromTemplate(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.templateTasksService.removeTaskFromTemplate(taskId, req.user.id);
    }
}
