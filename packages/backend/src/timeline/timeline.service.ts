import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  CreateTimelineComponentDto,
  UpdateTimelineComponentDto,
  CreateTimelineLayerDto,
} from "./timeline.controller";

// Define a type for timeline components used in analytics/validation
export interface TimelineComponent {
  id: number;
  content_id: number;
  layer_id: number;
  start_time_seconds: number;
  duration_seconds: number;
  component: { name: string };
  layer: { name: string; order_index: number };
  // Add other properties as needed
}

// Define return type for timeline analytics
export interface TimelineAnalytics {
  totalDuration: number;
  totalComponents: number;
  layerStats: Record<string, { count: number; totalDuration: number }>;
  componentStats: Record<string, { count: number; totalDuration: number }>;
  timelineHealth: {
    hasGaps: { start: number; end: number; duration: number }[];
    hasOverlaps: {
      component1: TimelineComponent;
      component2: TimelineComponent;
      overlapDuration: number;
    }[];
  };
}

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) { }

  // Timeline Components
  async createTimelineComponent(createDto: CreateTimelineComponentDto) {
    // Validate that the timecode aligns to 5-second snapping
    if (createDto.start_time_seconds % 5 !== 0) {
      throw new ConflictException(
        "Start time must be aligned to 5-second intervals",
      );
    }

    // Check for overlaps on the same layer
    const existingComponent = await this.prisma.timelineComponent.findFirst({
      where: {
        content_id: createDto.content_id,
        layer_id: createDto.layer_id,
        start_time_seconds: createDto.start_time_seconds,
      },
    });

    if (existingComponent) {
      throw new ConflictException(
        "Another component already exists at this position",
      );
    }

    return this.prisma.timelineComponent.create({
      data: createDto,
      include: {
        component: true,
        layer: true,
        content: true,
      },
    });
  }

  async getTimelineComponentsForContent(contentId: number) {
    return this.prisma.timelineComponent.findMany({
      where: { content_id: contentId },
      include: {
        component: true,
        layer: true,
      },
      orderBy: [
        { layer: { order_index: "asc" } },
        { start_time_seconds: "asc" },
      ],
    });
  }

  async getTimelineComponent(id: number) {
    const component = await this.prisma.timelineComponent.findUnique({
      where: { id },
      include: {
        component: true,
        layer: true,
        content: true,
      },
    });

    if (!component) {
      throw new NotFoundException("Timeline component not found");
    }

    return component;
  }

  async updateTimelineComponent(
    id: number,
    updateDto: UpdateTimelineComponentDto,
  ) {
    // Validate 5-second snapping if start_time is being updated
    if (
      updateDto.start_time_seconds &&
      updateDto.start_time_seconds % 5 !== 0
    ) {
      throw new ConflictException(
        "Start time must be aligned to 5-second intervals",
      );
    }

    // Check for overlaps if position is changing
    if (updateDto.start_time_seconds || updateDto.layer_id) {
      const current = await this.getTimelineComponent(id);
      const newStartTime =
        updateDto.start_time_seconds ?? current.start_time_seconds;
      const newLayerId = updateDto.layer_id ?? current.layer_id;

      const existingComponent = await this.prisma.timelineComponent.findFirst({
        where: {
          content_id: current.content_id,
          layer_id: newLayerId,
          start_time_seconds: newStartTime,
          NOT: { id },
        },
      });

      if (existingComponent) {
        throw new ConflictException(
          "Another component already exists at this position",
        );
      }
    }

    return this.prisma.timelineComponent.update({
      where: { id },
      data: updateDto,
      include: {
        component: true,
        layer: true,
        content: true,
      },
    });
  }

  async removeTimelineComponent(id: number) {
    try {
      return await this.prisma.timelineComponent.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException("Timeline component not found");
    }
  }

  // Timeline Layers
  async getTimelineLayers() {
    return this.prisma.timelineLayer.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
    });
  }

  async createTimelineLayer(createDto: CreateTimelineLayerDto) {
    return this.prisma.timelineLayer.create({
      data: createDto,
    });
  }

  async updateTimelineLayer(
    id: number,
    updateDto: Partial<CreateTimelineLayerDto>,
  ) {
    try {
      return await this.prisma.timelineLayer.update({
        where: { id },
        data: updateDto,
      });
    } catch {
      throw new NotFoundException("Timeline layer not found");
    }
  }

  async removeTimelineLayer(id: number) {
    // Check if layer is in use
    const componentCount = await this.prisma.timelineComponent.count({
      where: { layer_id: id },
    });

    if (componentCount > 0) {
      throw new ConflictException(
        "Cannot delete layer that contains components",
      );
    }

    try {
      return await this.prisma.timelineLayer.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException("Timeline layer not found");
    }
  }

  // Timeline Analytics
  async getTimelineAnalytics(
    contentId: number,
  ): Promise<TimelineAnalytics> {
    const components = (await this.getTimelineComponentsForContent(
      contentId,
    )) as TimelineComponent[];

    // Calculate timeline statistics
    const totalDuration = Math.max(
      ...components.map((c) => c.start_time_seconds + c.duration_seconds),
      0,
    );

    const layerStats = components.reduce(
      (acc, component) => {
        const layerName = component.layer.name;
        if (!acc[layerName]) {
          acc[layerName] = { count: 0, totalDuration: 0 };
        }
        acc[layerName].count++;
        acc[layerName].totalDuration += component.duration_seconds;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>,
    );

    const componentStats = components.reduce(
      (acc, component) => {
        const componentName = component.component.name;
        if (!acc[componentName]) {
          acc[componentName] = { count: 0, totalDuration: 0 };
        }
        acc[componentName].count++;
        acc[componentName].totalDuration += component.duration_seconds;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>,
    );

    return {
      totalDuration,
      totalComponents: components.length,
      layerStats,
      componentStats,
      timelineHealth: {
        hasGaps: this.detectTimelineGaps(components),
        hasOverlaps: this.detectTimelineOverlaps(components),
      },
    };
  }

  // Timeline Validation
  async validateTimeline(contentId: number) {
    const components = (await this.getTimelineComponentsForContent(
      contentId,
    )) as TimelineComponent[];

    const issues: string[] = [];

    // Check for gaps
    const gaps = this.detectTimelineGaps(components);
    if (gaps.length > 0) {
      issues.push(`Found ${gaps.length} gaps in timeline`);
    }

    // Check for overlaps
    const overlaps = this.detectTimelineOverlaps(components);
    if (overlaps.length > 0) {
      issues.push(`Found ${overlaps.length} overlapping components`);
    }

    // Components without workflow tasks will now be managed by UniversalWorkflowManager
    // This validation is less relevant since task management is handled by workflows
    const componentsWithoutWorkflow = []; // Could be enhanced to check workflow assignments
    if (componentsWithoutWorkflow.length > 0) {
      issues.push(
        `${componentsWithoutWorkflow.length} components may need workflow assignment`,
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      totalComponents: components.length,
    };
  }

  private detectTimelineGaps(
    components: TimelineComponent[],
  ): { start: number; end: number; duration: number }[] {
    // Sort components by layer and start time
    const sortedComponents = components.sort((a, b) => {
      if (a.layer_id !== b.layer_id) return a.layer_id - b.layer_id;
      return a.start_time_seconds - b.start_time_seconds;
    });

    const gaps: { start: number; end: number; duration: number }[] = [];
    let lastEndTime = 0;

    for (const component of sortedComponents) {
      if (component.start_time_seconds > lastEndTime) {
        gaps.push({
          start: lastEndTime,
          end: component.start_time_seconds,
          duration: component.start_time_seconds - lastEndTime,
        });
      }
      lastEndTime = Math.max(
        lastEndTime,
        component.start_time_seconds + component.duration_seconds,
      );
    }

    return gaps;
  }

  private detectTimelineOverlaps(components: TimelineComponent[]): {
    component1: TimelineComponent;
    component2: TimelineComponent;
    overlapDuration: number;
  }[] {
    const overlaps: {
      component1: TimelineComponent;
      component2: TimelineComponent;
      overlapDuration: number;
    }[] = [];

    // Group by layer
    const layerGroups = components.reduce(
      (acc, component) => {
        if (!acc[component.layer_id]) acc[component.layer_id] = [];
        acc[component.layer_id].push(component);
        return acc;
      },
      {} as Record<number, TimelineComponent[]>,
    );

    // Check for overlaps within each layer
    Object.values(layerGroups).forEach(
      (layerComponents: TimelineComponent[]) => {
        layerComponents.sort(
          (a, b) => a.start_time_seconds - b.start_time_seconds,
        );

        for (let i = 0; i < layerComponents.length - 1; i++) {
          const current = layerComponents[i];
          const next = layerComponents[i + 1];

          const currentEnd =
            current.start_time_seconds + current.duration_seconds;
          if (currentEnd > next.start_time_seconds) {
            overlaps.push({
              component1: current,
              component2: next,
              overlapDuration: currentEnd - next.start_time_seconds,
            });
          }
        }
      },
    );

    return overlaps;
  }
}
