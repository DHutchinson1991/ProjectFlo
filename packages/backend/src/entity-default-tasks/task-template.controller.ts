import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Controller("api/task-templates")
export class TaskTemplateController {
  constructor(private readonly prisma: PrismaService) {}

  // Get task templates by category for entity types
  @Get("by-category")
  async getTaskTemplatesByCategory(@Query("category") category?: string) {
    try {
      const whereClause = category ? { phase: category } : {};

      const templates = await this.prisma.task_templates.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          phase: true,
          effort_hours: true,
          pricing_type: true,
        },
        orderBy: [{ phase: "asc" }, { name: "asc" }],
      });

      // Group templates by phase/category
      const groupedTemplates = templates.reduce(
        (acc, template) => {
          const phase = template.phase || "General";
          if (!acc[phase]) {
            acc[phase] = [];
          }
          acc[phase].push(template);
          return acc;
        },
        {} as Record<string, typeof templates>,
      );

      return {
        success: true,
        data: groupedTemplates,
        meta: {
          totalTemplates: templates.length,
          categories: Object.keys(groupedTemplates),
          requestedCategory: category,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get task templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all task templates
  @Get()
  async getAllTaskTemplates() {
    try {
      const templates = await this.prisma.task_templates.findMany({
        select: {
          id: true,
          name: true,
          phase: true,
          effort_hours: true,
          pricing_type: true,
        },
        orderBy: [{ phase: "asc" }, { name: "asc" }],
      });

      return {
        success: true,
        data: templates,
        meta: {
          totalTemplates: templates.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get task templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
