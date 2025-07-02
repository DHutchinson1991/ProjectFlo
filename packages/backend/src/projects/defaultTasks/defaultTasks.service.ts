import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface CreateDefaultTaskDto {
  taskName: string;
  estimatedHours: number;
  taskTemplateId?: number;
  orderIndex?: number;
}

export interface UpdateDefaultTaskDto {
  taskName?: string;
  estimatedHours?: number;
  taskTemplateId?: number;
}

export interface ReorderTasksDto {
  taskOrders: Array<{ id: number; orderIndex: number }>;
}

@Injectable()
export class DefaultTasksService {
  constructor(private prisma: PrismaService) { }

  async getDefaultTasks(entityType: string, entityId: number) {
    return this.prisma.entity_default_tasks.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      include: {
        task_template: {
          select: {
            id: true,
            name: true,
            phase: true,
            effort_hours: true,
            pricing_type: true,
          },
        },
      },
      orderBy: {
        order_index: "asc",
      },
    });
  }

  async addDefaultTask(
    entityType: string,
    entityId: number,
    data: CreateDefaultTaskDto,
  ) {
    // Get the next order index if not provided
    let orderIndex = data.orderIndex;
    if (orderIndex === undefined) {
      const lastTask = await this.prisma.entity_default_tasks.findFirst({
        where: {
          entity_type: entityType,
          entity_id: entityId,
        },
        orderBy: {
          order_index: "desc",
        },
      });
      orderIndex = (lastTask?.order_index || 0) + 1;
    }

    return this.prisma.entity_default_tasks.create({
      data: {
        entity_type: entityType,
        entity_id: entityId,
        task_name: data.taskName,
        estimated_hours: data.estimatedHours,
        task_template_id: data.taskTemplateId,
        order_index: orderIndex,
      },
      include: {
        task_template: {
          select: {
            id: true,
            name: true,
            phase: true,
            effort_hours: true,
            pricing_type: true,
          },
        },
      },
    });
  }

  async updateDefaultTask(taskId: number, data: UpdateDefaultTaskDto) {
    const existingTask = await this.prisma.entity_default_tasks.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      throw new NotFoundException(`Default task with ID ${taskId} not found`);
    }

    return this.prisma.entity_default_tasks.update({
      where: { id: taskId },
      data: {
        task_name: data.taskName,
        estimated_hours: data.estimatedHours,
        task_template_id: data.taskTemplateId,
      },
      include: {
        task_template: {
          select: {
            id: true,
            name: true,
            phase: true,
            effort_hours: true,
            pricing_type: true,
          },
        },
      },
    });
  }

  async deleteDefaultTask(taskId: number) {
    const existingTask = await this.prisma.entity_default_tasks.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      throw new NotFoundException(`Default task with ID ${taskId} not found`);
    }

    await this.prisma.entity_default_tasks.delete({
      where: { id: taskId },
    });

    return { success: true };
  }

  async reorderDefaultTasks(
    entityType: string,
    entityId: number,
    orderData: ReorderTasksDto,
  ) {
    // To avoid unique constraint violations, we'll update tasks sequentially
    // First, set all affected tasks to temporary negative order indices
    const tempUpdates = orderData.taskOrders.map(({ id }, index) =>
      this.prisma.entity_default_tasks.update({
        where: { id },
        data: { order_index: -(index + 1) }, // Use negative numbers as temp values
      }),
    );

    await this.prisma.$transaction(tempUpdates);

    // Then update to the final order indices
    const finalUpdates = orderData.taskOrders.map(({ id, orderIndex }) =>
      this.prisma.entity_default_tasks.update({
        where: { id },
        data: { order_index: orderIndex },
      }),
    );

    await this.prisma.$transaction(finalUpdates);

    return this.getDefaultTasks(entityType, entityId);
  }

  async copyTaskFromTemplate(
    entityType: string,
    entityId: number,
    templateId: number,
  ) {
    const template = await this.prisma.task_templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Task template with ID ${templateId} not found`,
      );
    }

    return this.addDefaultTask(entityType, entityId, {
      taskName: template.name,
      estimatedHours: Number(template.effort_hours) || 0,
      taskTemplateId: templateId,
    });
  }

  async getAvailableTaskTemplates() {
    return this.prisma.task_templates.findMany({
      select: {
        id: true,
        name: true,
        phase: true,
        effort_hours: true,
        pricing_type: true,
      },
      orderBy: [{ phase: "asc" }, { name: "asc" }],
    });
  }

  async getTaskTemplatesByCategory(category?: string) {
    console.log("Filtering templates by category:", category);
    const where: { phase?: string } = {};

    if (category) {
      where.phase = category;
      console.log("Where clause:", where);
    }

    const result = await this.prisma.task_templates.findMany({
      where,
      select: {
        id: true,
        name: true,
        phase: true,
        effort_hours: true,
        pricing_type: true,
        fixed_price: true,
        average_duration_hours: true,
      },
      orderBy: [{ phase: "asc" }, { name: "asc" }],
    });

    console.log("Query result:", result);
    return result;
  }
}
