import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TimelineService } from './timeline.service';

// DTOs for Timeline management
export class CreateTimelineComponentDto {
  deliverable_id: number;
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

@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  // Timeline Components
  @Post('components')
  createTimelineComponent(@Body() createDto: CreateTimelineComponentDto) {
    return this.timelineService.createTimelineComponent(createDto);
  }

  @Get('deliverables/:id/components')
  getTimelineComponentsForDeliverable(@Param('id', ParseIntPipe) deliverableId: number) {
    return this.timelineService.getTimelineComponentsForDeliverable(deliverableId);
  }

  @Get('components/:id')
  getTimelineComponent(@Param('id', ParseIntPipe) id: number) {
    return this.timelineService.getTimelineComponent(id);
  }

  @Patch('components/:id')
  updateTimelineComponent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTimelineComponentDto,
  ) {
    return this.timelineService.updateTimelineComponent(id, updateDto);
  }

  @Delete('components/:id')
  removeTimelineComponent(@Param('id', ParseIntPipe) id: number) {
    return this.timelineService.removeTimelineComponent(id);
  }

  // Timeline Layers
  @Get('layers')
  getTimelineLayers() {
    return this.timelineService.getTimelineLayers();
  }

  @Post('layers')
  createTimelineLayer(@Body() createDto: CreateTimelineLayerDto) {
    return this.timelineService.createTimelineLayer(createDto);
  }

  @Patch('layers/:id')
  updateTimelineLayer(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateTimelineLayerDto>,
  ) {
    return this.timelineService.updateTimelineLayer(id, updateDto);
  }

  @Delete('layers/:id')
  removeTimelineLayer(@Param('id', ParseIntPipe) id: number) {
    return this.timelineService.removeTimelineLayer(id);
  }

  // Timeline Analytics
  @Get('deliverables/:id/analytics')
  getTimelineAnalytics(@Param('id', ParseIntPipe) deliverableId: number) {
    return this.timelineService.getTimelineAnalytics(deliverableId);
  }

  // Timeline Validation
  @Post('deliverables/:id/validate')
  validateTimeline(@Param('id', ParseIntPipe) deliverableId: number) {
    return this.timelineService.validateTimeline(deliverableId);
  }
}
