import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma, pricing_type_options } from "@prisma/client";

export interface CreateTaskTemplateDto {
  name: string;
  phase?: string;
  effort_hours?: number;
  pricing_type?: pricing_type_options;
  fixed_price?: number;
  average_duration_hours?: number;
  effort_calculation_rules?: Prisma.InputJsonValue;
}

export interface UpdateTaskTemplateDto {
  name?: string;
  phase?: string;
  effort_hours?: number;
  pricing_type?: pricing_type_options;
  fixed_price?: number;
  average_duration_hours?: number;
  effort_calculation_rules?: Prisma.InputJsonValue;
}

export interface TaskTemplateFilters {
  phase?: string;
  search?: string;
  pricing_type?: pricing_type_options;
}

@Injectable()
export class TaskTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskTemplateDto: CreateTaskTemplateDto) {
    return this.prisma.task_templates.create({
      data: {
        ...createTaskTemplateDto,
        effort_hours: createTaskTemplateDto.effort_hours
          ? new Prisma.Decimal(createTaskTemplateDto.effort_hours)
          : null,
        fixed_price: createTaskTemplateDto.fixed_price
          ? new Prisma.Decimal(createTaskTemplateDto.fixed_price)
          : null,
        average_duration_hours: createTaskTemplateDto.average_duration_hours
          ? new Prisma.Decimal(createTaskTemplateDto.average_duration_hours)
          : null,
      },
    });
  }

  async findAll(filters?: TaskTemplateFilters) {
    const where: Prisma.task_templatesWhereInput = {};

    if (filters?.phase) {
      where.phase = filters.phase;
    }

    if (filters?.pricing_type) {
      where.pricing_type = filters.pricing_type;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { phase: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.task_templates.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: number) {
    const taskTemplate = await this.prisma.task_templates.findUnique({
      where: { id },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            assigned_to_contributor_id: true,
            due_date: true,
          },
          take: 10,
          orderBy: { due_date: "desc" },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!taskTemplate) {
      throw new NotFoundException(`Task template with ID ${id} not found`);
    }

    return taskTemplate;
  }

  async update(id: number, updateTaskTemplateDto: UpdateTaskTemplateDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.task_templates.update({
      where: { id },
      data: {
        ...updateTaskTemplateDto,
        effort_hours: updateTaskTemplateDto.effort_hours
          ? new Prisma.Decimal(updateTaskTemplateDto.effort_hours)
          : undefined,
        fixed_price: updateTaskTemplateDto.fixed_price
          ? new Prisma.Decimal(updateTaskTemplateDto.fixed_price)
          : undefined,
        average_duration_hours: updateTaskTemplateDto.average_duration_hours
          ? new Prisma.Decimal(updateTaskTemplateDto.average_duration_hours)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return this.prisma.task_templates.delete({
      where: { id },
    });
  }

  // Analytics methods
  async getUsageAnalytics() {
    const templates = await this.prisma.task_templates.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        tasks: {
          _count: "desc",
        },
      },
    });

    return {
      total_templates: templates.length,
      most_used_templates: templates.slice(0, 10),
      usage_distribution: templates.map((template) => ({
        id: template.id,
        name: template.name,
        task_usage: template._count.tasks,
      })),
    };
  }

  // Advanced Phase 2B Features

  async getSmartRecommendations(params: {
    entityType: string;
    entityId: number;
    projectType?: string;
    clientSegment?: string;
  }) {
    // Mock implementation - in production this would use AI/ML algorithms
    console.log(
      `Getting recommendations for ${params.entityType} ${params.entityId}`,
    );
    const templates = await this.prisma.task_templates.findMany({
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: {
        tasks: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return templates.map((template, index) => ({
      template: {
        id: template.id,
        name: template.name,
        phase: template.phase,
        pricing_type: template.pricing_type,
        fixed_price: template.fixed_price,
        effort_hours: template.effort_hours?.toString() || "0",
        description: null,
        usage_count: template._count.tasks,
        success_rate: 0.8 + Math.random() * 0.15, // Mock data
        avg_completion_time: parseFloat(
          template.effort_hours?.toString() || "1",
        ),
        profitability_score: 0.7 + Math.random() * 0.25, // Mock data
      },
      score: 0.9 - index * 0.1,
      reasons: [
        {
          type: "usage_pattern",
          confidence: 0.8,
          description: "Popular choice for similar projects",
        },
      ],
      category:
        index < 3 ? "highly_recommended" : index < 6 ? "suggested" : "trending",
    }));
  }

  async getVersionHistory(templateId: number) {
    // Mock implementation - would need version tracking tables in production
    return [
      {
        id: 1,
        template_id: templateId,
        version: "1.0",
        name: "Initial Version",
        created_at: new Date().toISOString(),
        created_by: "System",
        status: "approved",
        is_current: true,
      },
    ];
  }

  async createVersion(
    templateId: number,
    versionData: {
      name: string;
      description?: string;
      change_summary?: string;
    },
  ) {
    // Mock implementation
    return {
      id: Date.now(),
      template_id: templateId,
      version: "1.1",
      ...versionData,
      status: "draft",
      created_at: new Date().toISOString(),
      created_by: "Current User",
      is_current: false,
    };
  }

  async submitForApproval(versionId: number) {
    // Mock implementation
    console.log(`Submitting version ${versionId} for approval`);
    return { success: true, message: "Version submitted for approval" };
  }

  async processApproval(
    versionId: number,
    approvalData: {
      action: "approve" | "reject";
      notes?: string;
    },
  ) {
    // Mock implementation
    return {
      success: true,
      message: `Version ${approvalData.action}d successfully`,
      action: approvalData.action,
      notes: approvalData.notes,
    };
  }

  async restoreVersion(versionId: number) {
    // Mock implementation
    console.log(`Restoring version ${versionId}`);
    return { success: true, message: "Version restored successfully" };
  }

  async getFeaturedMarketplaceTemplates() {
    // Mock implementation - would fetch from external marketplace API
    return [
      {
        id: 1,
        name: "Wedding Ceremony Package",
        description: "Complete template for wedding ceremony coverage",
        phase: "Production",
        effort_hours: "6.0",
        pricing_type: "Fixed",
        fixed_price: 1200,
        author: { name: "ProWedding Studios", verified: true },
        rating: 4.8,
        downloads: 1543,
        views: 3201,
        tags: ["wedding", "ceremony", "premium"],
        category: "Wedding",
        is_featured: true,
        is_premium: true,
      },
    ];
  }

  async importFromMarketplace(templateData: {
    name: string;
    phase: string;
    pricing_type: "Hourly" | "Fixed";
    fixed_price?: number;
    effort_hours: string;
    description?: string;
  }) {
    return this.create({
      name: templateData.name,
      phase: templateData.phase,
      pricing_type: templateData.pricing_type as pricing_type_options,
      fixed_price: templateData.fixed_price,
      effort_hours: parseFloat(templateData.effort_hours),
    });
  }
}
