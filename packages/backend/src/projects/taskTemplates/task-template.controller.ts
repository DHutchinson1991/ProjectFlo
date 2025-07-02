import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { DefaultTasksService } from "../defaultTasks/defaultTasks.service";

@Controller("api/task-templates")
export class TaskTemplateController {
  constructor(
    private readonly defaultTasksService: DefaultTasksService,
  ) { }

  // Get task templates filtered by category
  @Get("by-category")
  async getTaskTemplatesByCategory(@Query("category") category?: string) {
    try {
      const templates = await this.defaultTasksService.getAvailableTaskTemplates();

      // If category is specified, filter templates
      if (category) {
        const filteredTemplates = templates.filter((template) => {
          // Map entity types to template phases for filtering
          switch (category.toLowerCase()) {
            case "production":
              return (
                template.phase?.toLowerCase().includes("production") ||
                template.phase?.toLowerCase().includes("filming") ||
                template.phase?.toLowerCase().includes("shooting")
              );
            case "post-production":
              return (
                template.phase?.toLowerCase().includes("post") ||
                template.phase?.toLowerCase().includes("edit") ||
                template.phase?.toLowerCase().includes("color") ||
                template.phase?.toLowerCase().includes("audio")
              );
            case "films":
              return (
                template.phase?.toLowerCase().includes("film") ||
                template.phase?.toLowerCase().includes("video") ||
                template.phase?.toLowerCase().includes("export")
              );
            case "assets":
              return (
                template.phase?.toLowerCase().includes("asset") ||
                template.phase?.toLowerCase().includes("media")
              );
            case "export":
              return (
                template.phase?.toLowerCase().includes("export") ||
                template.phase?.toLowerCase().includes("delivery") ||
                template.phase?.toLowerCase().includes("render")
              );
            case "delivery":
              return (
                template.phase?.toLowerCase().includes("delivery") ||
                template.phase?.toLowerCase().includes("client")
              );
            case "coverage":
              return (
                template.phase?.toLowerCase().includes("coverage") ||
                template.phase?.toLowerCase().includes("scene")
              );
            case "footage":
              return (
                template.phase?.toLowerCase().includes("footage") ||
                template.phase?.toLowerCase().includes("capture")
              );
            case "processing":
              return (
                template.phase?.toLowerCase().includes("process") ||
                template.phase?.toLowerCase().includes("review")
              );
            case "general":
            default:
              return true; // Return all if general or no specific category
          }
        });

        return {
          success: true,
          data: filteredTemplates,
          meta: {
            category,
            count: filteredTemplates.length,
            totalAvailable: templates.length,
          },
        };
      }

      return {
        success: true,
        data: templates,
        meta: {
          count: templates.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get task templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all available task templates
  @Get()
  async getAllTaskTemplates() {
    try {
      const templates = await this.defaultTasksService.getAvailableTaskTemplates();
      return {
        success: true,
        data: templates,
        meta: {
          count: templates.length,
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
