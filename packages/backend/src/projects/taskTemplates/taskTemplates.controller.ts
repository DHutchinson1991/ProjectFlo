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
} from "./taskTemplates.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Controller("task-templates")
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) { }

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

  // Advanced Phase 2B Features

  @Get("recommendations")
  async getRecommendations(
    @Query("entity_type") entityType: string,
    @Query("entity_id") entityId: string,
    @Query("project_type") projectType?: string,
    @Query("client_segment") clientSegment?: string,
  ) {
    return this.taskTemplatesService.getSmartRecommendations({
      entityType,
      entityId: parseInt(entityId),
      projectType,
      clientSegment,
    });
  }

  @Get(":id/versions")
  async getVersions(@Param("id", ParseIntPipe) id: number) {
    return this.taskTemplatesService.getVersionHistory(id);
  }

  @Post(":id/versions")
  async createVersion(
    @Param("id", ParseIntPipe) id: number,
    @Body()
    versionData: {
      name: string;
      description?: string;
      change_summary?: string;
    },
  ) {
    return this.taskTemplatesService.createVersion(id, versionData);
  }

  @Patch("versions/:versionId/submit-approval")
  async submitForApproval(@Param("versionId", ParseIntPipe) versionId: number) {
    return this.taskTemplatesService.submitForApproval(versionId);
  }

  @Patch("versions/:versionId/approve")
  async approveVersion(
    @Param("versionId", ParseIntPipe) versionId: number,
    @Body() approvalData: { action: "approve" | "reject"; notes?: string },
  ) {
    return this.taskTemplatesService.processApproval(versionId, approvalData);
  }

  @Patch("versions/:versionId/restore")
  async restoreVersion(@Param("versionId", ParseIntPipe) versionId: number) {
    return this.taskTemplatesService.restoreVersion(versionId);
  }

  @Get("marketplace/featured")
  async getFeaturedTemplates() {
    return this.taskTemplatesService.getFeaturedMarketplaceTemplates();
  }

  @Post("marketplace/import")
  async importFromMarketplace(
    @Body()
    templateData: {
      name: string;
      phase: string;
      pricing_type: "Hourly" | "Fixed";
      fixed_price?: number;
      effort_hours: string;
      description?: string;
    },
  ) {
    return this.taskTemplatesService.importFromMarketplace(templateData);
  }
}
