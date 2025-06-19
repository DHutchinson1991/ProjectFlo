import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

export class RecordUsageDto {
  deliverable_id?: number;
  build_id?: number;
  actual_duration_seconds?: number;
  estimated_duration_seconds?: number;
}

export class UpdatePerformanceScoreDto {
  score: number;
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('components/overview')
  getComponentsOverview() {
    return this.analyticsService.getComponentsOverview();
  }

  @Get('components/:id')
  getComponentAnalytics(@Param('id', ParseIntPipe) componentId: number) {
    return this.analyticsService.getComponentAnalytics(componentId);
  }

  @Post('components/:id/usage')
  recordComponentUsage(
    @Param('id', ParseIntPipe) componentId: number,
    @Body() recordUsageDto: RecordUsageDto,
  ) {
    return this.analyticsService.recordComponentUsage(componentId, recordUsageDto);
  }

  @Post('components/:id/performance-score')
  updatePerformanceScore(
    @Param('id', ParseIntPipe) componentId: number,
    @Body() updateScoreDto: UpdatePerformanceScoreDto,
  ) {
    return this.analyticsService.updateComponentPerformanceScore(componentId, updateScoreDto.score);
  }
}
