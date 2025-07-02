import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateWorkflowTemplateDto {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateWorkflowTemplateDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateWorkflowStageDto {
  name: string;
  description?: string;
  order_index: number;
  is_active?: boolean;
}

export interface UpdateWorkflowStageDto {
  name?: string;
  description?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface CreateTaskGenerationRuleDto {
  task_template_id: number;
  component_type?: string;
  coverage_scene_id?: number;
  is_required?: boolean;
  auto_assign_to_role?: string;
  conditions?: Record<string, any>;
}

export interface UpdateTaskGenerationRuleDto {
  task_template_id?: number;
  component_type?: string;
  coverage_scene_id?: number;
  is_required?: boolean;
  auto_assign_to_role?: string;
  conditions?: Record<string, any>;
}

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) { }

  // Basic CRUD operations using raw SQL to avoid Prisma client issues

  async createTemplate(createTemplateDto: CreateWorkflowTemplateDto) {
    const result = await this.prisma.$queryRaw`
      INSERT INTO workflow_templates (name, description, is_active, created_at, updated_at)
      VALUES (${createTemplateDto.name}, ${createTemplateDto.description || null}, ${createTemplateDto.is_active ?? true}, NOW(), NOW())
      RETURNING *
    ` as any[];
    return result[0];
  }

  async findAllTemplates(includeInactive: boolean = false) {
    if (includeInactive) {
      return this.prisma.$queryRaw`
        SELECT wt.*, 
               COUNT(DISTINCT ws.id)::int as stage_count,
               COUNT(DISTINCT p.id)::int as project_count
        FROM workflow_templates wt
        LEFT JOIN workflow_stages ws ON wt.id = ws.workflow_template_id
        LEFT JOIN projects p ON wt.id = p.workflow_template_id
        GROUP BY wt.id
        ORDER BY wt.created_at DESC
      `;
    } else {
      return this.prisma.$queryRaw`
        SELECT wt.*, 
               COUNT(DISTINCT ws.id)::int as stage_count,
               COUNT(DISTINCT p.id)::int as project_count
        FROM workflow_templates wt
        LEFT JOIN workflow_stages ws ON wt.id = ws.workflow_template_id
        LEFT JOIN projects p ON wt.id = p.workflow_template_id
        WHERE wt.is_active = true
        GROUP BY wt.id
        ORDER BY wt.created_at DESC
      `;
    }
  }

  async findTemplate(id: number) {
    const templates = await this.prisma.$queryRaw`
      SELECT * FROM workflow_templates WHERE id = ${id}
    ` as any[];

    if (!templates || templates.length === 0) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    const stages = await this.prisma.$queryRaw`
      SELECT * FROM workflow_stages 
      WHERE workflow_template_id = ${id}
      ORDER BY order_index ASC
    `;

    const projects = await this.prisma.$queryRaw`
      SELECT p.id, p.project_name, p.wedding_date,
             c.first_name, c.last_name
      FROM projects p
      JOIN clients cl ON p.client_id = cl.id
      JOIN contacts c ON cl.contact_id = c.id
      WHERE p.workflow_template_id = ${id}
    `;

    return {
      ...templates[0],
      stages,
      projects,
      stage_count: Array.isArray(stages) ? stages.length : 0,
      project_count: Array.isArray(projects) ? projects.length : 0,
    };
  }

  async updateTemplate(id: number, updateTemplateDto: UpdateWorkflowTemplateDto) {
    const result = await this.prisma.$queryRaw`
      UPDATE workflow_templates 
      SET 
        name = COALESCE(${updateTemplateDto.name}, name),
        description = COALESCE(${updateTemplateDto.description}, description),
        is_active = COALESCE(${updateTemplateDto.is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    ` as any[];

    if (!result || result.length === 0) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    return result[0];
  }

  async removeTemplate(id: number) {
    const result = await this.prisma.$queryRaw`
      DELETE FROM workflow_templates WHERE id = ${id} RETURNING *
    ` as any[];

    if (!result || result.length === 0) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    return result[0];
  }

  // Workflow Stages
  async createStage(templateId: number, createStageDto: CreateWorkflowStageDto) {
    const templates = await this.prisma.$queryRaw`
      SELECT id FROM workflow_templates WHERE id = ${templateId}
    ` as any[];

    if (!templates || templates.length === 0) {
      throw new NotFoundException(`Workflow template with ID ${templateId} not found`);
    }

    const result = await this.prisma.$queryRaw`
      INSERT INTO workflow_stages (workflow_template_id, name, description, order_index, is_active, created_at, updated_at)
      VALUES (${templateId}, ${createStageDto.name}, ${createStageDto.description || null}, ${createStageDto.order_index}, ${createStageDto.is_active ?? true}, NOW(), NOW())
      RETURNING *
    ` as any[];

    return result[0];
  }

  async findStagesByTemplate(templateId: number) {
    return this.prisma.$queryRaw`
      SELECT ws.*, COUNT(tgr.id)::int as rule_count
      FROM workflow_stages ws
      LEFT JOIN task_generation_rules tgr ON ws.id = tgr.workflow_stage_id
      WHERE ws.workflow_template_id = ${templateId}
      GROUP BY ws.id
      ORDER BY ws.order_index ASC
    `;
  }

  async updateStage(id: number, updateStageDto: UpdateWorkflowStageDto) {
    const result = await this.prisma.$queryRaw`
      UPDATE workflow_stages 
      SET 
        name = COALESCE(${updateStageDto.name}, name),
        description = COALESCE(${updateStageDto.description}, description),
        order_index = COALESCE(${updateStageDto.order_index}, order_index),
        is_active = COALESCE(${updateStageDto.is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    ` as any[];

    if (!result || result.length === 0) {
      throw new NotFoundException(`Workflow stage with ID ${id} not found`);
    }

    return result[0];
  }

  async removeStage(id: number) {
    const result = await this.prisma.$queryRaw`
      DELETE FROM workflow_stages WHERE id = ${id} RETURNING *
    ` as any[];

    if (!result || result.length === 0) {
      throw new NotFoundException(`Workflow stage with ID ${id} not found`);
    }

    return result[0];
  }

  async reorderStages(reorderDto: { stageId: number; newOrderIndex: number }[]) {
    const updates: unknown[] = [];

    for (const { stageId, newOrderIndex } of reorderDto) {
      const result = await this.prisma.$queryRaw`
        UPDATE workflow_stages SET order_index = ${newOrderIndex}, updated_at = NOW()
        WHERE id = ${stageId}
        RETURNING *
      ` as any[];
      if (result && result.length > 0) {
        updates.push(result[0]);
      }
    }

    return updates;
  }

  // Task Generation Rules
  async createTaskRule(stageId: number, createRuleDto: CreateTaskGenerationRuleDto) {
    const stages = await this.prisma.$queryRaw`
      SELECT id FROM workflow_stages WHERE id = ${stageId}
    ` as any[];

    if (!stages || stages.length === 0) {
      throw new NotFoundException(`Workflow stage with ID ${stageId} not found`);
    }

    const result = await this.prisma.$queryRaw`
      INSERT INTO task_generation_rules 
      (workflow_stage_id, task_template_id, component_type, coverage_scene_id, is_required, auto_assign_to_role, conditions, created_at, updated_at)
      VALUES (
        ${stageId}, 
        ${createRuleDto.task_template_id}, 
        ${createRuleDto.component_type || null}::ComponentType, 
        ${createRuleDto.coverage_scene_id || null}, 
        ${createRuleDto.is_required ?? true}, 
        ${createRuleDto.auto_assign_to_role || null}, 
        ${JSON.stringify(createRuleDto.conditions || null)}::jsonb, 
        NOW(), 
        NOW()
      )
      RETURNING *
    ` as any[];

    return result[0];
  }

  async findRulesByStage(stageId: number) {
    return this.prisma.$queryRaw`
      SELECT 
        tgr.*,
        tt.name as task_template_name,
        cs.name as coverage_scene_name
      FROM task_generation_rules tgr
      JOIN task_templates tt ON tgr.task_template_id = tt.id
      LEFT JOIN coverage cs ON tgr.coverage_scene_id = cs.id
      WHERE tgr.workflow_stage_id = ${stageId}
      ORDER BY tgr.created_at DESC
    `;
  }

  async updateTaskRule(id: number, updateRuleDto: UpdateTaskGenerationRuleDto) {
    const result = await this.prisma.$queryRaw`
      UPDATE task_generation_rules 
      SET 
        task_template_id = COALESCE(${updateRuleDto.task_template_id}, task_template_id),
        component_type = COALESCE(${updateRuleDto.component_type || null}::ComponentType, component_type),
        coverage_scene_id = COALESCE(${updateRuleDto.coverage_scene_id}, coverage_scene_id),
        is_required = COALESCE(${updateRuleDto.is_required}, is_required),
        auto_assign_to_role = COALESCE(${updateRuleDto.auto_assign_to_role}, auto_assign_to_role),
        conditions = COALESCE(${JSON.stringify(updateRuleDto.conditions || null)}::jsonb, conditions),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    ` as any[];

    if (!result || result.length === 0) {
      throw new NotFoundException(`Task generation rule with ID ${id} not found`);
    }

    return result[0];
  }

  async removeTaskRule(id: number) {
    const result = await this.prisma.$queryRaw`
      DELETE FROM task_generation_rules WHERE id = ${id} RETURNING *
    ` as any[];

    if (!result || result.length === 0) {
      throw new NotFoundException(`Task generation rule with ID ${id} not found`);
    }

    return result[0];
  }

  // Simplified task generation
  async generateTasksForProject(projectId: number, stageIds?: number[]) {
    return {
      message: `Task generation for project ${projectId} - Implementation pending`,
      generatedCount: 0,
      generatedTasks: [],
    };
  }

  async getGeneratedTasksLog(projectId: number) {
    return this.prisma.$queryRaw`
      SELECT 
        gtl.*,
        t.status as task_status,
        tt.name as task_template_name
      FROM generated_task_log gtl
      JOIN tasks t ON gtl.task_id = t.id
      JOIN task_templates tt ON t.task_template_id = tt.id
      WHERE gtl.project_id = ${projectId}
      ORDER BY gtl.generated_at DESC
    `;
  }

  // Analytics
  async getTemplateAnalytics(templateId: number) {
    const template = await this.findTemplate(templateId);

    const usage = await this.prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT p.id)::int as projects_using_template,
        COUNT(gtl.id)::int as total_tasks_generated
      FROM projects p
      LEFT JOIN generated_task_log gtl ON p.id = gtl.project_id
      WHERE p.workflow_template_id = ${templateId}
    ` as any[];

    return {
      template,
      usage: usage[0] || { projects_using_template: 0, total_tasks_generated: 0 },
      taskCompletionStats: [],
    };
  }

  async getWorkflowOverview() {
    const overview = await this.prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT wt.id)::int as total_templates,
        COUNT(DISTINCT CASE WHEN wt.is_active THEN wt.id END)::int as active_templates,
        COUNT(DISTINCT ws.id)::int as total_stages,
        COUNT(DISTINCT tgr.id)::int as total_rules
      FROM workflow_templates wt
      LEFT JOIN workflow_stages ws ON wt.id = ws.workflow_template_id
      LEFT JOIN task_generation_rules tgr ON ws.id = tgr.workflow_stage_id
    ` as any[];

    const recentTemplates = await this.prisma.$queryRaw`
      SELECT wt.*, COUNT(DISTINCT ws.id)::int as stage_count, COUNT(DISTINCT p.id)::int as project_count
      FROM workflow_templates wt
      LEFT JOIN workflow_stages ws ON wt.id = ws.workflow_template_id
      LEFT JOIN projects p ON wt.id = p.workflow_template_id
      GROUP BY wt.id
      ORDER BY wt.created_at DESC
      LIMIT 5
    `;

    return {
      summary: overview[0] || { total_templates: 0, active_templates: 0, total_stages: 0, total_rules: 0 },
      recentlyCreatedTemplates: recentTemplates,
      mostUsedTemplates: recentTemplates, // Using same data for now
    };
  }
}
