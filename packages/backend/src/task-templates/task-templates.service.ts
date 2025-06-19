import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, pricing_type_options } from '@prisma/client';

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
        effort_hours: createTaskTemplateDto.effort_hours ? new Prisma.Decimal(createTaskTemplateDto.effort_hours) : null,
        fixed_price: createTaskTemplateDto.fixed_price ? new Prisma.Decimal(createTaskTemplateDto.fixed_price) : null,
        average_duration_hours: createTaskTemplateDto.average_duration_hours ? new Prisma.Decimal(createTaskTemplateDto.average_duration_hours) : null,
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
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phase: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.task_templates.findMany({
      where,
      include: {
        _count: {
          select: {
            component_task_recipes: true,
            tasks: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const taskTemplate = await this.prisma.task_templates.findUnique({
      where: { id },
      include: {
        component_task_recipes: {
          include: {
            deliverable: {
              select: {
                id: true,
                name: true,
              },
            },
            coverage_scene: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            assigned_to_contributor_id: true,
            due_date: true,
          },
          take: 10,
          orderBy: { due_date: 'desc' },
        },
        _count: {
          select: {
            component_task_recipes: true,
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
        effort_hours: updateTaskTemplateDto.effort_hours ? new Prisma.Decimal(updateTaskTemplateDto.effort_hours) : undefined,
        fixed_price: updateTaskTemplateDto.fixed_price ? new Prisma.Decimal(updateTaskTemplateDto.fixed_price) : undefined,
        average_duration_hours: updateTaskTemplateDto.average_duration_hours ? new Prisma.Decimal(updateTaskTemplateDto.average_duration_hours) : undefined,
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
            component_task_recipes: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        component_task_recipes: {
          _count: 'desc',
        },
      },
    });

    return {
      total_templates: templates.length,
      most_used_templates: templates.slice(0, 10),
      usage_distribution: templates.map(template => ({
        id: template.id,
        name: template.name,
        component_usage: template._count.component_task_recipes,
        task_usage: template._count.tasks,
      })),
    };
  }
}
