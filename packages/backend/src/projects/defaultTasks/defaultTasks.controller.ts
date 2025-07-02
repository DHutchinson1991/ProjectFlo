import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { DefaultTasksService } from "./defaultTasks.service";
import {
  CreateDefaultTaskDto,
  UpdateDefaultTaskDto,
  ReorderTasksDto,
} from "./dto/index";

@Controller("api/entities")
export class DefaultTasksController {
  constructor(
    private readonly defaultTasksService: DefaultTasksService,
  ) { }

  // Get all default tasks for an entity
  @Get(":type/:id/default-tasks")
  async getDefaultTasks(
    @Param("type") entityType: string,
    @Param("id", ParseIntPipe) entityId: number,
  ) {
    // Validate entity type
    if (!["component", "deliverable", "coverage_scene"].includes(entityType)) {
      throw new HttpException(
        "Invalid entity type. Must be: component, deliverable, or coverage_scene",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tasks = await this.defaultTasksService.getDefaultTasks(
        entityType,
        entityId,
      );
      return {
        success: true,
        data: tasks,
        meta: {
          entityType,
          entityId,
          count: tasks.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get default tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Add a new default task
  @Post(":type/:id/default-tasks")
  async addDefaultTask(
    @Param("type") entityType: string,
    @Param("id", ParseIntPipe) entityId: number,
    @Body(ValidationPipe) createTaskDto: CreateDefaultTaskDto,
  ) {
    // Validate entity type
    if (!["component", "deliverable", "coverage_scene"].includes(entityType)) {
      throw new HttpException(
        "Invalid entity type. Must be: component, deliverable, or coverage_scene",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const task = await this.defaultTasksService.addDefaultTask(
        entityType,
        entityId,
        createTaskDto,
      );
      return {
        success: true,
        data: task,
        message: "Default task added successfully",
      };
    } catch (error) {
      throw new HttpException(
        `Failed to add default task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update an existing default task
  @Put(":type/:id/default-tasks/:taskId")
  async updateDefaultTask(
    @Param("type") entityType: string,
    @Param("id", ParseIntPipe) entityId: number,
    @Param("taskId", ParseIntPipe) taskId: number,
    @Body(ValidationPipe) updateTaskDto: UpdateDefaultTaskDto,
  ) {
    try {
      const task = await this.defaultTasksService.updateDefaultTask(
        taskId,
        updateTaskDto,
      );
      return {
        success: true,
        data: task,
        message: "Default task updated successfully",
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update default task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Delete a default task
  @Delete(":type/:id/default-tasks/:taskId")
  async deleteDefaultTask(
    @Param("type") entityType: string,
    @Param("id", ParseIntPipe) entityId: number,
    @Param("taskId", ParseIntPipe) taskId: number,
  ) {
    try {
      await this.defaultTasksService.deleteDefaultTask(taskId);
      return {
        success: true,
        message: "Default task deleted successfully",
      };
    } catch (error) {
      throw new HttpException(
        `Failed to delete default task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Reorder default tasks
  @Post(":type/:id/default-tasks/reorder")
  async reorderDefaultTasks(
    @Param("type") entityType: string,
    @Param("id", ParseIntPipe) entityId: number,
    @Body(ValidationPipe) reorderDto: ReorderTasksDto,
  ) {
    try {
      const tasks = await this.defaultTasksService.reorderDefaultTasks(
        entityType,
        entityId,
        reorderDto,
      );
      return {
        success: true,
        data: tasks,
        message: "Default tasks reordered successfully",
      };
    } catch (error) {
      throw new HttpException(
        `Failed to reorder default tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Add task from template
  @Post(":type/:id/default-tasks/from-template")
  async addTaskFromTemplate(
    @Param("type") entityType: string,
    @Param("id", ParseIntPipe) entityId: number,
    @Body() body: { templateId: number },
  ) {
    try {
      const task = await this.defaultTasksService.copyTaskFromTemplate(
        entityType,
        entityId,
        body.templateId,
      );
      return {
        success: true,
        data: task,
        message: "Task added from template successfully",
      };
    } catch (error) {
      throw new HttpException(
        `Failed to add task from template: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
