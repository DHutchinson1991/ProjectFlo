import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  TaskTemplatesService,
  CreateTaskTemplateDto,
  UpdateTaskTemplateDto,
  TaskTemplateFilters,
} from "./task-templates.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Controller("task-templates")
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) {}

  @Post()
  async create(@Body() createTaskTemplateDto: CreateTaskTemplateDto) {
    try {
      return await this.taskTemplatesService.create(createTaskTemplateDto);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HttpException(
          `A task template with the name "${createTaskTemplateDto.name}" already exists. Please choose a different name.`,
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @Get()
  findAll(
    @Query("phase") phase?: string,
    @Query("search") search?: string,
    @Query("pricing_type") pricing_type?: "Hourly" | "Fixed",
  ) {
    const filters: TaskTemplateFilters = {};
    if (phase) filters.phase = phase;
    if (search) filters.search = search;
    if (pricing_type) filters.pricing_type = pricing_type;

    return this.taskTemplatesService.findAll(filters);
  }

  @Get("analytics")
  getAnalytics() {
    return this.taskTemplatesService.getUsageAnalytics();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.taskTemplatesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTaskTemplateDto: UpdateTaskTemplateDto,
  ) {
    return this.taskTemplatesService.update(id, updateTaskTemplateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.taskTemplatesService.remove(id);
  }
}
