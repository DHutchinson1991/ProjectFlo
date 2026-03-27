import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    ParseIntPipe,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTasksService } from './services/active-tasks.service';
import { ActiveTasksDateRangeQueryDto } from './dto/active-tasks-date-range-query.dto';
import { ActiveTasksQueryDto } from './dto/active-tasks-query.dto';

@Controller('api/calendar')
@UseGuards(AuthGuard('jwt'))
export class ActiveTasksController {
    constructor(private readonly activeTasksService: ActiveTasksService) {}

    @Get('tasks')
    async getTasksForDateRange(
        @Query(new ValidationPipe({ transform: true })) query: ActiveTasksDateRangeQueryDto,
    ) {
        return this.activeTasksService.getTasksForDateRange(query.start_date, query.end_date);
    }

    @Get('active-tasks')
    async getActiveTasks(@Query(new ValidationPipe({ transform: true })) query: ActiveTasksQueryDto) {
        return this.activeTasksService.getActiveTasks(query.status);
    }

    @Patch('active-tasks/:taskId/assign')
    async assignActiveTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body(new ValidationPipe({ transform: true })) body: { source: 'inquiry' | 'project'; assigned_to_id: number | null; task_kind?: 'task' | 'subtask' },
    ) {
        return this.activeTasksService.assignActiveTask(taskId, body.source, body.assigned_to_id, body.task_kind);
    }

    @Patch('active-tasks/:taskId/toggle')
    async toggleActiveTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body(new ValidationPipe({ transform: true })) body: { source: 'inquiry' | 'project'; task_kind?: 'task' | 'subtask'; completed_by_id?: number },
    ) {
        return this.activeTasksService.toggleActiveTask(taskId, body.source, body.task_kind, body.completed_by_id);
    }
}
