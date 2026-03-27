import {
  Controller, Get, Post, Patch,
  Body, Param, ParseIntPipe, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentSchedulesService } from './payment-schedules.service';
import { ApplyScheduleToEstimateDto } from './dto/apply-schedule-to-estimate.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/estimates')
export class EstimateMilestonesController {
  constructor(private readonly svc: PaymentSchedulesService) {}

  @Get(':estimateId/milestones')
  getMilestones(@Param('estimateId', ParseIntPipe) estimateId: number) {
    return this.svc.getMilestonesForEstimate(estimateId);
  }

  @Post(':estimateId/apply-schedule')
  applySchedule(
    @Param('estimateId', ParseIntPipe) estimateId: number,
    @Body(new ValidationPipe({ transform: true })) dto: ApplyScheduleToEstimateDto,
  ) {
    return this.svc.applyToEstimate(estimateId, dto);
  }

  @Patch('milestones/:milestoneId/status')
  updateStatus(
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body('status') status: string,
  ) {
    return this.svc.updateMilestoneStatus(milestoneId, status);
  }
}
