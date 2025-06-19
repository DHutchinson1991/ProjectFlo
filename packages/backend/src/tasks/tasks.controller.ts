import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { tasks_status } from '@prisma/client';

// DTOs
export class CreateTaskDto {
  project_id: number;
  build_component_id: number;
  task_template_id: number;
  title?: string;
  description?: string;
  planned_duration_hours?: number;
  due_date?: Date;
  assigned_to_contributor_id?: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  is_client_visible?: boolean;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: tasks_status;
  planned_duration_hours?: number;
  actual_duration_hours?: number;
  due_date?: Date;
  assigned_to_contributor_id?: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  is_client_visible?: boolean;
  progress_percentage?: number;
}

export class TaskFilters {
  project_id?: number;
  status?: tasks_status;
  assigned_to?: number;
  due_before?: Date;
  due_after?: Date;
  search?: string;
  priority?: string;
  is_overdue?: boolean;
}

export class BulkUpdateTaskDto {
  task_ids: number[];
  updates: {
    status?: tasks_status;
    assigned_to_contributor_id?: number;
    due_date?: Date;
    priority?: string;
  };
}

export class TaskCommentDto {
  content: string;
  mentions?: number[]; // contributor IDs
}

export class TimeEntryDto {
  hours: number;
  description?: string;
  date: Date;
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll(
    @Query('project_id') project_id?: string,
    @Query('status') status?: tasks_status,
    @Query('assigned_to') assigned_to?: string,
    @Query('due_before') due_before?: string,
    @Query('due_after') due_after?: string,
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @Query('is_overdue') is_overdue?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters: TaskFilters = {};
    if (project_id) filters.project_id = parseInt(project_id);
    if (status) filters.status = status;
    if (assigned_to) filters.assigned_to = parseInt(assigned_to);
    if (due_before) filters.due_before = new Date(due_before);
    if (due_after) filters.due_after = new Date(due_after);
    if (search) filters.search = search;
    if (priority) filters.priority = priority;
    if (is_overdue) filters.is_overdue = is_overdue === 'true';

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;

    return this.tasksService.findAll(filters, pageNum, limitNum);
  }

  @Get('board')
  getBoardData(
    @Query('project_id') project_id?: string,
    @Query('assigned_to') assigned_to?: string
  ) {
    const filters: TaskFilters = {};
    if (project_id) filters.project_id = parseInt(project_id);
    if (assigned_to) filters.assigned_to = parseInt(assigned_to);

    return this.tasksService.getBoardData(filters);
  }

  @Get('analytics')
  getAnalytics(
    @Query('project_id') project_id?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string
  ) {
    return this.tasksService.getTaskAnalytics({
      project_id: project_id ? parseInt(project_id) : undefined,
      date_from: date_from ? new Date(date_from) : undefined,
      date_to: date_to ? new Date(date_to) : undefined,
    });
  }

  @Get('my-tasks')
  getMyTasks(
    @Query('contributor_id') contributor_id: string,
    @Query('status') status?: tasks_status
  ) {
    return this.tasksService.getMyTasks(parseInt(contributor_id), status);
  }

  @Get('overdue')
  getOverdueTasks(@Query('project_id') project_id?: string) {
    return this.tasksService.getOverdueTasks(project_id ? parseInt(project_id) : undefined);
  }

  // Get projects for task creation
  @Get('projects')
  async getProjects() {
    return this.tasksService.getProjects();
  }

  // Get build components for a project
  @Get('projects/:projectId/build-components')
  async getBuildComponents(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.tasksService.getBuildComponents(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }

  @Post('bulk-update')
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateTaskDto) {
    return this.tasksService.bulkUpdate(bulkUpdateDto);
  }

  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() commentDto: TaskCommentDto
  ) {
    return this.tasksService.addComment(id, commentDto);
  }

  @Get(':id/comments')
  getComments(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getComments(id);
  }

  @Post(':id/time')
  addTimeEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() timeEntryDto: TimeEntryDto
  ) {
    return this.tasksService.addTimeEntry(id, timeEntryDto);
  }

  @Get(':id/time')
  getTimeEntries(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getTimeEntries(id);
  }

  @Post(':id/dependencies')
  addDependency(
    @Param('id', ParseIntPipe) id: number,
    @Body() { dependent_task_id }: { dependent_task_id: number }
  ) {
    return this.tasksService.addDependency(id, dependent_task_id);
  }

  @Delete(':id/dependencies/:dependentId')
  removeDependency(
    @Param('id', ParseIntPipe) id: number,
    @Param('dependentId', ParseIntPipe) dependentId: number
  ) {
    return this.tasksService.removeDependency(id, dependentId);
  }

  @Get(':id/dependencies')
  getDependencies(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getDependencies(id);
  }

  // Get projects for task creation
}
