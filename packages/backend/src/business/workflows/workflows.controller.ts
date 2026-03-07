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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowsService } from './workflows.service';

interface RequestUser {
    id: number;
    email: string;
}

interface AuthenticatedRequest {
    user: RequestUser;
}

@Controller('workflows')
@UseGuards(AuthGuard('jwt'))
export class WorkflowsController {
    constructor(private readonly workflowsService: WorkflowsService) { }

    // ========================
    // WORKFLOW TEMPLATES
    // ========================

    @Get()
    findAll(
        @Query('brandId') brandId?: string,
        @Query('is_active') is_active?: string,
        @Query('is_default') is_default?: string,
        @Request() req?: AuthenticatedRequest,
    ) {
        return this.workflowsService.findAll(
            {
                brandId: brandId ? parseInt(brandId, 10) : undefined,
                is_active: is_active !== undefined ? is_active === 'true' : undefined,
                is_default: is_default !== undefined ? is_default === 'true' : undefined,
            },
            req!.user.id,
        );
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.findOne(id, req.user.id);
    }

    @Post()
    create(
        @Body() data: { brand_id: number; name: string; description?: string; is_default?: boolean },
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.create(data, req.user.id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { name?: string; description?: string; is_default?: boolean; is_active?: boolean },
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.update(id, data, req.user.id);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.remove(id, req.user.id);
    }

    @Get(':id/preview')
    preview(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.preview(id, req.user.id);
    }

    // ========================
    // WORKFLOW TEMPLATE TASKS
    // ========================

    @Get(':id/tasks')
    getTemplateTasks(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.getTemplateTasks(id, req.user.id);
    }

    @Post(':id/tasks')
    addTaskToTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: {
            task_library_id: number;
            phase?: string;
            override_hours?: number;
            override_assignee_role?: string;
            order_index?: number;
            is_required?: boolean;
        },
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.addTaskToTemplate(id, data, req.user.id);
    }

    @Post(':id/tasks/sync')
    syncTemplateTasks(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: {
            tasks: {
                task_library_id: number;
                phase?: string;
                override_hours?: number;
                override_assignee_role?: string;
                order_index?: number;
                is_required?: boolean;
            }[];
        },
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.syncTemplateTasks(id, data, req.user.id);
    }

    @Post(':id/tasks/toggle')
    toggleTaskInTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { task_library_id: number },
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.toggleTaskInTemplate(id, data.task_library_id, req.user.id);
    }

    @Patch('tasks/:taskId')
    updateTemplateTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() data: {
            override_hours?: number | null;
            override_assignee_role?: string | null;
            order_index?: number;
            is_required?: boolean;
            phase?: string;
        },
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.updateTemplateTask(taskId, data, req.user.id);
    }

    @Delete('tasks/:taskId')
    removeTaskFromTemplate(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.workflowsService.removeTaskFromTemplate(taskId, req.user.id);
    }
}
