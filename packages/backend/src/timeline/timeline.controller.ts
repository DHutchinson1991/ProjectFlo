import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import { TimelineService, TimelineAnalytics } from "./timeline.service";

// DTOs for Timeline management
export class CreateTimelineComponentDto {
  content_id: number;
  component_id: number;
  layer_id: number;
  start_time_seconds: number;
  duration_seconds: number;
  notes?: string;
}

export class UpdateTimelineComponentDto {
  start_time_seconds?: number;
  duration_seconds?: number;
  layer_id?: number;
  order_index?: number;
  notes?: string;
}

export class CreateTimelineLayerDto {
  name: string;
  order_index: number;
  color_hex: string;
  description?: string;
}

@Controller("timeline")
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) { }

  // Timeline Components
  @Post("components")
  createTimelineComponent(@Body() createDto: CreateTimelineComponentDto) {
    return this.timelineService.createTimelineComponent(createDto);
  }

  @Get("content/:id/components")
  getTimelineComponentsForContent(
    @Param("id", ParseIntPipe) contentId: number,
  ) {
    return this.timelineService.getTimelineComponentsForContent(
      contentId,
    );
  }

  @Get("components/:id")
  getTimelineComponent(@Param("id", ParseIntPipe) id: number) {
    return this.timelineService.getTimelineComponent(id);
  }

  @Patch("components/:id")
  updateTimelineComponent(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTimelineComponentDto,
  ) {
    return this.timelineService.updateTimelineComponent(id, updateDto);
  }

  @Delete("components/:id")
  removeTimelineComponent(@Param("id", ParseIntPipe) id: number) {
    return this.timelineService.removeTimelineComponent(id);
  }

  // Timeline Layers
  @Get("layers")
  getTimelineLayers() {
    return this.timelineService.getTimelineLayers();
  }

  @Post("layers")
  createTimelineLayer(@Body() createDto: CreateTimelineLayerDto) {
    return this.timelineService.createTimelineLayer(createDto);
  }

  @Patch("layers/:id")
  updateTimelineLayer(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateTimelineLayerDto>,
  ) {
    return this.timelineService.updateTimelineLayer(id, updateDto);
  }

  @Delete("layers/:id")
  removeTimelineLayer(@Param("id", ParseIntPipe) id: number) {
    return this.timelineService.removeTimelineLayer(id);
  }

  // Timeline Analytics
  @Get("content/:id/analytics")
  getTimelineAnalytics(
    @Param("id", ParseIntPipe) contentId: number,
  ): Promise<TimelineAnalytics> {
    return this.timelineService.getTimelineAnalytics(contentId);
  }

  // Timeline Validation
  @Post("content/:id/validate")
  validateTimeline(@Param("id", ParseIntPipe) contentId: number) {
    return this.timelineService.validateTimeline(contentId);
  }
}
