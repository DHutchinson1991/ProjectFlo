import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface UsageData {
  content_id?: number;
  build_id?: number;
  actual_duration_seconds?: number;
  estimated_duration_seconds?: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  // Component Usage Analytics
  async incrementComponentUsage(componentId: number) {
    return this.prisma.componentLibrary.update({
      where: { id: componentId },
      data: {
        usage_count: {
          increment: 1,
        },
        last_used_at: new Date(),
      },
    });
  }

  async getComponentAnalytics(componentId: number) {
    const component = await this.prisma.componentLibrary.findUnique({
      where: { id: componentId },
      include: {
        usage_analytics: {
          orderBy: { usage_date: 'desc' },
          take: 10,
        },
        parent_dependencies: {
          include: {
            dependent_component: {
              select: { name: true },
            },
          },
        },
        dependent_components: {
          include: {
            parent_component: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!component) {
      throw new Error('Component not found');
    }

    // Calculate performance metrics
    const totalUsage = component.usage_count || 0;
    const recentUsage = component.usage_analytics.length;
    const averageTaskHours = Number(component.computed_total_hours) || 0;

    return {
      component: {
        id: component.id,
        name: component.name,
        type: component.type,
        usage_count: totalUsage,
        performance_score: component.performance_score,
        computed_task_count: component.computed_task_count,
        computed_total_hours: component.computed_total_hours,
        complexity_score: component.complexity_score,
        last_used_at: component.last_used_at,
      },
      metrics: {
        total_usage: totalUsage,
        recent_usage: recentUsage,
        average_task_hours: averageTaskHours,
        efficiency_score: averageTaskHours > 0 ? (totalUsage / averageTaskHours) * 10 : 0,
      },
      usage_history: component.usage_analytics,
      dependencies: {
        depends_on: component.parent_dependencies,
        depended_by: component.dependent_components,
      },
    };
  }

  async getComponentsOverview() {
    const components = await this.prisma.componentLibrary.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        is_coverage_linked: true,
        usage_count: true,
        performance_score: true,
        computed_task_count: true,
        computed_total_hours: true,
        complexity_score: true,
        created_at: true,
        last_used_at: true,
      },
      orderBy: { usage_count: 'desc' },
    });

    // Calculate overview statistics
    const totalComponents = components.length;
    const coverageLinkedCount = components.filter(c => c.is_coverage_linked === true).length;
    const videoCount = components.filter(c => c.type === 'VIDEO').length;
    const totalUsage = components.reduce((sum, c) => sum + (c.usage_count || 0), 0);
    const averagePerformanceScore = components.reduce((sum, c) => sum + (Number(c.performance_score) || 0), 0) / totalComponents;

    return {
      overview: {
        total_components: totalComponents,
        coverage_linked_count: coverageLinkedCount,
        video_count: videoCount,
        total_usage: totalUsage,
        average_performance_score: Math.round(averagePerformanceScore * 10) / 10,
      },
      top_components: components.slice(0, 10),
      recent_components: components.sort((a, b) => {
        const aDate = a.last_used_at || a.created_at;
        const bDate = b.last_used_at || b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }).slice(0, 5),
    };
  }

  async recordComponentUsage(componentId: number, usageData: UsageData = {}) {
    // Record detailed usage analytics
    await this.prisma.componentUsageAnalytics.create({
      data: {
        component_id: componentId,
        used_in_content_id: usageData.content_id,
        used_in_build_id: usageData.build_id,
        actual_duration_seconds: usageData.actual_duration_seconds,
        estimated_duration_seconds: usageData.estimated_duration_seconds,
        usage_date: new Date(),
      },
    });

    // Update component usage count
    return this.incrementComponentUsage(componentId);
  }

  async updateComponentPerformanceScore(componentId: number, score: number) {
    if (score < 1 || score > 10) {
      throw new Error('Performance score must be between 1 and 10');
    }

    return this.prisma.componentLibrary.update({
      where: { id: componentId },
      data: {
        performance_score: score,
      },
    });
  }
}
