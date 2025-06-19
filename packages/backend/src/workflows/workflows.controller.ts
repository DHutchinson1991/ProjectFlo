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
} from '@nestjs/common';
import { 
  WorkflowsService,
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CreateWorkflowStageDto,
  UpdateWorkflowStageDto,
  CreateTaskGenerationRuleDto,
  UpdateTaskGenerationRuleDto,
} from './workflows.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // Workflow Templates
  @Post('templates')
  createTemplate(@Body() createTemplateDto: CreateWorkflowTemplateDto) {
    return this.workflowsService.createTemplate(createTemplateDto);
  }

  @Get('templates')
  findAllTemplates(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.workflowsService.findAllTemplates(includeInactiveFlag);
  }

  @Get('templates/:id')
  findTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.workflowsService.findTemplate(id);
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTemplateDto: UpdateWorkflowTemplateDto,
  ) {
    return this.workflowsService.updateTemplate(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.workflowsService.removeTemplate(id);
  }

  // Workflow Stages
  @Post('templates/:templateId/stages')
  createStage(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() createStageDto: CreateWorkflowStageDto,
  ) {
    return this.workflowsService.createStage(templateId, createStageDto);
  }

  @Get('templates/:templateId/stages')
  findStagesByTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    return this.workflowsService.findStagesByTemplate(templateId);
  }

  @Patch('stages/:id')
  updateStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStageDto: UpdateWorkflowStageDto,
  ) {
    return this.workflowsService.updateStage(id, updateStageDto);
  }

  @Delete('stages/:id')
  removeStage(@Param('id', ParseIntPipe) id: number) {
    return this.workflowsService.removeStage(id);
  }

  @Post('stages/reorder')
  reorderStages(@Body() reorderDto: { stageId: number; newOrderIndex: number }[]) {
    return this.workflowsService.reorderStages(reorderDto);
  }

  // Task Generation Rules
  @Post('stages/:stageId/rules')
  createTaskRule(
    @Param('stageId', ParseIntPipe) stageId: number,
    @Body() createRuleDto: CreateTaskGenerationRuleDto,
  ) {
    return this.workflowsService.createTaskRule(stageId, createRuleDto);
  }

  @Get('stages/:stageId/rules')
  findRulesByStage(@Param('stageId', ParseIntPipe) stageId: number) {
    return this.workflowsService.findRulesByStage(stageId);
  }

  @Patch('rules/:id')
  updateTaskRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRuleDto: UpdateTaskGenerationRuleDto,
  ) {
    return this.workflowsService.updateTaskRule(id, updateRuleDto);
  }

  @Delete('rules/:id')
  removeTaskRule(@Param('id', ParseIntPipe) id: number) {
    return this.workflowsService.removeTaskRule(id);
  }

  // Task Generation
  @Post('projects/:projectId/generate-tasks')
  generateTasksForProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() generateDto: { stageIds?: number[] },
  ) {
    return this.workflowsService.generateTasksForProject(projectId, generateDto.stageIds);
  }

  @Get('projects/:projectId/generated-tasks')
  getGeneratedTasksLog(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.workflowsService.getGeneratedTasksLog(projectId);
  }

  // Analytics and Overview
  @Get('templates/:templateId/analytics')
  getTemplateAnalytics(@Param('templateId', ParseIntPipe) templateId: number) {
    return this.workflowsService.getTemplateAnalytics(templateId);
  }

  @Get('overview')
  getWorkflowOverview() {
    return this.workflowsService.getWorkflowOverview();
  }
}
